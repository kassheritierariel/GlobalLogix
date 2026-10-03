import type { GlobalLogixRole } from "./firebase-admin";

export type AgencyManager = {
  role: GlobalLogixRole;
  agencyId: string | null;
};

export const agencyMemberRoles = ["staff", "viewer"] as const;
export type AgencyMemberRole = (typeof agencyMemberRoles)[number];

export function resolveAgencyManagementScope(actor: AgencyManager, requestedAgencyId?: string | null) {
  if (actor.role === "super_admin") {
    if (!requestedAgencyId) throw new Error("Un code agence est requis pour cette opération globale");
    return requestedAgencyId;
  }
  if (actor.role !== "agency_admin" || !actor.agencyId) {
    throw new Error("Administrateur d’agence requis");
  }
  if (requestedAgencyId && requestedAgencyId !== actor.agencyId) {
    throw new Error("Gestion inter-agence interdite");
  }
  return actor.agencyId;
}

export function assertAgencyMemberRole(role: string): asserts role is AgencyMemberRole {
  if (!agencyMemberRoles.includes(role as AgencyMemberRole)) {
    throw new Error("Seuls les rôles staff et viewer sont gérables par une agence");
  }
}
