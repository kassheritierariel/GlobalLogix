import { normalizeWhatsAppNumber } from "./whatsapp-number";

/** Validation locale d’un scénario Firebase Console ; aucun numéro ni code n’est envoyé ou conservé. */
export function validateFirebaseSmsTestSetup(phoneNumber: string, verificationCode: string) {
  const normalizedPhone = normalizeWhatsAppNumber(phoneNumber);
  const code = verificationCode.trim();
  if (!/^\d{6}$/.test(code)) throw new Error("Le code de test Firebase doit contenir exactement 6 chiffres.");
  return { normalizedPhone, codeLength: code.length };
}

export function firebaseSmsTestInstructions(publicAgencyPath: string) {
  return {
    steps: [
      "Dans Firebase Authentication, ouvrez Sign-in method puis Phone.",
      "Dans Phone numbers for testing, ajoutez un numéro international et un code de 6 chiffres.",
      `Ouvrez ${publicAgencyPath} sur Android ou iOS, puis suivez l’accès client avec ce numéro et ce code.`,
    ],
    privacy: "Le numéro de test et son code ne sont jamais enregistrés dans GlobalLogix.",
  };
}
