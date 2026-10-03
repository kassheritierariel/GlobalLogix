import { describe, expect, it } from "vitest";

import { assertAgencyChannelCanActivate } from "../server/agency-whatsapp-activation-policy";

describe("activation de canal WhatsApp d’agence", () => {
  it("refuse une configuration Meta non validée", () => {
    expect(() => assertAgencyChannelCanActivate({ configured: true, status: "draft", lastValidatedAt: null })).toThrow("webhook Meta");
  });

  it("autorise seulement une connexion Meta configurée et validée", () => {
    expect(() => assertAgencyChannelCanActivate({ configured: true, status: "verified", lastValidatedAt: new Date() })).not.toThrow();
  });

  it("explique si les éléments de webhook Meta sont absents", async () => {
    const { describeAgencyChannelActivation } = await import("../server/agency-whatsapp-activation-policy");
    expect(describeAgencyChannelActivation({ configured: false, connectionConfigured: true, webhookConfigured: false, status: "draft", lastValidatedAt: null })).toMatchObject({ tone: "error" });
  });
});
