import { describe, expect, it } from "vitest";

import { maskWhatsAppNumber, normalizeWhatsAppNumber } from "../lib/whatsapp-number";

describe("numéro WhatsApp client", () => {
  it("normalise un numéro international sans deviner l’indicatif", () => {
    expect(normalizeWhatsAppNumber("00 243 812-345-678")).toBe("+243812345678");
  });

  it("rejette un numéro ambigu et masque la donnée affichée", () => {
    expect(() => normalizeWhatsAppNumber("0812345678")).toThrow("format international");
    expect(maskWhatsAppNumber("+243812345678")).toBe("+2438••••5678");
  });
});
