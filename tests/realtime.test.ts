import { describe, expect, it } from "vitest";

import { DEMO_SHIPMENTS } from "../lib/demo-data";
import { mergeShipmentUpdate, parseRealtimeEvent } from "../lib/realtime";

describe("realtime event validation", () => {
  it("accepte un événement WebSocket complet et valide", () => {
    const shipment = { ...DEMO_SHIPMENTS[0], progress: 65.5, lastTelemetryAt: "10:40:00" };
    const event = parseRealtimeEvent(JSON.stringify({
      type: "shipment.updated",
      eventId: "evt-001",
      sequence: 7,
      agencyId: "agency-kinshasa",
      important: false,
      shipment,
    }));

    expect(event?.type).toBe("shipment.updated");
    if (event?.type === "shipment.updated") expect(event.shipment.progress).toBe(65.5);
  });

  it("rejette les événements mal formés ou avec un statut inconnu", () => {
    expect(parseRealtimeEvent("not-json")).toBeNull();
    expect(parseRealtimeEvent(JSON.stringify({
      type: "shipment.updated",
      eventId: "evt-002",
      sequence: 8,
      agencyId: "agency-kinshasa",
      shipment: { ...DEMO_SHIPMENTS[0], status: "compromised" },
    }))).toBeNull();
  });

  it("met à jour uniquement l’expédition concernée", () => {
    const updated = { ...DEMO_SHIPMENTS[0], progress: 70 };
    const merged = mergeShipmentUpdate(DEMO_SHIPMENTS, updated);
    expect(merged).toHaveLength(DEMO_SHIPMENTS.length);
    expect(merged.find((shipment) => shipment.id === updated.id)?.progress).toBe(70);
    expect(merged.find((shipment) => shipment.id === DEMO_SHIPMENTS[1].id)).toEqual(DEMO_SHIPMENTS[1]);
  });
});
