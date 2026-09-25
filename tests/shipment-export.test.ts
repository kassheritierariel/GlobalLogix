import { describe, expect, it } from "vitest";
import { buildShipmentCsv, buildShipmentPdfHtml } from "../lib/shipment-export-format";

const shipment = { id: "s1", trackingNumber: "GLX;001", origin: "Kinshasa", destination: "Bruxelles", mode: "air" as const, status: "in-transit" as const, progress: 42, distanceRemainingKm: 5400, eta: "24 août", lastTelemetryAt: "10:00", currentPosition: "Aéroport N'Djili" };

describe("exports d’expédition", () => {
  it("génère un CSV échappé et lisible", () => {
    const csv = buildShipmentCsv([shipment]);
    expect(csv).toContain('"GLX;001"');
    expect(csv).toContain("Aérien");
  });
  it("génère un rapport PDF HTML sans injecter le contenu de transit", () => {
    const html = buildShipmentPdfHtml([{ ...shipment, currentPosition: "<script>" }], "Rapport");
    expect(html).toContain("Rapport");
    expect(html).toContain("&lt;script&gt;");
  });
});
