import { describe, expect, it } from "vitest";

const runLiveGoogleMapsValidation = process.env.RUN_LIVE_GOOGLE_MAPS_KEY_VALIDATION === "true";

describe.skipIf(!runLiveGoogleMapsValidation)("clé Google Maps de production", () => {
  it("est présente et n’est pas refusée comme clé invalide", async () => {
    const key = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
    expect(key, "EXPO_PUBLIC_GOOGLE_MAPS_API_KEY doit être renseignée").toBeTruthy();

    const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=Kinshasa&key=${encodeURIComponent(key ?? "")}`);
    const payload = await response.json() as { status?: string; error_message?: string };
    expect(payload.status).not.toBe("REQUEST_DENIED");
    expect(payload.error_message ?? "").not.toMatch(/API key not valid|invalid api key/i);
  });
});
