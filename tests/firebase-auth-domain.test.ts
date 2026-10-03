import { describe, expect, it } from "vitest";

import { GLOBALLOGIX_PUBLIC_WEB_HOST } from "../lib/firebase-auth-origin";

const authDomain = process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN?.trim();
const apiKey = process.env.EXPO_PUBLIC_FIREBASE_API_KEY?.trim();

describe("Firebase Auth domain", () => {
  it.skipIf(!authDomain || !apiKey)("expose le projet Firebase attendu", async () => {
    expect(authDomain).toBe("globallogix-74286.firebaseapp.com");

    const response = await fetch(
      `https://www.googleapis.com/identitytoolkit/v3/relyingparty/getProjectConfig?key=${apiKey}`,
    );
    expect(response.ok).toBe(true);

    const config = (await response.json()) as { projectId?: string; authorizedDomains?: string[] };
    expect(config.projectId).toBe("875696296157");
    expect(config.authorizedDomains).toContain(GLOBALLOGIX_PUBLIC_WEB_HOST);
  });
});
