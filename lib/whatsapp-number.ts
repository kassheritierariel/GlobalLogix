/** Normalise une identité WhatsApp au format E.164, sans deviner le pays. */
export function normalizeWhatsAppNumber(value: string) {
  const compact = value.trim().replace(/[\s().-]/g, "");
  const normalized = compact.startsWith("00") ? `+${compact.slice(2)}` : compact;
  if (!/^\+[1-9]\d{7,14}$/.test(normalized)) {
    throw new Error("Saisissez un numéro WhatsApp au format international, par exemple +243…");
  }
  return normalized;
}

export function maskWhatsAppNumber(value: string) {
  const normalized = normalizeWhatsAppNumber(value);
  return `${normalized.slice(0, Math.min(5, normalized.length - 4))}••••${normalized.slice(-4)}`;
}
