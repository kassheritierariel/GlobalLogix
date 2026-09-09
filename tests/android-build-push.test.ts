import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const describeFirebasePreproduction = process.env.RUN_FIREBASE_PREPROD_TESTS === "true" ? describe : describe.skip;

describe("préparation Android notifications", () => {
  it("conserve le profil APK de production", () => {
    const eas = JSON.parse(readFileSync("eas.json", "utf8")) as { build?: { "production-apk"?: { android?: { buildType?: string } } } };
    expect(eas.build?.["production-apk"]?.android?.buildType).toBe("apk");
  });

  it("déclare le plugin Expo Notifications et la permission Android", () => {
    const config = readFileSync("app.config.ts", "utf8");
    expect(config).toContain('"expo-notifications"');
    expect(config).toContain('"POST_NOTIFICATIONS"');
    expect(config).toContain('googleServicesFile: "./google-services.json"');
  });
});

describeFirebasePreproduction("configuration Firebase Android de préproduction", () => {
  it("conserve le fichier Firebase Android fourni hors dépôt", () => {
    expect(existsSync("google-services.json")).toBe(true);
  });
});
