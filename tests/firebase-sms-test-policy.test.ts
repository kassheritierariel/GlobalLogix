import { describe, expect, it } from "vitest";
import { firebaseSmsTestInstructions, validateFirebaseSmsTestSetup } from "../lib/firebase-sms-test-policy";

describe("assistance de test Firebase SMS", () => {
  it("valide un numéro international et un code de test à six chiffres sans les stocker", () => {
    expect(validateFirebaseSmsTestSetup("+243 812 345 678", "123456")).toEqual({ normalizedPhone: "+243812345678", codeLength: 6 });
    expect(() => validateFirebaseSmsTestSetup("+243812345678", "12345")).toThrow(/6 chiffres/);
  });
  it("explique l’essai sans exposer de donnée de test", () => {
    const instructions = firebaseSmsTestInstructions("/agency/kivuline-cargo");
    expect(instructions.steps).toHaveLength(3);
    expect(instructions.privacy).toMatch(/jamais enregistrés/);
  });
});
