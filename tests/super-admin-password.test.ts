import { describe, expect, it } from "vitest";
import { isTemporaryPasswordStrong } from "../server/password-policy";

const describeFirebasePreproduction = process.env.RUN_FIREBASE_PREPROD_TESTS === "true" ? describe : describe.skip;

describe("mot de passe temporaire du super_admin", () => {
  it("respecte la politique de sécurité locale", () => {
    expect(isTemporaryPasswordStrong("GlobalLogix!2026")).toBe(true);
    expect(isTemporaryPasswordStrong("court1!")).toBe(false);
  });
});

describeFirebasePreproduction("mot de passe temporaire Firebase", () => {
  it("respecte la politique de sécurité avant application dans Firebase", () => {
    expect(isTemporaryPasswordStrong(process.env.GLOBALLOGIX_SUPER_ADMIN_TEMP_PASSWORD)).toBe(true);
  });
});
