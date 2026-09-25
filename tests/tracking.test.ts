import { describe, expect, it } from "vitest";

import { DEMO_SHIPMENTS } from "../lib/demo-data";
import { advanceShipments } from "../lib/tracking";

describe("advanceShipments", () => {
  it("fait avancer les expéditions en transit et réduit la distance restante", () => {
    const before = DEMO_SHIPMENTS[0];
    const next = advanceShipments([before], "10:05:00")[0];

    expect(next.progress).toBeGreaterThan(before.progress);
    expect(next.distanceRemainingKm).toBeLessThan(before.distanceRemainingKm);
    expect(next.lastTelemetryAt).toBe("10:05:00");
  });

  it("conserve la progression d’une expédition à la douane tout en renouvelant son horodatage", () => {
    const customsShipment = DEMO_SHIPMENTS.find((shipment) => shipment.status === "customs");
    if (!customsShipment) throw new Error("Fixture douane manquante");

    const next = advanceShipments([customsShipment], "10:05:00")[0];
    expect(next.progress).toBe(customsShipment.progress);
    expect(next.distanceRemainingKm).toBe(customsShipment.distanceRemainingKm);
    expect(next.lastTelemetryAt).toBe("10:05:00");
  });
});
