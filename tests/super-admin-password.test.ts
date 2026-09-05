import { describe, expect, it } from "vitest";
import { isTemporaryPasswordStrong } from "../server/password-policy";

describe("mot de passe temporaire du super_admin", () => {
  it("respecte la politique de sécurité avant application dans Firebase", () => {
    expect(isTemporaryPasswordStrong("GlobalLogix!2026")).toBe(true);
    expect(isTemporaryPasswordStrong("court1!")).toBe(false);
    expect(isTemporaryPasswordStrong(process.env.GLOBALLOGIX_SUPER_ADMIN_TEMP_PASSWORD)).toBe(true);
  });
});
