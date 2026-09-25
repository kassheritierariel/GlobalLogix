import { describe, expect, it } from "vitest";

import { createDemoUser } from "../lib/demo-auth";

describe("createDemoUser", () => {
  it("crée une session d’administrateur agence avec un identifiant normalisé", () => {
    expect(createDemoUser("  Alice Opérations  ", "secret")).toEqual({
      uid: "demo-agency-admin",
      email: null,
      displayName: "Alice Opérations",
      role: "agency_admin",
      agencyId: "agency-kinshasa",
    });
  });

  it("refuse les identifiants ou mots de passe vides", () => {
    expect(() => createDemoUser("", "secret")).toThrow("Renseignez l’identifiant");
    expect(() => createDemoUser("Alice", "")).toThrow("Renseignez l’identifiant");
  });
});
