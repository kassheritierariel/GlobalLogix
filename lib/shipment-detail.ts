import type { Shipment } from "@/lib/types";

export type TransitCoordinates = { latitude: number; longitude: number; label?: string };

export type DetailedTransitEvent = {
  id: string;
  type: string;
  severity: "info" | "warning" | "critical";
  source: string;
  message: string;
  occurredAt: string;
  payload?: string | null;
};

export function extractTransitCoordinates(payload?: string | null): TransitCoordinates | null {
  if (!payload) return null;
  try {
    const source = JSON.parse(payload) as Record<string, unknown>;
    const latitude = typeof source.latitude === "number" ? source.latitude : typeof source.lat === "number" ? source.lat : null;
    const longitude = typeof source.longitude === "number" ? source.longitude : typeof source.lng === "number" ? source.lng : null;
    if (latitude === null || longitude === null || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null;
    return { latitude, longitude, label: typeof source.label === "string" ? source.label : undefined };
  } catch {
    return null;
  }
}

export function getTransitSummary(shipment: Shipment, events: DetailedTransitEvent[]) {
  const locationEvents = events.filter((event) => event.type === "location_update");
  const statusEvents = events.filter((event) => event.type === "status_changed");
  const latestLocation = locationEvents.find((event) => extractTransitCoordinates(event.payload));
  return {
    modeLabel: shipment.mode === "air" ? "Aérien" : shipment.mode === "sea" ? "Maritime" : "Terrestre",
    eventCount: events.length,
    locationCount: locationEvents.length,
    statusCount: statusEvents.length,
    latestCoordinates: latestLocation ? extractTransitCoordinates(latestLocation.payload) : null,
  };
}
