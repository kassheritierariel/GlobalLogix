import { describe, expect, it } from "vitest";
import { customDomainStatusLabel, normalizeAgencyCustomDomain } from "../lib/agency-custom-domain";

describe("domaine personnalisé d’agence", () => {
  it("normalise un domaine complet sans protocole", () => {
    expect(normalizeAgencyCustomDomain(" Suivi.KivuLine.cd ")).toBe("suivi.kivuline.cd");
  });

  it("refuse une URL et un domaine incomplet", () => {
    expect(() => normalizeAgencyCustomDomain("https://suivi.kivuline.cd")).toThrow("uniquement le domaine");
    expect(() => normalizeAgencyCustomDomain("kivuline")).toThrow("nom de domaine complet");
  });

  it("expose un statut sans révéler de détail DNS", () => {
    expect(customDomainStatusLabel("pending_dns")).toBe("En attente de validation DNS");
  });
});
