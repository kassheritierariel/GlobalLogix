import { describe, expect, it } from "vitest";
import { notificationSkipSummary, shouldNotifyAgencyShipmentEvent } from "../server/agency-shipment-notification-policy";

describe("politique de notifications WhatsApp par jalon", () => {
  it("envoie uniquement les changements métier et les alertes importantes", () => {
    expect(shouldNotifyAgencyShipmentEvent("status_changed", "info")).toBe(true);
    expect(shouldNotifyAgencyShipmentEvent("eta_changed", "warning")).toBe(true);
    expect(shouldNotifyAgencyShipmentEvent("customs_hold", "critical")).toBe(true);
    expect(shouldNotifyAgencyShipmentEvent("delay_detected", "info")).toBe(true);
  });
  it("écarte les positions GPS et les notes pour éviter les envois abusifs", () => {
    expect(shouldNotifyAgencyShipmentEvent("location_update", "info")).toBe(false);
    expect(shouldNotifyAgencyShipmentEvent("note", "critical")).toBe(false);
    expect(notificationSkipSummary("channel_inactive")).not.toMatch(/token|secret|\+243/i);
  });
});
