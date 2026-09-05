import { createSign } from "node:crypto";
import { describe, expect, it } from "vitest";
import { normalizeFirebasePrivateKey } from "../server/firebase-admin";

function base64Url(value: string | Buffer) {
  return Buffer.from(value).toString("base64url");
}

function createServiceAccountAssertion(serviceAccount: { client_email: string; private_key: string }) {
  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = base64Url(JSON.stringify({
    iss: serviceAccount.client_email,
    scope: "https://www.googleapis.com/auth/firebase",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 300,
  }));
  const unsignedToken = `${header}.${payload}`;
  const signer = createSign("RSA-SHA256");
  signer.update(unsignedToken);
  signer.end();
  const signature = signer.sign(serviceAccount.private_key).toString("base64url");
  return `${unsignedToken}.${signature}`;
}

describe("Firebase credentials", () => {
  it("obtient un jeton OAuth de courte durée pour le compte de service configuré", async () => {
    const rawServiceAccount = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON;
    expect(rawServiceAccount).toBeTruthy();

    const serviceAccount = JSON.parse(rawServiceAccount ?? "{}") as {
      client_email: string;
      private_key: string;
      project_id: string;
    };
    expect(serviceAccount.client_email).toContain("@");
    serviceAccount.private_key = normalizeFirebasePrivateKey(serviceAccount.private_key);
    expect(serviceAccount.private_key).toContain("BEGIN PRIVATE KEY");
    expect(serviceAccount.project_id).toBe(process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID);

    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: createServiceAccountAssertion(serviceAccount),
      }),
    });

    expect(response.ok).toBe(true);
    const payload = await response.json() as { access_token?: string; expires_in?: number };
    expect(payload.access_token).toBeTruthy();
    expect(payload.expires_in).toBeGreaterThan(0);
  }, 15_000);
});
