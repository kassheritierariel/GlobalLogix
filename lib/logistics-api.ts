import { getFirebaseIdToken } from "@/lib/firebase";
import type { Shipment, ShipmentStatus } from "@/lib/types";
import type { DetailedTransitEvent } from "@/lib/shipment-detail";
import { getApiBaseUrl } from "@/lib/api-base-url";

const API_BASE_URL = getApiBaseUrl();

type ApiShipment = {
  id: string;
  agencyId: string;
  trackingNumber: string;
  origin: string;
  destination: string;
  mode: "air" | "sea" | "land" | "rail";
  status: "planned" | "in_transit" | "customs" | "delayed" | "delivered" | "cancelled";
  progress: number;
  distanceRemainingKm: number | null;
  eta: string | null;
  lastTelemetryAt: string | null;
  currentPosition: string | null;
};

export type AgencyPreviewProfile = {
  agencyId: string;
  displayName: string;
  legalName: string | null;
  publicEmail: string | null;
  publicPhone: string | null;
  website: string | null;
  logoUrl: string | null;
  primaryColor: string | null;
  timeZone: string;
  supportHours: string | null;
};

export type AgencyPreviewSubscription = {
  planId: "starter" | "operations" | "enterprise";
  billingCycle: "monthly" | "annual";
  status: "trial" | "pending_payment" | "active" | "past_due" | "cancelled" | "expired";
  shipmentLimit: number | null;
  teamMemberLimit: number | null;
} | null;

export type AgencyWhatsAppChannelSummary = {
  agencyId: string;
  metaAppId: string | null;
  businessAccountId: string | null;
  phoneNumberId: string | null;
  senderPhoneLast4: string | null;
  utilityTemplateName: string | null;
  status: "draft" | "verified" | "active" | "disabled";
  lastValidatedAt: string | null;
  configured: boolean;
  connectionConfigured: boolean;
  webhookConfigured: boolean;
} | null;

export type AgencyWhatsAppActivity = {
  direction: "outbound" | "inbound";
  eventType: string;
  status: "queued" | "sent" | "delivered" | "read" | "failed" | "received";
  sanitizedSummary: string | null;
  createdAt: string;
} | null;

export type CentralAnalyticsPeriod = "7d" | "30d" | "90d" | "all";

export type CentralAgencyAnalytics = {
  agencyId: string;
  operations: {
    trackedShipments: number;
    periodUpdates: number;
    activeShipments: number;
    atRisk: number;
    openExceptions: number;
  };
  usage: {
    shipmentLimit: number | null;
    shipmentUsagePercent: number | null;
    alert: { level: "unlimited" | "healthy" | "approaching" | "reached"; percent: number | null; title: string; message: string };
  };
  chariow: {
    productId: string | null;
    subscriptionStatus: "trial" | "pending_payment" | "active" | "past_due" | "cancelled" | "expired" | null;
    periodTransactions: number;
    paidTransactions: number;
    pendingTransactions: number;
    failedTransactions: number;
    paidAmountMinorByCurrency: Record<string, number>;
  };
  whatsApp: {
    status: "draft" | "verified" | "active" | "disabled";
    validatedAt: string | null;
    periodMessages: number;
    deliveredMessages: number;
    failedMessages: number;
    activation: { canActivate: boolean; tone: "neutral" | "success" | "warning" | "error"; message: string };
  };
};

export type CentralAnalyticsSnapshot = { period: CentralAnalyticsPeriod; start: string | null; agencies: CentralAgencyAnalytics[] };

const statusMap: Record<ApiShipment["status"], ShipmentStatus> = {
  planned: "in-transit",
  in_transit: "in-transit",
  customs: "customs",
  delayed: "delayed",
  delivered: "delivered",
  cancelled: "delayed",
};

function mapShipment(shipment: ApiShipment): Shipment {
  return {
    id: shipment.id,
    agencyId: shipment.agencyId,
    trackingNumber: shipment.trackingNumber,
    origin: shipment.origin,
    destination: shipment.destination,
    mode: shipment.mode === "rail" ? "land" : shipment.mode,
    status: statusMap[shipment.status],
    progress: shipment.progress,
    distanceRemainingKm: shipment.distanceRemainingKm ?? 0,
    eta: shipment.eta ? new Date(shipment.eta).toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "À confirmer",
    lastTelemetryAt: shipment.lastTelemetryAt ? new Date(shipment.lastTelemetryAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : "En attente",
    currentPosition: shipment.currentPosition ?? "Position en attente",
  };
}

export function hasLogisticsApi() {
  return Boolean(API_BASE_URL);
}

async function authorizedFetch(path: string, options?: RequestInit) {
  if (!API_BASE_URL) throw new Error("EXPO_PUBLIC_API_BASE_URL manquant");
  const token = await getFirebaseIdToken();
  if (!token) throw new Error("Session Firebase requise");
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...(options?.headers ?? {}) },
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => null) as { error?: string } | null;
    throw new Error(payload?.error ?? `API logistique indisponible (${response.status})`);
  }
  return response;
}

export type AgencyManagedUser = {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: "staff" | "viewer";
  agencyId: string;
  disabled: boolean;
};

export async function fetchAgencyUsers(agencyId?: string) {
  const query = agencyId ? `?agencyId=${encodeURIComponent(agencyId)}` : "";
  const response = await authorizedFetch(`/api/admin/users${query}`);
  return response.json() as Promise<{ agencyId: string; users: AgencyManagedUser[] }>;
}

export async function createAgencyUser(input: { email: string; role: "staff" | "viewer"; agencyId?: string }) {
  const response = await authorizedFetch("/api/admin/users", { method: "POST", body: JSON.stringify(input) });
  return response.json() as Promise<{ user: AgencyManagedUser; invitation: { email: string; requested: boolean } }>;
}

export async function setAgencyUserStatus(uid: string, disabled: boolean, agencyId?: string) {
  await authorizedFetch(`/api/admin/users/${encodeURIComponent(uid)}/status`, { method: "POST", body: JSON.stringify({ disabled, agencyId }) });
}

export async function updateAgencyUserRole(uid: string, role: "staff" | "viewer", agencyId?: string) {
  await authorizedFetch(`/api/admin/users/${encodeURIComponent(uid)}`, { method: "PUT", body: JSON.stringify({ role, agencyId }) });
}

export async function sendAgencyUserInvitation(uid: string, agencyId?: string) {
  await authorizedFetch(`/api/admin/users/${encodeURIComponent(uid)}/invitation`, { method: "POST", body: JSON.stringify({ agencyId }) });
}

export async function fetchPreviewAgencies() {
  const response = await authorizedFetch("/api/admin/agencies");
  return response.json() as Promise<{ agencies: Array<AgencyPreviewProfile & { subscription: AgencyPreviewSubscription; whatsApp: AgencyWhatsAppChannelSummary; latestWhatsAppActivity: AgencyWhatsAppActivity }> }>;
}

export async function fetchAgencyDashboardPreview(agencyId: string) {
  const response = await authorizedFetch(`/api/admin/agencies/${encodeURIComponent(agencyId)}/preview`);
  const body = await response.json() as {
    agencyId: string;
    profile: AgencyPreviewProfile;
    shipments: ApiShipment[];
    exceptions: Array<{ exception: { id: string; status: string; severity: string }; shipment: ApiShipment }>;
    subscription: AgencyPreviewSubscription;
  };
  return { ...body, shipments: body.shipments.map(mapShipment) };
}

export async function fetchCentralAnalytics(period: CentralAnalyticsPeriod) {
  const response = await authorizedFetch(`/api/admin/central-analytics?period=${encodeURIComponent(period)}`);
  return response.json() as Promise<CentralAnalyticsSnapshot>;
}

export async function activateAgencyWhatsAppFromConsole(agencyId: string) {
  const response = await authorizedFetch(`/api/admin/agencies/${encodeURIComponent(agencyId)}/whatsapp/activate`, { method: "POST" });
  return response.json() as Promise<{ agencyId: string; config: AgencyWhatsAppChannelSummary }>;
}

export async function validateAgencyWhatsAppMetaFromConsole(agencyId: string) {
  const response = await authorizedFetch(`/api/admin/agencies/${encodeURIComponent(agencyId)}/whatsapp/validate`, { method: "POST" });
  return response.json() as Promise<{ agencyId: string; validation: { ok: true; message: string } }>;
}

export async function fetchShipments() {
  const response = await authorizedFetch("/api/shipments");
  const body = await response.json() as { shipments: ApiShipment[] };
  return body.shipments.map(mapShipment);
}

export type ShipmentTimelineEvent = {
  id: string;
  type: string;
  severity: "info" | "warning" | "critical";
  source: string;
  message: string;
  occurredAt: string;
  payload?: string | null;
};

export async function fetchShipmentTimeline(shipmentId: string) {
  const response = await authorizedFetch(`/api/shipments/${shipmentId}`);
  const body = await response.json() as { events: ShipmentTimelineEvent[] };
  return body.events;
}

export async function fetchShipmentDetail(shipmentId: string) {
  const response = await authorizedFetch(`/api/shipments/${encodeURIComponent(shipmentId)}`);
  const body = await response.json() as { shipment: ApiShipment; events: DetailedTransitEvent[] };
  return { shipment: mapShipment(body.shipment), events: body.events };
}

export async function updateShipmentClientPhone(shipmentId: string, phoneNumber: string) {
  await authorizedFetch(`/api/shipments/${encodeURIComponent(shipmentId)}/client-contact`, { method: "POST", body: JSON.stringify({ phoneNumber }) });
}

export type ExceptionCase = {
  id: string;
  kind: "delay" | "customs" | "no_signal" | "eta_risk" | "temperature";
  severity: "warning" | "critical";
  status: "open" | "acknowledged" | "resolved";
  title: string;
  description: string;
  slaDueAt: string | null;
  shipment: Shipment;
};

export async function fetchExceptions() {
  const response = await authorizedFetch("/api/exceptions");
  const body = await response.json() as { exceptions: Array<{ exception: Omit<ExceptionCase, "shipment">; shipment: ApiShipment }> };
  return body.exceptions.map(({ exception, shipment }) => ({ ...exception, shipment: mapShipment(shipment) }));
}

export async function transitionException(id: string, status: "acknowledged" | "resolved") {
  await authorizedFetch(`/api/exceptions/${id}/transition`, { method: "POST", body: JSON.stringify({ status }) });
}

export async function createShareLink(shipmentId: string, expiresInHours = 72) {
  const response = await authorizedFetch(`/api/shipments/${shipmentId}/share-links`, { method: "POST", body: JSON.stringify({ expiresInHours }) });
  return response.json() as Promise<{ token: string; expiresAt: string }>;
}

export function getPublicTrackingUrl(token: string) {
  const portalBaseUrl = process.env.EXPO_PUBLIC_PORTAL_BASE_URL?.replace(/\/$/, "");
  if (!portalBaseUrl) throw new Error("EXPO_PUBLIC_PORTAL_BASE_URL manquant");
  return `${portalBaseUrl}/share/${encodeURIComponent(token)}`;
}
