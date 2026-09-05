import { createHmac, timingSafeEqual } from "node:crypto";
import { decryptAgencyCredential } from "./agency-credentials";
import { createAgencyWhatsAppLog, getAgencyWhatsAppConfig, updateAgencyWhatsAppLogStatus } from "./db";
import { notificationSkipSummary } from "./agency-shipment-notification-policy";

type MetaGraphError = { error?: { code?: number; error_subcode?: number } };

export function verifyMetaWebhookSignature(rawBody: Buffer, signature: string | undefined, appSecret: string) {
  if (!signature?.startsWith("sha256=")) return false;
  const expected = Buffer.from(`sha256=${createHmac("sha256", appSecret).update(rawBody).digest("hex")}`);
  const received = Buffer.from(signature);
  return expected.length === received.length && timingSafeEqual(expected, received);
}

/** Vérifie le jeton et le numéro Meta sans envoyer de message à un client. */
export async function validateAgencyMetaConnection(agencyId: string) {
  const config = await getAgencyWhatsAppConfig(agencyId);
  if (!config?.accessTokenCiphertext || !config.phoneNumberId || !config.utilityTemplateName) {
    throw new Error("Validation Meta impossible : jeton, numéro professionnel ou modèle de message manquant.");
  }
  if (!config.appSecretCiphertext || !config.verifyTokenCiphertext) {
    throw new Error("Validation Meta impossible : secret d’application ou jeton de webhook manquant.");
  }
  const accessToken = decryptAgencyCredential(config.accessTokenCiphertext);
  const response = await fetch(`https://graph.facebook.com/v24.0/${encodeURIComponent(config.phoneNumberId)}?fields=id`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => null) as MetaGraphError | null;
    const code = payload?.error?.code ?? response.status;
    throw new Error(`Meta a refusé la connexion au numéro professionnel (code ${code}). Vérifiez le jeton et les droits WhatsApp Business.`);
  }
  await createAgencyWhatsAppLog({ agencyId, direction: "outbound", eventType: "meta_connection_validated", status: "queued", sanitizedSummary: "Connexion API Meta validée ; validation du webhook toujours requise" });
  return { ok: true as const, message: "Connexion API Meta validée. Configurez ou confirmez maintenant le webhook Meta pour pouvoir activer le canal." };
}

export async function sendAgencyShipmentUpdate(input: { agencyId: string; shipmentId: string; customerPhone: string | null; customerName: string; trackingNumber: string; status: string; publicTrackingUrl: string | null }) {
  if (!input.customerPhone) {
    await createAgencyWhatsAppLog({ agencyId: input.agencyId, shipmentId: input.shipmentId, direction: "outbound", eventType: "shipment_update_skipped", status: "queued", sanitizedSummary: notificationSkipSummary("no_customer_phone") });
    return { sent: false as const, reason: "no_customer_phone" };
  }
  const config = await getAgencyWhatsAppConfig(input.agencyId);
  if (!config || config.status !== "active" || !config.phoneNumberId || !config.utilityTemplateName || !config.accessTokenCiphertext) {
    await createAgencyWhatsAppLog({ agencyId: input.agencyId, shipmentId: input.shipmentId, recipientPhone: input.customerPhone, direction: "outbound", eventType: "shipment_update_skipped", status: "queued", sanitizedSummary: notificationSkipSummary("channel_inactive") });
    return { sent: false as const, reason: "channel_inactive" };
  }
  const accessToken = decryptAgencyCredential(config.accessTokenCiphertext);
  const body = { messaging_product: "whatsapp", to: input.customerPhone.replace(/\D/g, ""), type: "template", template: { name: config.utilityTemplateName, language: { code: "fr" }, components: [{ type: "body", parameters: [{ type: "text", text: input.customerName }, { type: "text", text: input.trackingNumber }, { type: "text", text: input.status }, { type: "text", text: input.publicTrackingUrl ?? "Suivi disponible dans GlobalLogix" }] }] } };
  const response = await fetch(`https://graph.facebook.com/v24.0/${config.phoneNumberId}/messages`, { method: "POST", headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const payload = await response.json().catch(() => null) as { messages?: Array<{ id?: string }>; error?: { code?: number } } | null;
  const providerMessageId = payload?.messages?.[0]?.id ?? null;
  await createAgencyWhatsAppLog({ agencyId: input.agencyId, shipmentId: input.shipmentId, recipientPhone: input.customerPhone, direction: "outbound", eventType: "shipment_update", templateName: config.utilityTemplateName, providerMessageId, status: response.ok ? "sent" : "failed", sanitizedSummary: `Mise à jour ${input.status}`, errorCode: response.ok ? null : String(payload?.error?.code ?? response.status) });
  return { sent: response.ok, reason: response.ok ? null : "meta_rejected", providerMessageId };
}

export async function applyMetaMessageStatus(input: { providerMessageId: string; status: "sent" | "delivered" | "read" | "failed"; errorCode?: string | null }) {
  await updateAgencyWhatsAppLogStatus(input);
}
