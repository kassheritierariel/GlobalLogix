import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { randomUUID } from "node:crypto";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { createAgencyMember, createInitialAgencyAdmin, listAgencyMembers, normalizeAgencyId, requestFirebasePasswordReset, requestFirebasePasswordResetForUid, setAgencyMemberDisabled, setClientClaims, setGlobalLogixClaims, updateAgencyMemberRole, verifyFirebaseAuthorization, verifyFirebaseIdentity } from "../firebase-admin";
import { activateAgencyWhatsAppChannel, applySaasPaymentEvent, createAgencyRegistrationRequest, createAgencyWhatsAppLog, createSaasCheckoutIntent, createShipmentShareLink, decideAgencyRegistrationRequest, getAgencyAnalytics, getAgencyClientDetail, getAgencyProfile, getAgencyProfileByPublicSlug, getAgencyRegistrationRequest, getAgencySubscription, getAgencyWhatsAppConfig, getAgencyWhatsAppConfigSummary, getCentralConsoleAnalytics, getClientShipment, getLatestAgencyWhatsAppActivity, getSharedShipment, getShipment, listAgencyClients, listAgencyProfiles, listAgencyRegistrationRequests, listAgencySaasTransactions, listAgencyWhatsAppLogs, listClientShipments, listExceptions, listShipmentEvents, listShipments, markAgencyWhatsAppMetaValidated, markSaasCheckoutAwaitingPayment, recordShipmentEvent, registerClientShipment, registerPushToken, transitionException, updateShipmentCustomerPhone, upsertAgencyProfile, upsertAgencyWhatsAppConfig, upsertClientAccount } from "../db";
import { assertChariowCheckoutConfiguration, createChariowCheckout } from "../chariow-api";
import { amountToMinorUnits, mapChariowPulseStatus, verifyChariowPulseSignature, type ChariowPulsePayload } from "../chariow-pulse";
import { getSaaSPlan, SaaSPlanIds, BillingCycles, type BillingCycle, type SaaSPlanId } from "../../lib/saas-plans";
import { registerRealtimeServer } from "../realtime";
import { assertAgencyMemberRole, resolveAgencyManagementScope } from "../user-management-policy";
import { assertSuperAdminAgencyPreview } from "../agency-preview-policy";
import { requireClientPhone } from "../client-access-policy";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { storagePut } from "../storage";
import { decryptAgencyCredential } from "../agency-credentials";
import { applyMetaMessageStatus, sendAgencyShipmentUpdate, validateAgencyMetaConnection, verifyMetaWebhookSignature } from "../agency-whatsapp";
import { shouldNotifyAgencyShipmentEvent } from "../agency-shipment-notification-policy";
import { createAgencyWhatsAppSimulation, WHATSAPP_SIMULATION_EVENT_TYPES } from "../agency-whatsapp-simulation-policy";
import { notifyOwner } from "./notification";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  registerRealtimeServer(server);

  // Enable CORS for all routes - reflect the request origin to support credentials
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin) {
      res.header("Access-Control-Allow-Origin", origin);
    }
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, Authorization",
    );
    res.header("Access-Control-Allow-Credentials", "true");

    // Handle preflight requests
    if (req.method === "OPTIONS") {
      res.sendStatus(200);
      return;
    }
    next();
  });

  app.use(express.json({ limit: "50mb", verify: (req, _res, buffer) => { (req as express.Request & { rawBody?: Buffer }).rawBody = Buffer.from(buffer); } }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  registerStorageProxy(app);
  registerOAuthRoutes(app);

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, timestamp: Date.now() });
  });

  app.post("/api/agency-registration-request", async (req, res) => {
    try {
      const principal = await verifyFirebaseIdentity(req.headers.authorization);
      if (!principal.email) throw new Error("Cette demande exige un compte Google ou e-mail vérifié.");
      const agencyName = typeof req.body.agencyName === "string" ? req.body.agencyName.trim() : "";
      const publicEmail = typeof req.body.publicEmail === "string" ? req.body.publicEmail.trim().toLowerCase() : "";
      const city = typeof req.body.city === "string" ? req.body.city.trim() : "";
      if (agencyName.length < 2 || agencyName.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(publicEmail) || city.length < 2 || city.length > 120) throw new Error("Vérifiez le nom, l’e-mail public et la ville de l’agence.");
      const { request, deduplicated } = await createAgencyRegistrationRequest({ requesterFirebaseUid: principal.uid, requesterEmail: principal.email, requesterDisplayName: principal.displayName, agencyName, publicEmail, city });
      if (!deduplicated) await notifyOwner({ title: "Nouvelle demande d’agence GlobalLogix", content: `Demande ${agencyName} · ville ${city} · e-mail public ${publicEmail} · compte administrateur ${principal.email}. Validez-la depuis les demandes d’agence.` });
      res.status(202).json({ submitted: true, deduplicated, request: { id: request.id, status: request.status, createdAt: request.createdAt } });
    } catch (error) { res.status(400).json({ error: error instanceof Error ? error.message : "Demande d’agence impossible" }); }
  });

  app.get("/api/public/agencies/:publicSlug", async (req, res) => {
    try {
      const profile = await getAgencyProfileByPublicSlug(req.params.publicSlug);
      if (!profile) {
        res.status(404).json({ error: "Espace d’agence introuvable" });
        return;
      }
      res.status(200).json({ agency: {
        publicSlug: profile.publicSlug, displayName: profile.displayName, legalName: profile.legalName,
        publicEmail: profile.publicEmail, publicPhone: profile.publicPhone, website: profile.website,
        logoUrl: profile.logoUrl, primaryColor: profile.primaryColor, timeZone: profile.timeZone, supportHours: profile.supportHours,
      } });
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Lien d’agence invalide" });
    }
  });

  app.get("/api/webhooks/whatsapp/:agencyId", async (req, res) => {
    try {
      const config = await getAgencyWhatsAppConfig(req.params.agencyId);
      const challenge = typeof req.query["hub.challenge"] === "string" ? req.query["hub.challenge"] : "";
      const verifyToken = typeof req.query["hub.verify_token"] === "string" ? req.query["hub.verify_token"] : "";
      if (req.query["hub.mode"] !== "subscribe" || !challenge || !config?.verifyTokenCiphertext || decryptAgencyCredential(config.verifyTokenCiphertext) !== verifyToken) {
        res.sendStatus(403);
        return;
      }
      await markAgencyWhatsAppMetaValidated(req.params.agencyId);
      res.status(200).send(challenge);
    } catch { res.sendStatus(403); }
  });

  app.post("/api/webhooks/whatsapp/:agencyId", async (req, res) => {
    try {
      const config = await getAgencyWhatsAppConfig(req.params.agencyId);
      const rawBody = (req as express.Request & { rawBody?: Buffer }).rawBody;
      if (!config?.appSecretCiphertext || !rawBody || !verifyMetaWebhookSignature(rawBody, req.header("x-hub-signature-256"), decryptAgencyCredential(config.appSecretCiphertext))) {
        res.sendStatus(403);
        return;
      }
      const payload = req.body as {
        entry?: Array<{
          changes?: Array<{
            value?: {
              statuses?: Array<{ id?: string; status?: string; errors?: Array<{ code?: number }> }>;
              messages?: Array<{ id?: string; from?: string; type?: string }>;
            };
          }>;
        }>;
      };
      for (const entry of payload.entry ?? []) for (const change of entry.changes ?? []) {
        for (const status of change.value?.statuses ?? []) {
          if (!status.id || !["sent", "delivered", "read", "failed"].includes(status.status ?? "")) continue;
          await applyMetaMessageStatus({ providerMessageId: status.id, status: status.status as "sent" | "delivered" | "read" | "failed", errorCode: status.errors?.[0]?.code ? String(status.errors[0].code) : null });
        }
        for (const message of change.value?.messages ?? []) {
          if (!message.id) continue;
          await createAgencyWhatsAppLog({ agencyId: req.params.agencyId, recipientPhone: message.from ?? null, direction: "inbound", eventType: `client_${message.type ?? "message"}`, providerMessageId: message.id, status: "received", sanitizedSummary: "Message client reçu" });
        }
      }
      res.sendStatus(200);
    } catch { res.sendStatus(200); }
  });

  app.get("/api/agency/profile", async (req, res) => {
    try {
      const principal = await verifyFirebaseAuthorization(req.headers.authorization);
      const requestedAgencyId = typeof req.query.agencyId === "string" ? req.query.agencyId : undefined;
      const agencyId = resolveAgencyManagementScope(principal, requestedAgencyId);
      res.status(200).json({ agencyId, profile: await getAgencyProfile(agencyId) });
    } catch (error) {
      res.status(403).json({ error: error instanceof Error ? error.message : "Accès au profil d’agence refusé" });
    }
  });

  app.put("/api/agency/profile", async (req, res) => {
    try {
      const principal = await verifyFirebaseAuthorization(req.headers.authorization);
      const body = req.body as Record<string, unknown>;
      const requestedAgencyId = typeof body.agencyId === "string" ? body.agencyId : undefined;
      const agencyId = resolveAgencyManagementScope(principal, requestedAgencyId);
      const displayName = typeof body.displayName === "string" ? body.displayName.trim() : "";
      if (!displayName || displayName.length > 255) {
        res.status(400).json({ error: "Nom d’agence invalide" });
        return;
      }
      const primaryColor = typeof body.primaryColor === "string" && /^#[0-9A-Fa-f]{6}$/.test(body.primaryColor) ? body.primaryColor : null;
      const profile = await upsertAgencyProfile({
        agencyId, displayName, primaryColor,
        legalName: typeof body.legalName === "string" ? body.legalName : null,
        publicEmail: typeof body.publicEmail === "string" ? body.publicEmail : null,
        publicPhone: typeof body.publicPhone === "string" ? body.publicPhone : null,
        website: typeof body.website === "string" ? body.website : null,
        logoUrl: typeof body.logoUrl === "string" ? body.logoUrl : null,
        timeZone: typeof body.timeZone === "string" ? body.timeZone : null,
        supportHours: typeof body.supportHours === "string" ? body.supportHours : null,
      });
      res.status(200).json({ profile });
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Mise à jour du profil impossible" });
    }
  });

  app.post("/api/agency/logo", async (req, res) => {
    try {
      const principal = await verifyFirebaseAuthorization(req.headers.authorization);
      const body = req.body as { agencyId?: unknown; dataUrl?: unknown };
      const agencyId = resolveAgencyManagementScope(principal, typeof body.agencyId === "string" ? body.agencyId : undefined);
      if (typeof body.dataUrl !== "string") throw new Error("Image de logo manquante");
      const match = /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$/.exec(body.dataUrl);
      if (!match) throw new Error("Format de logo non pris en charge");
      const data = Buffer.from(match[2], "base64");
      if (!data.length || data.length > 2 * 1024 * 1024) throw new Error("Le logo doit peser au maximum 2 Mo");
      const extension = match[1] === "image/jpeg" ? "jpg" : match[1] === "image/webp" ? "webp" : "png";
      const stored = await storagePut(`agencies/${agencyId}/branding/logo.${extension}`, data, match[1]);
      const origin = `${req.protocol}://${req.get("host")}`;
      const previous = await getAgencyProfile(agencyId);
      const profile = await upsertAgencyProfile({ agencyId, displayName: previous?.displayName ?? agencyId, logoUrl: `${origin}${stored.url}` });
      res.status(201).json({ profile });
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Import du logo impossible" });
    }
  });

  app.get("/api/agency/whatsapp", async (req, res) => {
    try {
      const principal = await verifyFirebaseAuthorization(req.headers.authorization);
      const requestedAgencyId = typeof req.query.agencyId === "string" ? req.query.agencyId : undefined;
      const agencyId = resolveAgencyManagementScope(principal, requestedAgencyId);
      res.status(200).json({ agencyId, config: await getAgencyWhatsAppConfigSummary(agencyId) });
    } catch (error) {
      res.status(403).json({ error: error instanceof Error ? error.message : "Accès à WhatsApp Business refusé" });
    }
  });

  app.put("/api/agency/whatsapp", async (req, res) => {
    try {
      const principal = await verifyFirebaseAuthorization(req.headers.authorization);
      const body = req.body as Record<string, unknown>;
      const agencyId = resolveAgencyManagementScope(principal, typeof body.agencyId === "string" ? body.agencyId : undefined);
      const value = (key: string) => typeof body[key] === "string" ? body[key] : null;
      const config = await upsertAgencyWhatsAppConfig({
        agencyId, metaAppId: value("metaAppId"), businessAccountId: value("businessAccountId"), phoneNumberId: value("phoneNumberId"), senderPhone: value("senderPhone"),
        utilityTemplateName: value("utilityTemplateName"), accessToken: value("accessToken"), appSecret: value("appSecret"), verifyToken: value("verifyToken"), status: "draft",
      });
      await createAgencyWhatsAppLog({ agencyId, direction: "outbound", eventType: "configuration_updated", status: "queued", sanitizedSummary: "Configuration WhatsApp mise à jour" });
      res.status(200).json({ config });
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Configuration WhatsApp impossible" });
    }
  });

  app.get("/api/agency/whatsapp/logs", async (req, res) => {
    try {
      const principal = await verifyFirebaseAuthorization(req.headers.authorization);
      const requestedAgencyId = typeof req.query.agencyId === "string" ? req.query.agencyId : undefined;
      const agencyId = resolveAgencyManagementScope(principal, requestedAgencyId);
      res.status(200).json({ agencyId, logs: await listAgencyWhatsAppLogs(agencyId) });
    } catch (error) {
      res.status(403).json({ error: error instanceof Error ? error.message : "Accès au journal WhatsApp refusé" });
    }
  });

  app.post("/api/webhooks/chariow", async (req, res) => {
    const rawBody = (req as express.Request & { rawBody?: Buffer }).rawBody ?? Buffer.alloc(0);
    const signature = req.header("x-chariow-signature") ?? undefined;
    if (!verifyChariowPulseSignature(rawBody, signature, process.env.CHARIOW_PULSE_SECRET)) {
      res.status(401).send("Signature Chariow invalide");
      return;
    }
    const deliveryId = req.header("x-pulse-delivery-id") ?? undefined;
    if (!deliveryId) {
      res.status(200).json({ ok: true, test: true });
      return;
    }
    const payload = req.body as ChariowPulsePayload;
    const status = mapChariowPulseStatus(payload.event);
    const saleId = payload.sale?.id;
    if (!status || !saleId) {
      res.status(200).json({ ok: true, ignored: true });
      return;
    }
    try {
      const result = await applySaasPaymentEvent({
        providerEventId: deliveryId,
        saleId,
        status,
        currency: payload.sale?.amount?.currency ?? null,
        amountMinor: amountToMinorUnits(payload.sale?.amount?.value),
      });
      res.status(200).json({ ok: true, ...result });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Traitement Chariow impossible" });
    }
  });

  app.get("/api/saas/subscription", async (req, res) => {
    try {
      const principal = await verifyFirebaseAuthorization(req.headers.authorization);
      const requestedAgencyId = typeof req.query.agencyId === "string" ? req.query.agencyId : undefined;
      const agencyId = resolveAgencyManagementScope(principal, requestedAgencyId);
      const subscription = await getAgencySubscription(agencyId);
      res.status(200).json({ agencyId, subscription, plan: subscription ? getSaaSPlan(subscription.planId) ?? null : null });
    } catch (error) {
      res.status(403).json({ error: error instanceof Error ? error.message : "Accès à la souscription refusé" });
    }
  });

  app.get("/api/saas/transactions", async (req, res) => {
    try {
      const principal = await verifyFirebaseAuthorization(req.headers.authorization);
      const requestedAgencyId = typeof req.query.agencyId === "string" ? req.query.agencyId : undefined;
      const agencyId = resolveAgencyManagementScope(principal, requestedAgencyId);
      res.status(200).json({ agencyId, transactions: await listAgencySaasTransactions(agencyId) });
    } catch (error) {
      res.status(403).json({ error: error instanceof Error ? error.message : "Accès aux transactions refusé" });
    }
  });

  app.post("/api/saas/checkout", async (req, res) => {
    try {
      const principal = await verifyFirebaseAuthorization(req.headers.authorization);
      const { planId, billingCycle, phoneNumber, countryCode, agencyId: bodyAgencyId } = req.body as { planId?: unknown; billingCycle?: unknown; phoneNumber?: unknown; countryCode?: unknown; agencyId?: unknown };
      if (typeof planId !== "string" || !SaaSPlanIds.includes(planId as SaaSPlanId) || typeof billingCycle !== "string" || !BillingCycles.includes(billingCycle as BillingCycle)) {
        res.status(400).json({ error: "Plan ou périodicité invalide" });
        return;
      }
      if (typeof phoneNumber !== "string" || !/^\d{6,15}$/.test(phoneNumber) || typeof countryCode !== "string" || !/^[A-Z]{2}$/.test(countryCode)) {
        res.status(400).json({ error: "Téléphone ou pays de facturation invalide" });
        return;
      }
      const requestedAgencyId = typeof bodyAgencyId === "string" ? bodyAgencyId : undefined;
      const agencyId = resolveAgencyManagementScope(principal, requestedAgencyId);
      if (!principal.email) {
        res.status(400).json({ error: "Une adresse e-mail est requise pour créer le paiement" });
        return;
      }
      const normalizedPlanId = planId as SaaSPlanId;
      const normalizedBillingCycle = billingCycle as BillingCycle;
      const productId = assertChariowCheckoutConfiguration(normalizedPlanId, normalizedBillingCycle);
      const intent = await createSaasCheckoutIntent({ agencyId, planId: normalizedPlanId, billingCycle: normalizedBillingCycle, chariowProductId: productId });
      const words = (principal.displayName ?? "Administrateur GlobalLogix").trim().split(/\s+/);
      const origin = typeof req.headers.origin === "string" && req.headers.origin.startsWith("https://") ? req.headers.origin : `${req.protocol}://${req.get("host")}`;
      const checkout = await createChariowCheckout({
        productId,
        email: principal.email,
        firstName: words[0] || "Administrateur",
        lastName: words.slice(1).join(" ") || "GlobalLogix",
        phoneNumber,
        countryCode,
        redirectUrl: `${origin}/subscription?status=return`,
        metadata: { agency_id: agencyId, subscription_id: intent.subscriptionId, transaction_id: intent.transactionId, plan_id: normalizedPlanId, billing_cycle: normalizedBillingCycle },
      });
      if (checkout.step !== "payment" || !checkout.payment?.checkout_url || !checkout.purchase?.id) {
        res.status(502).json({ error: "Chariow n’a pas renvoyé de session de paiement valide" });
        return;
      }
      await markSaasCheckoutAwaitingPayment({ transactionId: intent.transactionId, agencyId, saleId: checkout.purchase.id, transactionProviderId: checkout.payment.transaction_id ?? null });
      res.status(201).json({ checkoutUrl: checkout.payment.checkout_url, transactionId: intent.transactionId });
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Création du paiement impossible" });
    }
  });

  app.post("/api/push-tokens", async (req, res) => {
    try {
      const principal = await verifyFirebaseAuthorization(req.headers.authorization);
      const { token, platform } = req.body as { token?: unknown; platform?: unknown };
      if (typeof token !== "string" || !token.startsWith("ExponentPushToken[") || token.length > 255) {
        res.status(400).json({ error: "Token Expo invalide" });
        return;
      }
      if (platform !== "ios" && platform !== "android") {
        res.status(400).json({ error: "Plateforme invalide" });
        return;
      }
      await registerPushToken({ uid: principal.uid, agencyId: principal.agencyId, token, platform: platform as "ios" | "android" });
      res.status(201).json({ ok: true });
    } catch (error) {
      res.status(401).json({ error: error instanceof Error ? error.message : "Non autorisé" });
    }
  });

  app.post("/api/client/account", async (req, res) => {
    try {
      const principal = await verifyFirebaseAuthorization(req.headers.authorization);
      const phoneNumber = requireClientPhone(principal);
      const displayName = typeof req.body?.displayName === "string" ? req.body.displayName.trim().slice(0, 255) : null;
      const account = await upsertClientAccount({ firebaseUid: principal.uid, phoneNumber, displayName });
      await setClientClaims(principal.uid);
      res.status(201).json({ account });
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Création du compte client impossible" });
    }
  });

  app.get("/api/client/shipments", async (req, res) => {
    try {
      const principal = await verifyFirebaseAuthorization(req.headers.authorization);
      if (principal.role !== "client") {
        res.status(403).json({ error: "Portail client requis" });
        return;
      }
      const slug = typeof req.query.agency === "string" ? req.query.agency : undefined;
      const agency = slug ? await getAgencyProfileByPublicSlug(slug) : null;
      if (slug && !agency) {
        res.status(404).json({ error: "Espace d’agence introuvable" });
        return;
      }
      res.status(200).json({ shipments: await listClientShipments(principal.uid, agency?.agencyId) });
    } catch (error) {
      res.status(401).json({ error: error instanceof Error ? error.message : "Non autorisé" });
    }
  });

  app.post("/api/client/shipments", async (req, res) => {
    try {
      const principal = await verifyFirebaseAuthorization(req.headers.authorization);
      const trackingNumber = typeof req.body?.trackingNumber === "string" ? req.body.trackingNumber : "";
      const phoneNumber = requireClientPhone(principal);
      const slug = typeof req.body?.agencySlug === "string" ? req.body.agencySlug : undefined;
      const agency = slug ? await getAgencyProfileByPublicSlug(slug) : null;
      if (slug && !agency) {
        res.status(404).json({ error: "Espace d’agence introuvable" });
        return;
      }
      const shipment = await registerClientShipment({ firebaseUid: principal.uid, phoneNumber, trackingNumber, agencyId: agency?.agencyId });
      res.status(201).json({ shipment });
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Enregistrement du colis impossible" });
    }
  });

  app.get("/api/client/shipments/:shipmentId", async (req, res) => {
    try {
      const principal = await verifyFirebaseAuthorization(req.headers.authorization);
      if (principal.role !== "client") {
        res.status(403).json({ error: "Portail client requis" });
        return;
      }
      const slug = typeof req.query.agency === "string" ? req.query.agency : undefined;
      const agency = slug ? await getAgencyProfileByPublicSlug(slug) : null;
      if (slug && !agency) {
        res.status(404).json({ error: "Espace d’agence introuvable" });
        return;
      }
      const shipment = await getClientShipment(principal.uid, req.params.shipmentId, agency?.agencyId);
      if (!shipment) {
        res.status(404).json({ error: "Expédition introuvable dans votre compte client" });
        return;
      }
      const events = await listShipmentEvents(shipment.id, shipment.agencyId);
      res.status(200).json({ shipment, events });
    } catch (error) {
      res.status(401).json({ error: error instanceof Error ? error.message : "Non autorisé" });
    }
  });

  app.get("/api/agency/clients", async (req, res) => {
    try {
      const principal = await verifyFirebaseAuthorization(req.headers.authorization);
      const requestedAgencyId = typeof req.query.agencyId === "string" ? req.query.agencyId : undefined;
      const agencyId = resolveAgencyManagementScope(principal, requestedAgencyId);
      res.status(200).json({ agencyId, clients: await listAgencyClients(agencyId) });
    } catch (error) {
      res.status(403).json({ error: error instanceof Error ? error.message : "Accès clients refusé" });
    }
  });

  app.get("/api/agency/clients/:firebaseUid", async (req, res) => {
    try {
      const principal = await verifyFirebaseAuthorization(req.headers.authorization);
      const requestedAgencyId = typeof req.query.agencyId === "string" ? req.query.agencyId : undefined;
      const agencyId = resolveAgencyManagementScope(principal, requestedAgencyId);
      const detail = await getAgencyClientDetail(agencyId, req.params.firebaseUid);
      if (!detail) {
        res.status(404).json({ error: "Client introuvable dans cette agence" });
        return;
      }
      res.status(200).json({ agencyId, ...detail });
    } catch (error) {
      res.status(403).json({ error: error instanceof Error ? error.message : "Accès client refusé" });
    }
  });

  app.get("/api/agency/analytics", async (req, res) => {
    try {
      const principal = await verifyFirebaseAuthorization(req.headers.authorization);
      const requestedAgencyId = typeof req.query.agencyId === "string" ? req.query.agencyId : undefined;
      const agencyId = resolveAgencyManagementScope(principal, requestedAgencyId);
      const period = typeof req.query.period === "string" && ["7d", "30d", "90d", "all", "custom"].includes(req.query.period) ? req.query.period as "7d" | "30d" | "90d" | "all" | "custom" : "30d";
      const startInput = typeof req.query.startDate === "string" ? req.query.startDate : "";
      const endInput = typeof req.query.endDate === "string" ? req.query.endDate : "";
      const parseDate = (value: string, endOfDay: boolean) => /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}Z`) : null;
      const start = parseDate(startInput, false);
      const end = parseDate(endInput, true);
      if (period === "custom" && (!start || !end || start > end || end.getTime() - start.getTime() > 366 * 24 * 60 * 60 * 1000)) throw new Error("Choisissez une période valide de 366 jours maximum.");
      res.status(200).json(await getAgencyAnalytics(agencyId, period, period === "custom" ? { start: start!, end: end! } : undefined));
    } catch (error) {
      res.status(403).json({ error: error instanceof Error ? error.message : "Accès analytique refusé" });
    }
  });

  app.post("/api/agency/whatsapp/simulate", async (req, res) => {
    try {
      const principal = await verifyFirebaseAuthorization(req.headers.authorization);
      const requestedAgencyId = typeof req.body?.agencyId === "string" ? req.body.agencyId : undefined;
      const agencyId = resolveAgencyManagementScope(principal, requestedAgencyId);
      const eventType = req.body?.eventType;
      if (typeof eventType !== "string" || !WHATSAPP_SIMULATION_EVENT_TYPES.includes(eventType as (typeof WHATSAPP_SIMULATION_EVENT_TYPES)[number])) {
        res.status(400).json({ error: "Type de notification simulée invalide." });
        return;
      }
      const simulation = createAgencyWhatsAppSimulation({ trackingNumber: typeof req.body?.trackingNumber === "string" ? req.body.trackingNumber : "", eventType: eventType as (typeof WHATSAPP_SIMULATION_EVENT_TYPES)[number], message: typeof req.body?.message === "string" ? req.body.message : "" });
      await createAgencyWhatsAppLog({ agencyId, direction: "outbound", eventType: "shipment_update_simulation", status: "queued", sanitizedSummary: simulation.sanitizedSummary });
      res.status(200).json(simulation);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Simulation WhatsApp impossible." });
    }
  });

  app.post("/api/admin/users/:uid/claims", async (req, res) => {
    try {
      const requester = await verifyFirebaseAuthorization(req.headers.authorization);
      if (requester.role !== "super_admin") {
        res.status(403).json({ error: "Super administrateur requis" });
        return;
      }
      const { role, agencyId = null, disabled = false } = req.body as {
        role?: unknown;
        agencyId?: unknown;
        disabled?: unknown;
      };
      if (!req.params.uid || typeof role !== "string" || !["super_admin", "agency_admin", "staff", "viewer"].includes(role)) {
        res.status(400).json({ error: "Rôle ou utilisateur invalide" });
        return;
      }
      if (agencyId !== null && typeof agencyId !== "string") {
        res.status(400).json({ error: "agencyId invalide" });
        return;
      }
      const claims = await setGlobalLogixClaims({
        uid: req.params.uid,
        role: role as "super_admin" | "agency_admin" | "staff" | "viewer",
        agencyId,
        disabled: disabled === true,
      });
      res.status(200).json({ ok: true, claims });
    } catch (error) {
      res.status(401).json({ error: error instanceof Error ? error.message : "Non autorisé" });
    }
  });

  app.get("/api/admin/agencies", async (req, res) => {
    try {
      const principal = await verifyFirebaseAuthorization(req.headers.authorization);
      assertSuperAdminAgencyPreview(principal);
      const profiles = await listAgencyProfiles();
      const agencies = await Promise.all(profiles.map(async (profile) => ({
        ...profile,
        subscription: await getAgencySubscription(profile.agencyId),
        whatsApp: await getAgencyWhatsAppConfigSummary(profile.agencyId),
        latestWhatsAppActivity: await getLatestAgencyWhatsAppActivity(profile.agencyId),
      })));
      res.status(200).json({ agencies });
    } catch (error) {
      res.status(403).json({ error: error instanceof Error ? error.message : "Accès aux agences refusé" });
    }
  });

  app.post("/api/admin/agencies/onboard", async (req, res) => {
    try {
      const principal = await verifyFirebaseAuthorization(req.headers.authorization);
      assertSuperAdminAgencyPreview(principal);
      const body = req.body as Record<string, unknown>;
      const agencyId = typeof body.agencyId === "string" ? normalizeAgencyId(body.agencyId) : "";
      const displayName = typeof body.displayName === "string" ? body.displayName.trim() : "";
      const adminEmail = typeof body.adminEmail === "string" ? body.adminEmail.trim().toLowerCase() : "";
      if (!displayName || displayName.length > 255 || !adminEmail) throw new Error("Nom commercial et e-mail de l’administrateur sont requis.");
      if (await getAgencyProfile(agencyId)) throw new Error("Ce code agence existe déjà.");
      const profile = await upsertAgencyProfile({
        agencyId,
        publicSlug: typeof body.publicSlug === "string" ? body.publicSlug : null,
        displayName,
        legalName: typeof body.legalName === "string" ? body.legalName : null,
        publicEmail: typeof body.publicEmail === "string" ? body.publicEmail : adminEmail,
        publicPhone: typeof body.publicPhone === "string" ? body.publicPhone : null,
        website: typeof body.website === "string" ? body.website : null,
        logoUrl: null,
        primaryColor: typeof body.primaryColor === "string" ? body.primaryColor : "#007FFF",
        timeZone: typeof body.timeZone === "string" ? body.timeZone : "Africa/Kinshasa",
        supportHours: typeof body.supportHours === "string" ? body.supportHours : null,
      });
      const admin = await createInitialAgencyAdmin({ email: adminEmail, agencyId });
      const invitation = await requestFirebasePasswordReset(admin.email);
      res.status(201).json({
        profile,
        admin: { uid: admin.uid, email: admin.email, created: admin.created, invitationRequested: invitation.requested },
        agencyPath: `/agency/${profile?.publicSlug}`,
      });
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Création de l’agence impossible" });
    }
  });

  app.get("/api/admin/agency-registration-requests", async (req, res) => {
    try {
      const principal = await verifyFirebaseAuthorization(req.headers.authorization);
      assertSuperAdminAgencyPreview(principal);
      const status = typeof req.query.status === "string" && ["pending", "approved", "rejected"].includes(req.query.status) ? req.query.status as "pending" | "approved" | "rejected" : "pending";
      res.status(200).json({ requests: await listAgencyRegistrationRequests(status) });
    } catch (error) { res.status(403).json({ error: error instanceof Error ? error.message : "Accès aux demandes d’agence refusé" }); }
  });

  app.post("/api/admin/agency-registration-requests/:id/approve", async (req, res) => {
    try {
      const principal = await verifyFirebaseAuthorization(req.headers.authorization);
      assertSuperAdminAgencyPreview(principal);
      const request = await getAgencyRegistrationRequest(req.params.id);
      if (!request || request.status !== "pending") throw new Error("Demande d’agence introuvable ou déjà traitée.");
      const body = req.body as Record<string, unknown>;
      const agencyId = typeof body.agencyId === "string" ? normalizeAgencyId(body.agencyId) : "";
      if (!agencyId || await getAgencyProfile(agencyId)) throw new Error("Choisissez un code agence unique avant l’approbation.");
      const profile = await upsertAgencyProfile({ agencyId, publicSlug: typeof body.publicSlug === "string" ? body.publicSlug : null, displayName: request.agencyName, publicEmail: request.publicEmail, primaryColor: typeof body.primaryColor === "string" ? body.primaryColor : "#007FFF", timeZone: "Africa/Kinshasa" });
      const admin = await createInitialAgencyAdmin({ email: request.requesterEmail, agencyId });
      const decided = await decideAgencyRegistrationRequest({ id: request.id, status: "approved", reviewerFirebaseUid: principal.uid, reviewerNote: typeof body.reviewerNote === "string" ? body.reviewerNote : null });
      res.status(201).json({ request: decided, profile, admin: { uid: admin.uid, email: admin.email }, agencyPath: `/agency/${profile?.publicSlug}`, requiresClaimsRefresh: true });
    } catch (error) { res.status(400).json({ error: error instanceof Error ? error.message : "Approbation impossible" }); }
  });

  app.post("/api/admin/agency-registration-requests/:id/reject", async (req, res) => {
    try {
      const principal = await verifyFirebaseAuthorization(req.headers.authorization);
      assertSuperAdminAgencyPreview(principal);
      const decided = await decideAgencyRegistrationRequest({ id: req.params.id, status: "rejected", reviewerFirebaseUid: principal.uid, reviewerNote: typeof req.body?.reviewerNote === "string" ? req.body.reviewerNote : null });
      res.status(200).json({ request: decided });
    } catch (error) { res.status(400).json({ error: error instanceof Error ? error.message : "Rejet impossible" }); }
  });

  app.get("/api/admin/central-analytics", async (req, res) => {
    try {
      const principal = await verifyFirebaseAuthorization(req.headers.authorization);
      assertSuperAdminAgencyPreview(principal);
      const period = typeof req.query.period === "string" && ["7d", "30d", "90d", "all"].includes(req.query.period) ? req.query.period as "7d" | "30d" | "90d" | "all" : "30d";
      res.status(200).json(await getCentralConsoleAnalytics(period));
    } catch (error) {
      res.status(403).json({ error: error instanceof Error ? error.message : "Accès à l’analyse centralisée refusé" });
    }
  });

  app.post("/api/admin/agencies/:agencyId/whatsapp/activate", async (req, res) => {
    try {
      const principal = await verifyFirebaseAuthorization(req.headers.authorization);
      assertSuperAdminAgencyPreview(principal);
      const agencyId = resolveAgencyManagementScope(principal, req.params.agencyId);
      const config = await activateAgencyWhatsAppChannel(agencyId);
      res.status(200).json({ agencyId, config });
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Activation WhatsApp impossible" });
    }
  });

  app.post("/api/admin/agencies/:agencyId/whatsapp/validate", async (req, res) => {
    try {
      const principal = await verifyFirebaseAuthorization(req.headers.authorization);
      assertSuperAdminAgencyPreview(principal);
      const agencyId = resolveAgencyManagementScope(principal, req.params.agencyId);
      const validation = await validateAgencyMetaConnection(agencyId);
      res.status(200).json({ agencyId, validation });
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Validation Meta impossible" });
    }
  });

  app.get("/api/admin/agencies/:agencyId/preview", async (req, res) => {
    try {
      const principal = await verifyFirebaseAuthorization(req.headers.authorization);
      assertSuperAdminAgencyPreview(principal);
      const agencyId = resolveAgencyManagementScope(principal, req.params.agencyId);
      const profile = await getAgencyProfile(agencyId);
      if (!profile) {
        res.status(404).json({ error: "Agence introuvable" });
        return;
      }
      const [shipments, exceptions, subscription] = await Promise.all([
        listShipments(agencyId),
        listExceptions(agencyId),
        getAgencySubscription(agencyId),
      ]);
      res.status(200).json({ agencyId, profile, shipments, exceptions, subscription });
    } catch (error) {
      res.status(403).json({ error: error instanceof Error ? error.message : "Prévisualisation interdite" });
    }
  });

  app.get("/api/admin/users", async (req, res) => {
    try {
      const requester = await verifyFirebaseAuthorization(req.headers.authorization);
      const requestedAgencyId = typeof req.query.agencyId === "string" ? req.query.agencyId : undefined;
      const agencyId = resolveAgencyManagementScope(requester, requestedAgencyId);
      const users = await listAgencyMembers(agencyId);
      res.status(200).json({ agencyId, users });
    } catch (error) {
      res.status(403).json({ error: error instanceof Error ? error.message : "Accès refusé" });
    }
  });

  app.post("/api/admin/users", async (req, res) => {
    try {
      const requester = await verifyFirebaseAuthorization(req.headers.authorization);
      const { email, role, agencyId: bodyAgencyId } = req.body as { email?: unknown; role?: unknown; agencyId?: unknown };
      if (typeof email !== "string" || typeof role !== "string" || (bodyAgencyId !== undefined && typeof bodyAgencyId !== "string")) {
        res.status(400).json({ error: "Données utilisateur invalides" });
        return;
      }
      assertAgencyMemberRole(role);
      const agencyId = resolveAgencyManagementScope(requester, bodyAgencyId);
      const user = await createAgencyMember({ email, role, agencyId });
      const invitation = await requestFirebasePasswordReset(user.email);
      res.status(201).json({ user, invitation });
    } catch (error) {
      res.status(403).json({ error: error instanceof Error ? error.message : "Création interdite" });
    }
  });

  app.post("/api/admin/users/:uid/status", async (req, res) => {
    try {
      const requester = await verifyFirebaseAuthorization(req.headers.authorization);
      const { disabled, agencyId: bodyAgencyId } = req.body as { disabled?: unknown; agencyId?: unknown };
      if (typeof disabled !== "boolean" || (bodyAgencyId !== undefined && typeof bodyAgencyId !== "string")) {
        res.status(400).json({ error: "Statut utilisateur invalide" });
        return;
      }
      const agencyId = resolveAgencyManagementScope(requester, bodyAgencyId);
      const result = await setAgencyMemberDisabled({ uid: req.params.uid, agencyId, disabled });
      res.status(200).json({ ok: true, result });
    } catch (error) {
      res.status(403).json({ error: error instanceof Error ? error.message : "Mise à jour interdite" });
    }
  });

  app.put("/api/admin/users/:uid", async (req, res) => {
    try {
      const requester = await verifyFirebaseAuthorization(req.headers.authorization);
      const { role, agencyId: bodyAgencyId } = req.body as { role?: unknown; agencyId?: unknown };
      if (typeof role !== "string" || (bodyAgencyId !== undefined && typeof bodyAgencyId !== "string")) {
        res.status(400).json({ error: "Modification utilisateur invalide" });
        return;
      }
      assertAgencyMemberRole(role);
      const agencyId = resolveAgencyManagementScope(requester, bodyAgencyId);
      const result = await updateAgencyMemberRole({ uid: req.params.uid, agencyId, role });
      res.status(200).json({ ok: true, result });
    } catch (error) {
      res.status(403).json({ error: error instanceof Error ? error.message : "Modification interdite" });
    }
  });

  app.post("/api/admin/users/:uid/invitation", async (req, res) => {
    try {
      const requester = await verifyFirebaseAuthorization(req.headers.authorization);
      const bodyAgencyId = typeof req.body?.agencyId === "string" ? req.body.agencyId : undefined;
      const agencyId = resolveAgencyManagementScope(requester, bodyAgencyId);
      const users = await listAgencyMembers(agencyId);
      if (!users.some((user) => user.uid === req.params.uid)) {
        res.status(404).json({ error: "Utilisateur introuvable dans cette agence" });
        return;
      }
      const invitation = await requestFirebasePasswordResetForUid(req.params.uid);
      res.status(200).json({ ok: true, invitation });
    } catch (error) {
      res.status(403).json({ error: error instanceof Error ? error.message : "Invitation interdite" });
    }
  });

  app.get("/api/shipments", async (req, res) => {
    try {
      const principal = await verifyFirebaseAuthorization(req.headers.authorization);
      if (principal.role === "client") {
        res.status(403).json({ error: "Utilisez le portail client pour consulter vos colis" });
        return;
      }
      const rows = await listShipments(principal.role === "super_admin" ? null : principal.agencyId);
      res.status(200).json({ shipments: rows });
    } catch (error) {
      res.status(401).json({ error: error instanceof Error ? error.message : "Non autorisé" });
    }
  });

  app.get("/api/shipments/:shipmentId", async (req, res) => {
    try {
      const principal = await verifyFirebaseAuthorization(req.headers.authorization);
      if (principal.role === "client") {
        res.status(403).json({ error: "Utilisez le portail client pour consulter vos colis" });
        return;
      }
      const agencyId = principal.role === "super_admin" ? null : principal.agencyId;
      const shipment = await getShipment(req.params.shipmentId, agencyId);
      if (!shipment) {
        res.status(404).json({ error: "Expédition introuvable" });
        return;
      }
      const events = await listShipmentEvents(shipment.id, agencyId);
      res.status(200).json({ shipment, events });
    } catch (error) {
      res.status(401).json({ error: error instanceof Error ? error.message : "Non autorisé" });
    }
  });

  app.post("/api/shipments/:shipmentId/client-contact", async (req, res) => {
    try {
      const principal = await verifyFirebaseAuthorization(req.headers.authorization);
      if (principal.role === "viewer" || principal.role === "client") {
        res.status(403).json({ error: "Action réservée aux équipes opérationnelles" });
        return;
      }
      const phoneNumber = typeof req.body?.phoneNumber === "string" ? req.body.phoneNumber : "";
      await updateShipmentCustomerPhone({ shipmentId: req.params.shipmentId, agencyId: principal.role === "super_admin" ? null : principal.agencyId, phoneNumber });
      res.status(200).json({ ok: true });
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Association du client impossible" });
    }
  });

  app.post("/api/shipments/:shipmentId/events", async (req, res) => {
    try {
      const principal = await verifyFirebaseAuthorization(req.headers.authorization);
      if (principal.role === "viewer" || principal.role === "client") {
        res.status(403).json({ error: "Action réservée aux équipes opérationnelles" });
        return;
      }
      const shipment = await getShipment(req.params.shipmentId, principal.role === "super_admin" ? null : principal.agencyId);
      if (!shipment) {
        res.status(404).json({ error: "Expédition introuvable" });
        return;
      }
      const body = req.body as { eventId?: unknown; type?: unknown; severity?: unknown; source?: unknown; confidence?: unknown; sequence?: unknown; message?: unknown; payload?: unknown; shipmentUpdate?: unknown };
      const eventTypes = ["location_update", "status_changed", "eta_changed", "customs_hold", "delay_detected", "note"];
      const severities = ["info", "warning", "critical"];
      const confidences = ["high", "medium", "low"];
      if (typeof body.eventId !== "string" || typeof body.type !== "string" || !eventTypes.includes(body.type) || typeof body.severity !== "string" || !severities.includes(body.severity) || typeof body.source !== "string" || typeof body.confidence !== "string" || !confidences.includes(body.confidence) || typeof body.sequence !== "number" || typeof body.message !== "string") {
        res.status(400).json({ error: "Événement invalide" });
        return;
      }
      const outcome = await recordShipmentEvent({
        id: randomUUID(),
        shipmentId: shipment.id,
        agencyId: shipment.agencyId,
        eventId: body.eventId,
        type: body.type as "location_update" | "status_changed" | "eta_changed" | "customs_hold" | "delay_detected" | "note",
        severity: body.severity as "info" | "warning" | "critical",
        source: body.source,
        confidence: body.confidence as "high" | "medium" | "low",
        sequence: body.sequence,
        message: body.message.slice(0, 4000),
        payload: typeof body.payload === "string" ? body.payload.slice(0, 16000) : undefined,
        occurredAt: new Date(),
      });
      if (outcome.accepted && shouldNotifyAgencyShipmentEvent(body.type as "location_update" | "status_changed" | "eta_changed" | "customs_hold" | "delay_detected" | "note", body.severity as "info" | "warning" | "critical")) {
        void sendAgencyShipmentUpdate({ agencyId: shipment.agencyId, shipmentId: shipment.id, customerPhone: shipment.customerPhone, customerName: shipment.customerName, trackingNumber: shipment.trackingNumber, status: body.message.slice(0, 180), publicTrackingUrl: null }).catch((notifyError) => console.warn("[WhatsApp] Mise à jour non envoyée", notifyError instanceof Error ? notifyError.message : notifyError));
      }
      res.status(outcome.accepted ? 201 : 202).json(outcome);
    } catch (error) {
      res.status(401).json({ error: error instanceof Error ? error.message : "Non autorisé" });
    }
  });

  app.get("/api/exceptions", async (req, res) => {
    try {
      const principal = await verifyFirebaseAuthorization(req.headers.authorization);
      if (principal.role === "client") {
        res.status(403).json({ error: "Les exceptions sont réservées aux équipes opérationnelles" });
        return;
      }
      const exceptions = await listExceptions(principal.role === "super_admin" ? null : principal.agencyId);
      res.status(200).json({ exceptions });
    } catch (error) {
      res.status(401).json({ error: error instanceof Error ? error.message : "Non autorisé" });
    }
  });

  app.post("/api/exceptions/:exceptionId/transition", async (req, res) => {
    try {
      const principal = await verifyFirebaseAuthorization(req.headers.authorization);
      if (principal.role === "viewer" || principal.role === "client") {
        res.status(403).json({ error: "Action réservée aux équipes opérationnelles" });
        return;
      }
      const { status } = req.body as { status?: unknown };
      if (status !== "acknowledged" && status !== "resolved") {
        res.status(400).json({ error: "Transition invalide" });
        return;
      }
      await transitionException({
        id: req.params.exceptionId,
        agencyId: principal.role === "super_admin" ? null : principal.agencyId,
        status,
        assignedTo: principal.uid,
      });
      res.status(200).json({ ok: true });
    } catch (error) {
      res.status(401).json({ error: error instanceof Error ? error.message : "Non autorisé" });
    }
  });

  app.post("/api/shipments/:shipmentId/share-links", async (req, res) => {
    try {
      const principal = await verifyFirebaseAuthorization(req.headers.authorization);
      if (principal.role === "viewer" || principal.role === "client") {
        res.status(403).json({ error: "Action réservée aux équipes opérationnelles" });
        return;
      }
      const shipment = await getShipment(req.params.shipmentId, principal.role === "super_admin" ? null : principal.agencyId);
      if (!shipment) {
        res.status(404).json({ error: "Expédition introuvable" });
        return;
      }
      const hours = Number((req.body as { expiresInHours?: unknown }).expiresInHours ?? 72);
      if (!Number.isInteger(hours) || hours < 1 || hours > 720) {
        res.status(400).json({ error: "Durée de validité invalide" });
        return;
      }
      const token = await createShipmentShareLink({
        id: randomUUID(),
        shipmentId: shipment.id,
        agencyId: shipment.agencyId,
        createdBy: principal.uid,
        expiresAt: new Date(Date.now() + hours * 60 * 60 * 1000),
      });
      res.status(201).json({ token, expiresAt: new Date(Date.now() + hours * 60 * 60 * 1000).toISOString() });
    } catch (error) {
      res.status(401).json({ error: error instanceof Error ? error.message : "Non autorisé" });
    }
  });

  app.get("/api/public/shipments/:token", async (req, res) => {
    const shared = await getSharedShipment(req.params.token);
    if (!shared) {
      res.status(404).json({ error: "Lien de suivi expiré, révoqué ou introuvable" });
      return;
    }
    const { shipment, events, link } = shared;
    res.status(200).json({
      expiresAt: link.expiresAt,
      shipment: {
        trackingNumber: shipment.trackingNumber,
        origin: shipment.origin,
        destination: shipment.destination,
        mode: shipment.mode,
        status: shipment.status,
        progress: shipment.progress,
        distanceRemainingKm: shipment.distanceRemainingKm,
        eta: shipment.eta,
        currentPosition: shipment.currentPosition,
        lastTelemetryAt: shipment.lastTelemetryAt,
        confidence: shipment.confidence,
      },
      events: events.slice(0, 20).map((event) => ({ type: event.type, severity: event.severity, message: event.message, occurredAt: event.occurredAt })),
    });
  });

  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    }),
  );

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`[api] server listening on port ${port}`);
  });
}

startServer().catch(console.error);
