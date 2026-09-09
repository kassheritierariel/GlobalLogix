import { getGoogleMapsFallbackCopy } from "../lib/google-maps-fallback";
import { describe, expect, it } from "vitest";

describe("vue de secours Google Maps", () => {
  it("explique clairement une clé manquante sans masquer le suivi", () => {
    const message = getGoogleMapsFallbackCopy("missing");
    expect(message).toContain("clé Google Maps configurée");
    expect(message).toContain("jalons de transit");
  });

  it("explique clairement une clé refusée", () => {
    expect(getGoogleMapsFallbackCopy("invalid")).toContain("refusée");
  });
});
