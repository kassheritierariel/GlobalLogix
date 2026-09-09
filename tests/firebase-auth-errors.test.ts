import { describe, expect, it } from "vitest";
import { toFirebaseAuthMessage } from "../lib/firebase-auth-errors";

describe("messages d’erreur Firebase", () => {
  it("explique le domaine non autorisé sans exposer de configuration", () => {
    expect(toFirebaseAuthMessage({ code: "auth/unauthorized-domain" })).toContain("domaines autorisés");
  });

  it("explique le format e-mail invalide", () => {
    expect(toFirebaseAuthMessage({ code: "auth/invalid-email" })).toContain("adresse e-mail valide");
  });
});
