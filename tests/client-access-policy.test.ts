import { describe, expect, it } from "vitest";

import { requireClientPhone } from "../server/client-access-policy";

describe("politique d’accès client", () => {
  it("n’accepte qu’un principal client muni de son numéro Firebase", () => {
    expect(requireClientPhone({ role: "client", phoneNumber: "+243812345678" })).toBe("+243812345678");
  });

  it("rejette les rôles d’agence et les sessions sans numéro SMS", () => {
    expect(() => requireClientPhone({ role: "staff", phoneNumber: "+243812345678" })).toThrow("Connexion SMS client requise");
    expect(() => requireClientPhone({ role: "client" })).toThrow("Connexion SMS client requise");
  });
});
