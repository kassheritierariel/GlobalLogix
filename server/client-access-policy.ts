export type ClientPrincipal = {
  role: string;
  phoneNumber?: string | null;
};

/** Un portail client n’accepte que la session SMS Firebase associée au compte. */
export function requireClientPhone(principal: ClientPrincipal) {
  if (principal.role !== "client" || !principal.phoneNumber) {
    throw new Error("Connexion SMS client requise");
  }
  return principal.phoneNumber;
}
