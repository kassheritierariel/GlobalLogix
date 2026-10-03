import { describe, expect, it } from "vitest";
import { toFirebaseAuthMessage } from "../lib/firebase-auth-errors";

describe("messages d’erreur Firebase", () => {
  it("explique le domaine non autorisé sans exposer de configuration", () => {
    const message = toFirebaseAuthMessage({ code: "auth/unauthorized-domain" });
    expect(message).toContain("domaines explicitement autorisés");
    expect(message).toContain("globallogix-j5jxfyba.manus.space");
  });

  it("explique le format e-mail invalide", () => {
    expect(toFirebaseAuthMessage({ code: "auth/invalid-email" })).toContain("adresse e-mail valide");
  });
});
