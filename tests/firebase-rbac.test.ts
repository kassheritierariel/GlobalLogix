import { describe, expect, it } from "vitest";

import { canManageAgency, type FirebasePrincipal } from "../server/firebase-admin";

const agencyAdmin: FirebasePrincipal = {
  uid: "agency-admin-1",
  email: "admin@example.com",
  displayName: "Admin agence",
  role: "agency_admin",
  agencyId: "agency-kinshasa",
  disabled: false,
};

describe("Firebase Custom Claims RBAC", () => {
  it("autorise un administrateur d’agence uniquement sur son périmètre", () => {
    expect(canManageAgency(agencyAdmin, "agency-kinshasa")).toBe(true);
    expect(canManageAgency(agencyAdmin, "agency-matadi")).toBe(false);
  });

  it("autorise un super administrateur sur tous les périmètres", () => {
    expect(canManageAgency({ ...agencyAdmin, role: "super_admin", agencyId: null }, "agency-matadi")).toBe(true);
  });
});
