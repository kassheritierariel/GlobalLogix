import type { Shipment } from "@/lib/types";
import type { DetailedTransitEvent } from "@/lib/shipment-detail";

type SimulationPoint = { position: string; latitude: number; longitude: number };
export type GpsSimulationSpeed = "slow" | "standard" | "fast";
export type GpsSimulationOptions = { mode?: Shipment["mode"]; speed?: GpsSimulationSpeed };

export const GPS_SIMULATION_SPEEDS: Array<{ id: GpsSimulationSpeed; label: string; progressStep: number }> = [
  { id: "slow", label: "Lente", progressStep: 1 },
  { id: "standard", label: "Normale", progressStep: 3 },
  { id: "fast", label: "Rapide", progressStep: 6 },
];

const routes: Record<Shipment["mode"], SimulationPoint[]> = {
  air: [{ position: "Couloir aérien Kinshasa–Bruxelles", latitude: 3.45, longitude: 12.42 }, { position: "Approche de l’aéroport de Bruxelles", latitude: 50.9, longitude: 4.49 }, { position: "Terminal cargo Bruxelles", latitude: 50.9, longitude: 4.48 }],
  sea: [{ position: "Chenail maritime de Matadi", latitude: -5.82, longitude: 13.45 }, { position: "Au large du golfe de Guinée", latitude: -1.2, longitude: 5.2 }, { position: "Approche du port d’Anvers", latitude: 51.25, longitude: 4.37 }],
  land: [{ position: "Corridor logistique RN1", latitude: -4.33, longitude: 15.3 }, { position: "Poste de contrôle routier", latitude: -5.89, longitude: 29.2 }, { position: "Hub régional de destination", latitude: -6.81, longitude: 39.28 }],
};

export function createSimulatedGpsUpdate(shipment: Shipment, sequence: number, options: GpsSimulationOptions = {}) {
  const mode = options.mode ?? shipment.mode;
  const speed = options.speed ?? "standard";
  const speedProfile = GPS_SIMULATION_SPEEDS.find((profile) => profile.id === speed) ?? GPS_SIMULATION_SPEEDS[1];
  const point = routes[mode][sequence % routes[mode].length];
  const progress = Math.min(99, shipment.progress + speedProfile.progressStep + (sequence % 2));
  const occurredAt = new Date().toISOString();
  const event: DetailedTransitEvent = {
    id: `sim-gps-${shipment.id}-${sequence}`,
    type: "location_update",
    severity: "info",
    source: "SIMULATEUR GPS",
    message: `Position simulée ${mode === "air" ? "aérienne" : mode === "sea" ? "maritime" : "terrestre"} à vitesse ${speedProfile.label.toLowerCase()} : ${point.position}. Progression estimée à ${progress}%.`,
    occurredAt,
    payload: JSON.stringify({ latitude: point.latitude, longitude: point.longitude, simulated: true, mode, speed }),
  };
  return { position: point.position, progress, occurredAt, event, mode, speed };
}
