import type { Shipment, ShipmentStatus } from "@/lib/types";

export type ShipmentRealtimeEvent = {
  type: "shipment.updated";
  eventId: string;
  sequence: number;
  agencyId: string;
  shipment: Shipment;
  important: boolean;
};

export type RealtimeServerEvent =
  | ShipmentRealtimeEvent
  | { type: "ready"; connectionId: string }
  | { type: "error"; message: string };

const validStatuses: ShipmentStatus[] = ["in-transit", "customs", "delayed", "delivered"];

export function parseRealtimeEvent(raw: string): RealtimeServerEvent | null {
  try {
    const event = JSON.parse(raw) as {
      type?: string;
      message?: string;
      connectionId?: string;
      eventId?: string;
      sequence?: number;
      agencyId?: string;
      shipment?: Partial<Shipment>;
      important?: boolean;
    };
    if (event.type === "ready" && typeof event.connectionId === "string") {
      return { type: "ready", connectionId: event.connectionId };
    }
    if (event.type === "error" && typeof event.message === "string") {
      return { type: "error", message: event.message };
    }
    if (
      event.type === "shipment.updated" &&
      typeof event.eventId === "string" &&
      typeof event.sequence === "number" &&
      typeof event.agencyId === "string" &&
      event.shipment &&
      typeof event.shipment.id === "string" &&
      validStatuses.includes(event.shipment.status as ShipmentStatus)
    ) {
      return event as ShipmentRealtimeEvent;
    }
  } catch {
    return null;
  }
  return null;
}

export function mergeShipmentUpdate(current: Shipment[], update: Shipment): Shipment[] {
  const found = current.some((shipment) => shipment.id === update.id);
  return found
    ? current.map((shipment) => shipment.id === update.id ? update : shipment)
    : [...current, update];
}

export function getRealtimeUrl() {
  const explicitUrl = process.env.EXPO_PUBLIC_REALTIME_URL;
  if (explicitUrl) return explicitUrl;
  const apiUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (!apiUrl) return null;
  return apiUrl.replace(/^https:/, "wss:").replace(/^http:/, "ws:") + "/api/realtime";
}
