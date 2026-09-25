import type { BillingCycle, SaaSPlanId } from "../lib/saas-plans";

const API_BASE_URL = "https://api.chariow.com/v1";

export function getChariowProductEnvKey(planId: SaaSPlanId, billingCycle: BillingCycle) {
  return `CHARIOW_PRODUCT_${planId.toUpperCase()}_${billingCycle.toUpperCase()}_ID`;
}

export function getChariowProductId(planId: SaaSPlanId, billingCycle: BillingCycle) {
  const productId = process.env[getChariowProductEnvKey(planId, billingCycle)]?.trim();
  if (!productId) throw new Error(`Produit Chariow manquant pour le plan ${planId} (${billingCycle}).`);
  return productId;
}

export function isChariowConfigured() {
  return Boolean(process.env.CHARIOW_API_KEY?.trim());
}

export function assertChariowCheckoutConfiguration(planId: SaaSPlanId, billingCycle: BillingCycle) {
  if (!isChariowConfigured()) {
    throw new Error("Chariow est en mode configuration : ajoutez la clé API avant d’ouvrir un paiement.");
  }
  return getChariowProductId(planId, billingCycle);
}

export async function createChariowCheckout(input: {
  productId: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  countryCode: string;
  redirectUrl: string;
  metadata: Record<string, string>;
}) {
  const apiKey = process.env.CHARIOW_API_KEY?.trim();
  if (!apiKey) throw new Error("Chariow n’est pas encore configuré. Ajoutez la clé API serveur.");
  const response = await fetch(`${API_BASE_URL}/checkout`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      product_id: input.productId,
      email: input.email,
      first_name: input.firstName,
      last_name: input.lastName,
      phone: { number: input.phoneNumber, country_code: input.countryCode },
      redirect_url: input.redirectUrl,
      custom_metadata: input.metadata,
    }),
  });
  const payload = await response.json().catch(() => null) as {
    message?: string;
    data?: { step?: string; purchase?: { id?: string }; payment?: { checkout_url?: string | null; transaction_id?: string | null } };
  } | null;
  if (!response.ok || !payload?.data) throw new Error(payload?.message || "Création du paiement Chariow impossible.");
  return payload.data;
}
