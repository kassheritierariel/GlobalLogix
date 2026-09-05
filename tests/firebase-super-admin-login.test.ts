import { describe, expect, it } from "vitest";

describe("connexion Firebase du super_admin", () => {
  it("accepte le mot de passe temporaire défini pour le compte administrateur", async () => {
    const apiKey = process.env.EXPO_PUBLIC_FIREBASE_API_KEY;
    const password = process.env.GLOBALLOGIX_SUPER_ADMIN_TEMP_PASSWORD;
    expect(apiKey).toBeTruthy();
    expect(password).toBeTruthy();

    const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${encodeURIComponent(apiKey ?? "")}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "kassheritier@telgroups.org",
        password,
        returnSecureToken: true,
      }),
    });
    const body = await response.json() as { localId?: string; idToken?: string; error?: { message?: string } };
    expect(response.ok, body.error?.message ?? "Échec Firebase sans message").toBe(true);
    expect(body.localId).toBe("kQxQgYDp8TNNGH06WUwy3I5ls522");
    expect(body.idToken).toBeTruthy();
  }, 20_000);
});
