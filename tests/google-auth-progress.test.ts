import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("progression de la connexion Google", () => {
  it("affiche des phases accessibles et désactive la double soumission", () => {
    const login = readFileSync("app/login.tsx", "utf8");
    const progress = readFileSync("components/google-auth-progress.tsx", "utf8");

    expect(login).toContain('useState<GoogleAuthPhase>("opening")');
    expect(login).toContain('setGooglePhase("waiting")');
    expect(login).toContain('setGooglePhase("redirecting")');
    expect(login).toContain('setGooglePhase("finalizing")');
    expect(login).toContain("disabled={isSubmitting || isGoogleSubmitting}");
    expect(progress).toContain('accessibilityLiveRegion="polite"');
    expect(progress).toContain('accessibilityRole="progressbar"');
    expect(progress).toContain("Sélection du compte en cours");
    expect(progress).toContain("Ouverture du domaine sécurisé");
    expect(progress).toContain("Vérification de votre session");
  });
});
