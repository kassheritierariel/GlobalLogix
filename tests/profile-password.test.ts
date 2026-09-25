import { describe, expect, it } from "vitest";
import { validatePasswordChange } from "../lib/profile-password";

describe("validation du changement de mot de passe", () => {
  it("accepte un mot de passe robuste et confirmé", () => {
    expect(validatePasswordChange({ currentPassword: "Ancien!2025", newPassword: "GlobalLogix!2026", confirmPassword: "GlobalLogix!2026" })).toBeNull();
  });

  it("refuse un mot de passe faible ou une confirmation différente", () => {
    expect(validatePasswordChange({ currentPassword: "Ancien!2025", newPassword: "faible", confirmPassword: "faible" })).toContain("12 caractères");
    expect(validatePasswordChange({ currentPassword: "Ancien!2025", newPassword: "GlobalLogix!2026", confirmPassword: "Autre!2026Global" })).toContain("ne correspondent pas");
  });
});
