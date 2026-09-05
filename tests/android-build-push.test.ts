import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("préparation Android notifications", () => {
  it("conserve le fichier Firebase Android et le profil APK de production", () => {
    expect(existsSync("google-services.json")).toBe(true);
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
