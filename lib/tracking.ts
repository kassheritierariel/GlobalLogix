import type { Shipment } from "./types";

export function advanceShipments(shipments: Shipment[], timestamp: string): Shipment[] {
  return shipments.map((shipment) => {
    if (shipment.status === "delivered" || shipment.status === "customs") {
      return { ...shipment, lastTelemetryAt: timestamp };
    }

    const step = shipment.mode === "air" ? 2.4 : shipment.mode === "sea" ? 0.8 : 1.5;
    const nextProgress = Math.min(99.5, Number((shipment.progress + step).toFixed(1)));
    const traveledRatio = (nextProgress - shipment.progress) / 100;

    return {
      ...shipment,
      progress: nextProgress,
      distanceRemainingKm: Math.max(0, Math.round(shipment.distanceRemainingKm * (1 - traveledRatio))),
      lastTelemetryAt: timestamp,
      currentPosition: nextProgress > 90 ? `Approche de ${shipment.destination}` : shipment.currentPosition,
    };
  });
}
