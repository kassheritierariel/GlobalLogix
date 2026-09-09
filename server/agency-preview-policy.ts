import type { AgencyManager } from "./user-management-policy";

/** La prévisualisation d’un tenant est un privilège d’éditeur, jamais une fonction d’agence. */
export function assertSuperAdminAgencyPreview(actor: AgencyManager) {
  if (actor.role !== "super_admin") {
    throw new Error("Prévisualisation réservée au super administrateur");
  }
}
