export function normalizeAgencyPublicEmail(value: string) {
  return value.trim().toLowerCase();
}

export function isValidAgencyPublicEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeAgencyPublicEmail(value));
}
