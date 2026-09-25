export type AgencyCustomDomainStatus = "not_configured" | "pending_dns" | "verified" | "disabled";

export function normalizeAgencyCustomDomain(value: string | null | undefined) {
  const trimmed = value?.trim().toLowerCase() ?? "";
  if (!trimmed) return null;
  if (/^https?:\/\//.test(trimmed) || /[/?#@]/.test(trimmed)) {
    throw new Error("Saisissez uniquement le domaine, par exemple suivi.votreagence.com.");
  }

  const normalized = trimmed.replace(/\.$/, "");
  if (normalized.length > 253 || normalized.split(".").length < 2) {
    throw new Error("Le domaine personnalisé doit contenir un nom de domaine complet.");
  }

  const isValid = normalized.split(".").every((label) => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label));
  if (!isValid) throw new Error("Le domaine personnalisé contient des caractères non pris en charge.");
  return normalized;
}

export function customDomainStatusLabel(status: AgencyCustomDomainStatus) {
  switch (status) {
    case "verified": return "Vérifié";
    case "pending_dns": return "En attente de validation DNS";
    case "disabled": return "Désactivé";
    default: return "Non configuré";
  }
}
