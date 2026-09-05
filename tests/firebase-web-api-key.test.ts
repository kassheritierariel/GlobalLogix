import { describe, expect, it } from "vitest";

describe("clé API Web Firebase", () => {
  it("accède à Identity Toolkit sans restriction de service bloquante", async () => {
    const apiKey = process.env.EXPO_PUBLIC_FIREBASE_API_KEY;
    expect(apiKey).toBeTruthy();

    const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:createAuthUri?key=${encodeURIComponent(apiKey ?? "")}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: "validation.globallogix@example.invalid", continueUri: "https://example.com", providerId: "password" }),
    });
    const body = await response.text();
    expect(body).not.toContain("API_KEY_SERVICE_BLOCKED");
    expect(body).not.toContain("API_KEY_INVALID");
    expect(body).not.toContain("Requests to this API identitytoolkit method");
    expect(response.status, body).not.toBe(403);
  }, 20_000);
});
