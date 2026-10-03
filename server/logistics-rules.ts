import { randomUUID } from "node:crypto";

export type ExceptionSeed = {
  id: string;
  shipmentId: string;
  agencyId: string;
  kind: "delay" | "customs";
  severity: "warning" | "critical";
  status: "open";
  title: string;
  description: string;
  slaDueAt: Date;
};

export function createExceptionFromEvent(input: {
  shipmentId: string;
  agencyId: string;
  type: "location_update" | "status_changed" | "eta_changed" | "customs_hold" | "delay_detected" | "note";
  severity: "info" | "warning" | "critical";
  message: string;
  now?: Date;
}): ExceptionSeed | null {
  if (input.type !== "delay_detected" && input.type !== "customs_hold") return null;
  const severity = input.severity === "critical" ? "critical" : "warning";
  const now = input.now ?? new Date();
  return {
    id: randomUUID(),
    shipmentId: input.shipmentId,
    agencyId: input.agencyId,
    kind: input.type === "delay_detected" ? "delay" : "customs",
    severity,
    status: "open",
    title: input.type === "delay_detected" ? "Retard détecté automatiquement" : "Blocage douanier détecté",
    description: input.message,
    slaDueAt: new Date(now.getTime() + (severity === "critical" ? 60 : 240) * 60 * 1000),
  };
}
