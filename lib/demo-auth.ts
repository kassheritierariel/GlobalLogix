import type { MobileUser } from "./types";

export function createDemoUser(username: string, password: string): MobileUser {
  const displayName = username.trim();
  if (!displayName || !password) {
    throw new Error("Renseignez l’identifiant et le mot de passe.");
  }

  return {
    uid: "demo-agency-admin",
    email: null,
    displayName,
    role: "agency_admin",
    agencyId: "agency-kinshasa",
  };
}
