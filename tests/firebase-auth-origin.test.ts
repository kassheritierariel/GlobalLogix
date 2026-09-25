import { describe, expect, it } from "vitest";

import {
  GLOBALLOGIX_PUBLIC_WEB_URL,
  resolveCanonicalGoogleAuthUrl,
} from "../lib/firebase-auth-origin";

describe("origine Google Sign-In", () => {
  it("redirige une prévisualisation Manus vers le domaine public autorisé", () => {
    expect(resolveCanonicalGoogleAuthUrl({
      hostname: "8081-preview-id.manus.computer",
      pathname: "/login",
      search: "?source=preview",
      hash: "#google",
    })).toBe(`${GLOBALLOGIX_PUBLIC_WEB_URL}/login?source=preview#google`);
  });

  it("ne redirige pas le domaine public, localhost ou un domaine personnalisé", () => {
    expect(resolveCanonicalGoogleAuthUrl({ hostname: "globallogix-j5jxfyba.manus.space", pathname: "/login", search: "", hash: "" })).toBeNull();
    expect(resolveCanonicalGoogleAuthUrl({ hostname: "localhost", pathname: "/login", search: "", hash: "" })).toBeNull();
    expect(resolveCanonicalGoogleAuthUrl({ hostname: "suivi.example.com", pathname: "/login", search: "", hash: "" })).toBeNull();
  });
});
