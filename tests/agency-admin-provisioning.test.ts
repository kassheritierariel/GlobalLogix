import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { normalizeAgencyId } from "../server/firebase-admin";

describe("provisionnement d’un agency_admin", () => {
  it("accepte un code agence sûr et refuse les identifiants ambigus", () => {
    expect(normalizeAgencyId("GLX2430001")).toBe("GLX2430001");
    expect(() => normalizeAgencyId("GLX 2430001")).toThrow("Code agence invalide");
    expect(() => normalizeAgencyId("x")).toThrow("Code agence invalide");
  });

  it("normalise le code agence dans le point central d’écriture des custom claims", () => {
    const firebaseAdmin = readFileSync("server/firebase-admin.ts", "utf8");
    expect(firebaseAdmin).toContain('const agencyId = isGlobalRole ? null : normalizeAgencyId(input.agencyId ?? "")');
    expect(firebaseAdmin).toContain("nextClaims.agencyId = agencyId");
  });
});
