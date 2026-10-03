export function normalizeAgencyPublicSlug(value: string) {
  const slug = value.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  if (!/^[a-z0-9][a-z0-9-]{2,79}$/.test(slug)) {
    throw new Error("Lien d’agence invalide : utilisez 3 à 80 lettres, chiffres ou tirets.");
  }
  return slug;
}

export function defaultAgencyPublicSlug(agencyId: string) {
  return normalizeAgencyPublicSlug(agencyId.replaceAll("_", "-"));
}
