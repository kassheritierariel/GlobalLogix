import { describe, expect, it } from "vitest";

import { createExceptionFromEvent } from "../server/logistics-rules";

describe("règles d’exception logistique", () => {
  it("ouvre un incident critique avec une SLA d’une heure pour un retard critique", () => {
    const now = new Date("2026-08-22T10:00:00.000Z");
    const exception = createExceptionFromEvent({ shipmentId: "GLX-801", agencyId: "agency-kinshasa", type: "delay_detected", severity: "critical", message: "ETA dépassée", now });
    expect(exception?.kind).toBe("delay");
    expect(exception?.severity).toBe("critical");
    expect(exception?.slaDueAt.toISOString()).toBe("2026-08-22T11:00:00.000Z");
  });

  it("ouvre une exception douanière à surveiller et ignore les événements ordinaires", () => {
    const customs = createExceptionFromEvent({ shipmentId: "GLX-806", agencyId: "agency-kinshasa", type: "customs_hold", severity: "warning", message: "Contrôle documentaire", now: new Date("2026-08-22T10:00:00.000Z") });
    const location = createExceptionFromEvent({ shipmentId: "GLX-806", agencyId: "agency-kinshasa", type: "location_update", severity: "info", message: "Position mise à jour" });
    expect(customs?.kind).toBe("customs");
    expect(customs?.slaDueAt.toISOString()).toBe("2026-08-22T14:00:00.000Z");
    expect(location).toBeNull();
  });
});
