import { createSign } from "node:crypto";
import { describe, expect, it } from "vitest";
import { normalizeFirebasePrivateKey } from "../server/firebase-admin";

const describeFirebasePreproduction = process.env.RUN_FIREBASE_PREPROD_TESTS === "true" ? describe : describe.skip;

function base64Url(value: string | Buffer) {
  return Buffer.from(value).toString("base64url");
}

function createAssertion(serviceAccount: { client_email: string; private_key: string }) {
  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = base64Url(JSON.stringify({
    iss: serviceAccount.client_email,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 300,
  }));
  const signer = createSign("RSA-SHA256");
  signer.update(`${header}.${payload}`);
  signer.end();
  return `${header}.${payload}.${signer.sign(serviceAccount.private_key).toString("base64url")}`;
}

describeFirebasePreproduction("identifiants FCM v1", () => {
  it("obtient un jeton OAuth court pour envoyer des notifications Android", async () => {
    const raw = process.env.EXPO_PUSH_FCM_V1_SERVICE_ACCOUNT_JSON;
    expect(raw).toBeTruthy();
    const serviceAccount = JSON.parse(raw ?? "{}") as { client_email: string; private_key: string; project_id: string };
    expect(serviceAccount.project_id).toBe(process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID);
    serviceAccount.private_key = normalizeFirebasePrivateKey(serviceAccount.private_key);

    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: createAssertion(serviceAccount),
      }),
    });
    expect(response.ok).toBe(true);
    const payload = await response.json() as { access_token?: string; expires_in?: number };
    expect(payload.access_token).toBeTruthy();
    expect(payload.expires_in).toBeGreaterThan(0);
  }, 15_000);
});
