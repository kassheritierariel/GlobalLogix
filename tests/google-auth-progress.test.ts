import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("progression de la connexion Google", () => {
  it("affiche des phases accessibles et désactive la double soumission", () => {
    const login = readFileSync("app/login.tsx", "utf8");
    const splash = readFileSync("components/google-auth-splash.tsx", "utf8");

    expect(login).toContain('useState<GoogleAuthPhase>("opening")');
    expect(login).toContain('setGooglePhase("waiting")');
    expect(login).toContain('setGooglePhase("redirecting")');
    expect(login).toContain('setGooglePhase("finalizing")');
    expect(login).toContain("disabled={isSubmitting || isGoogleSubmitting}");
    expect(splash).toContain('accessibilityLiveRegion="polite"');
    expect(splash).toContain('accessibilityRole="progressbar"');
    expect(splash).toContain("Sélectionnez votre compte");
    expect(splash).toContain("Redirection sécurisée");
    expect(splash).toContain("Chargement de votre espace");
  });
});
