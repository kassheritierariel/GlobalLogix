import { getFirebaseIdToken } from "@/lib/firebase";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/$/, "");

async function authorizedFetch(path: string, options?: RequestInit) {
  if (!API_BASE_URL) throw new Error("EXPO_PUBLIC_API_BASE_URL manquant");
  const token = await getFirebaseIdToken();
  if (!token) throw new Error("Session Firebase requise");
  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...(options?.headers ?? {}) } });
  if (!response.ok) {
    const payload = await response.json().catch(() => null) as { error?: string } | null;
    throw new Error(payload?.error ?? `Service agence indisponible (${response.status})`);
  }
  return response;
}

export type AgencyProfile = { agencyId: string; publicSlug: string; displayName: string; legalName: string | null; publicEmail: string | null; publicPhone: string | null; website: string | null; logoUrl: string | null; primaryColor: string | null; timeZone: string; supportHours: string | null };
export type AgencyWhatsAppConfig = { agencyId: string; metaAppId: string | null; businessAccountId: string | null; phoneNumberId: string | null; senderPhoneLast4: string | null; utilityTemplateName: string | null; status: "draft" | "verified" | "active" | "disabled"; lastValidatedAt: string | null; configured: boolean };
export type AgencyWhatsAppLog = { id: string; direction: "outbound" | "inbound"; eventType: string; templateName: string | null; status: "queued" | "sent" | "delivered" | "read" | "failed" | "received"; sanitizedSummary: string | null; errorCode: string | null; createdAt: string };
export type AgencyClientSummary = { firebaseUid: string; displayName: string | null; phoneLast4: string | null; shipmentCount: number; activeShipments: number; deliveredShipments: number; atRiskShipments: number; lastActivityAt: string | null };
export type AgencyClientShipment = { id: string; trackingNumber: string; status: string; progress: number; origin: string; destination: string; currentPosition: string | null; updatedAt: string };
export type AgencyAnalyticsPeriod = "7d" | "30d" | "90d" | "all" | "custom";
export type AgencyAnalytics = { agencyId: string; period: AgencyAnalyticsPeriod; start: string | null; end: string | null; operations: { periodShipments: number; totalShipments: number; activeShipments: number; atRiskShipments: number; openExceptions: number; statusCounts: Record<string, number> }; whatsApp: { channelStatus: string; periodLogEntries: number; attempted: number; delivered: number; read: number; failed: number; skipped: number; deliveryRate: number | null; readRate: number | null } };
export type AgencyWhatsAppSimulation = { trackingNumber: string; eventType: "status_changed" | "eta_changed" | "customs_hold" | "delay_detected" | "delivery_confirmed"; status: "simulated"; sanitizedSummary: string; preview: string; safetyNote: string };

export async function fetchAgencyProfile() { const response = await authorizedFetch("/api/agency/profile"); return response.json() as Promise<{ agencyId: string; profile: AgencyProfile | null }>; }
export async function saveAgencyProfile(input: Omit<AgencyProfile, "agencyId"> & { agencyId?: string }) { const response = await authorizedFetch("/api/agency/profile", { method: "PUT", body: JSON.stringify(input) }); return response.json() as Promise<{ profile: AgencyProfile }>; }
export async function uploadAgencyLogo(dataUrl: string) { const response = await authorizedFetch("/api/agency/logo", { method: "POST", body: JSON.stringify({ dataUrl }) }); return response.json() as Promise<{ profile: AgencyProfile }>; }
export async function fetchAgencyWhatsApp() { const response = await authorizedFetch("/api/agency/whatsapp"); return response.json() as Promise<{ agencyId: string; config: AgencyWhatsAppConfig | null }>; }
export async function saveAgencyWhatsApp(input: { metaAppId?: string; businessAccountId?: string; phoneNumberId?: string; senderPhone?: string; utilityTemplateName?: string; accessToken?: string; appSecret?: string; verifyToken?: string }) { const response = await authorizedFetch("/api/agency/whatsapp", { method: "PUT", body: JSON.stringify(input) }); return response.json() as Promise<{ config: AgencyWhatsAppConfig }>; }
export async function fetchAgencyWhatsAppLogs() { const response = await authorizedFetch("/api/agency/whatsapp/logs"); return response.json() as Promise<{ agencyId: string; logs: AgencyWhatsAppLog[] }>; }
export async function fetchAgencyClients() { const response = await authorizedFetch("/api/agency/clients"); return response.json() as Promise<{ agencyId: string; clients: AgencyClientSummary[] }>; }
export async function fetchAgencyClientDetail(firebaseUid: string) { const response = await authorizedFetch(`/api/agency/clients/${encodeURIComponent(firebaseUid)}`); return response.json() as Promise<{ agencyId: string; client: Pick<AgencyClientSummary, "firebaseUid" | "displayName" | "phoneLast4">; shipments: AgencyClientShipment[] }>; }
export async function fetchAgencyAnalytics(period: AgencyAnalyticsPeriod, range?: { startDate: string; endDate: string }) { const query = new URLSearchParams({ period }); if (range?.startDate) query.set("startDate", range.startDate); if (range?.endDate) query.set("endDate", range.endDate); const response = await authorizedFetch(`/api/agency/analytics?${query.toString()}`); return response.json() as Promise<AgencyAnalytics>; }
export async function simulateAgencyWhatsAppNotification(input: { trackingNumber: string; eventType: AgencyWhatsAppSimulation["eventType"]; message: string }) { const response = await authorizedFetch("/api/agency/whatsapp/simulate", { method: "POST", body: JSON.stringify(input) }); return response.json() as Promise<AgencyWhatsAppSimulation>; }

export type AgencyOnboardingInput = {
  agencyId: string; publicSlug?: string; displayName: string; legalName?: string; adminEmail: string;
  publicEmail?: string; publicPhone?: string; website?: string; primaryColor?: string; timeZone?: string; supportHours?: string;
};

export async function onboardAgency(input: AgencyOnboardingInput) {
  const response = await authorizedFetch("/api/admin/agencies/onboard", { method: "POST", body: JSON.stringify(input) });
  return response.json() as Promise<{ profile: AgencyProfile; admin: { uid: string; email: string; created: boolean; invitationRequested: boolean }; agencyPath: string }>;
}

export type AgencyRegistrationRequest = { id: string; requesterEmail: string; requesterDisplayName: string | null; agencyName: string; publicEmail: string; city: string; status: "pending" | "approved" | "rejected"; reviewerNote: string | null; createdAt: string; reviewedAt: string | null };
export async function fetchAgencyRegistrationRequests(status: AgencyRegistrationRequest["status"] = "pending") { const response = await authorizedFetch(`/api/admin/agency-registration-requests?status=${status}`); return response.json() as Promise<{ requests: AgencyRegistrationRequest[] }>; }
export async function approveAgencyRegistrationRequest(id: string, input: { agencyId: string; publicSlug?: string; primaryColor?: string; reviewerNote?: string }) { const response = await authorizedFetch(`/api/admin/agency-registration-requests/${encodeURIComponent(id)}/approve`, { method: "POST", body: JSON.stringify(input) }); return response.json() as Promise<{ request: AgencyRegistrationRequest; profile: AgencyProfile; agencyPath: string; requiresClaimsRefresh: true }>; }
export async function rejectAgencyRegistrationRequest(id: string, reviewerNote?: string) { const response = await authorizedFetch(`/api/admin/agency-registration-requests/${encodeURIComponent(id)}/reject`, { method: "POST", body: JSON.stringify({ reviewerNote }) }); return response.json() as Promise<{ request: AgencyRegistrationRequest }>; }
