import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Google Sign-In natif", () => {
  it("utilise Credential Manager puis échange l’ID token dans Firebase", () => {
    const nativeFlow = readFileSync("lib/google-sign-in.native.ts", "utf8");
    const firebase = readFileSync("lib/firebase.ts", "utf8");

    expect(nativeFlow).toContain("react-native-nitro-google-signin");
    expect(nativeFlow).toContain('webClientId: "autoDetect"');
    expect(nativeFlow).toContain("checkPlayServices(true)");
    expect(nativeFlow).toContain("presentExplicitSignIn()");
    expect(nativeFlow).toContain("isSuccessResponse(response)");
    expect(firebase).toContain("FirebaseAuth.GoogleAuthProvider.credential(idToken)");
    expect(firebase).toContain("FirebaseAuth.signInWithCredential(getFirebaseAuth(), credential)");
    expect(firebase).not.toContain("configuration des clients OAuth Android et iOS");
  });

  it("mappe les erreurs natives critiques avec des messages actionnables", () => {
    const nativeFlow = readFileSync("lib/google-sign-in.native.ts", "utf8");

    expect(nativeFlow).toContain("statusCodes.PLAY_SERVICES_NOT_AVAILABLE");
    expect(nativeFlow).toContain("statusCodes.DEVELOPER_ERROR");
    expect(nativeFlow).toContain("empreinte SHA-1/SHA-256");
    expect(nativeFlow).toContain("La connexion Google a été annulée");
  });

  it("conserve une variante Web sans import du module natif", () => {
    const webFlow = readFileSync("lib/google-sign-in.web.ts", "utf8");
    expect(webFlow).not.toContain("react-native-nitro-google-signin");
  });

  it("efface la session Google native sans bloquer la déconnexion Firebase", () => {
    const nativeFlow = readFileSync("lib/google-sign-in.native.ts", "utf8");
    const authContext = readFileSync("lib/auth-context.tsx", "utf8");

    expect(nativeFlow).toContain("GoogleOneTapSignIn.signOut()");
    expect(authContext).toContain("await clearGoogleSession()");
  });
});
