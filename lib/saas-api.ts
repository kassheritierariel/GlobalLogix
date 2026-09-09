import { getFirebaseIdToken } from "@/lib/firebase";
import type { BillingCycle, SaaSPlan, SaaSPlanId } from "@/lib/saas-plans";
import { getApiBaseUrl } from "@/lib/api-base-url";

const API_BASE_URL = getApiBaseUrl();

async function authorizedFetch(path: string, options?: RequestInit) {
  if (!API_BASE_URL) throw new Error("EXPO_PUBLIC_API_BASE_URL manquant");
  const token = await getFirebaseIdToken();
  if (!token) throw new Error("Session Firebase requise");
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...(options?.headers ?? {}) },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { error?: string } | null;
    throw new Error(body?.error ?? `Service de souscription indisponible (${response.status})`);
  }
  return response;
}

export type AgencySubscription = {
  id: string;
  agencyId: string;
  planId: SaaSPlanId;
  billingCycle: BillingCycle;
  status: "trial" | "pending_payment" | "active" | "past_due" | "cancelled" | "expired";
  shipmentLimit: number | null;
  teamMemberLimit: number | null;
  startsAt: string | null;
  endsAt: string | null;
  renewsAt: string | null;
};

export type SaaSTransaction = {
  id: string;
  planId: SaaSPlanId;
  billingCycle: BillingCycle;
  status: "created" | "awaiting_payment" | "paid" | "failed" | "cancelled" | "refunded";
  currency: string | null;
  amountMinor: number | null;
  createdAt: string;
};

export async function fetchAgencySubscription() {
  const response = await authorizedFetch("/api/saas/subscription");
  return response.json() as Promise<{ agencyId: string; subscription: AgencySubscription | null; plan: SaaSPlan | null }>;
}

export async function fetchSaasTransactions() {
  const response = await authorizedFetch("/api/saas/transactions");
  return response.json() as Promise<{ agencyId: string; transactions: SaaSTransaction[] }>;
}

export async function startSaasCheckout(input: { planId: SaaSPlanId; billingCycle: BillingCycle; phoneNumber: string; countryCode: string }) {
  const response = await authorizedFetch("/api/saas/checkout", { method: "POST", body: JSON.stringify(input) });
  return response.json() as Promise<{ checkoutUrl: string; transactionId: string }>;
}
