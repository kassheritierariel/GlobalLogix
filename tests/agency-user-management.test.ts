import { describe, expect, it } from "vitest";
import { assertAgencyMemberRole, resolveAgencyManagementScope } from "../server/user-management-policy";

describe("gestion des utilisateurs d’agence", () => {
  it("limite un agency_admin à son propre périmètre", () => {
    expect(resolveAgencyManagementScope({ role: "agency_admin", agencyId: "GLX2430001" })).toBe("GLX2430001");
    expect(() => resolveAgencyManagementScope({ role: "agency_admin", agencyId: "GLX2430001" }, "OTHER-01")).toThrow("inter-agence");
  });

  it("réserve la création d’équipe aux rôles staff et viewer", () => {
    expect(() => assertAgencyMemberRole("staff")).not.toThrow();
    expect(() => assertAgencyMemberRole("viewer")).not.toThrow();
    expect(() => assertAgencyMemberRole("agency_admin")).toThrow("staff et viewer");
  });

  it("demande un périmètre explicite au super_admin", () => {
    expect(() => resolveAgencyManagementScope({ role: "super_admin", agencyId: null })).toThrow("code agence");
    expect(resolveAgencyManagementScope({ role: "super_admin", agencyId: null }, "GLX2430001")).toBe("GLX2430001");
  });
});
