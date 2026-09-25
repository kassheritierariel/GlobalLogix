import { describe, expect, it } from "vitest";
import { createSimulatedGpsUpdate } from "../lib/gps-simulator";

const shipment = { id: "demo-air", trackingNumber: "GLX-001", origin: "Kinshasa", destination: "Bruxelles", mode: "air" as const, status: "in-transit" as const, progress: 44, distanceRemainingKm: 5000, eta: "Demain", lastTelemetryAt: "10:00", currentPosition: "Kinshasa" };

describe("simulateur GPS", () => {
  it("génère un événement local de position sans modifier le modèle serveur", () => {
    const update = createSimulatedGpsUpdate(shipment, 0);
    expect(update.event.source).toBe("SIMULATEUR GPS");
    expect(update.event.payload).toContain('"simulated":true');
    expect(update.progress).toBeGreaterThan(shipment.progress);
  });

  it("respecte le mode de transport et la vitesse sélectionnés", () => {
    const update = createSimulatedGpsUpdate(shipment, 1, { mode: "sea", speed: "fast" });
    expect(update.mode).toBe("sea");
    expect(update.speed).toBe("fast");
    expect(update.event.message).toContain("maritime");
    expect(update.event.payload).toContain('"mode":"sea"');
    expect(update.event.payload).toContain('"speed":"fast"');
  });
});
