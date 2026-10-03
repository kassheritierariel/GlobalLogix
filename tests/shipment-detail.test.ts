import { describe, expect, it } from "vitest";
import { extractTransitCoordinates, getTransitSummary } from "../lib/shipment-detail";

describe("détails de transit", () => {
  it("n’utilise que des coordonnées présentes dans le payload réel", () => {
    expect(extractTransitCoordinates('{"latitude":-4.32,"longitude":15.31,"label":"Position TMS"}')).toEqual({ latitude: -4.32, longitude: 15.31, label: "Position TMS" });
    expect(extractTransitCoordinates('{"latitude":999,"longitude":15}')).toBeNull();
    expect(extractTransitCoordinates(undefined)).toBeNull();
  });

  it("synthétise les jalons sans créer de position fictive", () => {
    const summary = getTransitSummary({ id: "S1", trackingNumber: "GLX-1", origin: "A", destination: "B", mode: "air", status: "in-transit", progress: 20, distanceRemainingKm: 200, eta: "À confirmer", lastTelemetryAt: "10:00", currentPosition: "Aéroport" }, [{ id: "e1", type: "location_update", severity: "info", source: "tms", message: "Point", occurredAt: "2026-01-01", payload: '{"lat":1,"lng":2}' }]);
    expect(summary.modeLabel).toBe("Aérien");
    expect(summary.latestCoordinates).toEqual({ latitude: 1, longitude: 2, label: undefined });
  });
});
