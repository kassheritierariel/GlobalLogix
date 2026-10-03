import { getClientFirebaseIdToken } from "@/lib/client-phone-auth";
import type { DetailedTransitEvent } from "@/lib/shipment-detail";
import type { Shipment } from "@/lib/types";
import { getApiBaseUrl } from "@/lib/api-base-url";

const API_BASE_URL = getApiBaseUrl();

export type PublicAgency = { publicSlug: string; displayName: string; legalName: string | null; publicEmail: string | null; publicPhone: string | null; website: string | null; logoUrl: string | null; primaryColor: string | null; timeZone: string; supportHours: string | null };

type ApiShipment = {
  id: string;
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

const statusMap: Record<ApiShipment["status"], Shipment["status"]> = { planned: "in-transit", in_transit: "in-transit", customs: "customs", delayed: "delayed", delivered: "delivered", cancelled: "delayed" };

function mapShipment(shipment: ApiShipment): Shipment {
  return {
    id: shipment.id,
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

async function clientFetch(path: string, options?: RequestInit) {
  if (!API_BASE_URL) throw new Error("EXPO_PUBLIC_API_BASE_URL manquant");
  const token = await getClientFirebaseIdToken();
  if (!token) throw new Error("Vérifiez votre numéro WhatsApp par SMS avant de continuer.");
  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...(options?.headers ?? {}) } });
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { error?: string } | null;
    throw new Error(body?.error ?? "Le portail client est momentanément indisponible.");
  }
  return response;
}

export async function createClientAccount(displayName: string) {
  const response = await clientFetch("/api/client/account", { method: "POST", body: JSON.stringify({ displayName }) });
  return response.json() as Promise<{ account: { whatsAppNumber: string; displayName: string | null } }>;
}

export async function fetchPublicAgency(publicSlug: string) {
  if (!API_BASE_URL) throw new Error("EXPO_PUBLIC_API_BASE_URL manquant");
  const response = await fetch(`${API_BASE_URL}/api/public/agencies/${encodeURIComponent(publicSlug)}`);
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { error?: string } | null;
    throw new Error(body?.error ?? "Espace d’agence indisponible.");
  }
  const body = await response.json() as { agency: PublicAgency };
  return body.agency;
}

function agencyQuery(publicSlug?: string) {
  return publicSlug ? `?agency=${encodeURIComponent(publicSlug)}` : "";
}

export async function fetchClientShipments(publicSlug?: string) {
  const response = await clientFetch(`/api/client/shipments${agencyQuery(publicSlug)}`);
  const body = await response.json() as { shipments: ApiShipment[] };
  return body.shipments.map(mapShipment);
}

export async function registerClientShipment(trackingNumber: string, publicSlug?: string) {
  const response = await clientFetch("/api/client/shipments", { method: "POST", body: JSON.stringify({ trackingNumber, agencySlug: publicSlug }) });
  const body = await response.json() as { shipment: ApiShipment };
  return mapShipment(body.shipment);
}

export async function fetchClientShipmentDetail(shipmentId: string, publicSlug?: string) {
  const response = await clientFetch(`/api/client/shipments/${encodeURIComponent(shipmentId)}${agencyQuery(publicSlug)}`);
  const body = await response.json() as { shipment: ApiShipment; events: DetailedTransitEvent[] };
  return { shipment: mapShipment(body.shipment), events: body.events };
}
