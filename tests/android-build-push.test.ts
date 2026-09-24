import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const describeFirebasePreproduction = process.env.RUN_FIREBASE_PREPROD_TESTS === "true" ? describe : describe.skip;

describe("préparation Android notifications", () => {
  it("conserve le profil APK de production", () => {
    const eas = JSON.parse(readFileSync("eas.json", "utf8")) as {
      build?: {
        production?: { android?: { buildType?: string }; environment?: string; autoIncrement?: boolean };
        "production-apk"?: { android?: { buildType?: string }; environment?: string };
      };
      submit?: { production?: { android?: { track?: string; releaseStatus?: string } } };
    };
    expect(eas.build?.["production-apk"]?.android?.buildType).toBe("apk");
    expect(eas.build?.["production-apk"]?.environment).toBe("production");
    expect(eas.build?.production?.android?.buildType).toBe("app-bundle");
    expect(eas.build?.production?.environment).toBe("production");
    expect(eas.build?.production?.autoIncrement).toBe(true);
    expect(eas.submit?.production?.android).toEqual({ track: "internal", releaseStatus: "draft" });
  });

  it("déclare le plugin Expo Notifications et la permission Android", () => {
    const config = readFileSync("app.config.ts", "utf8");
    expect(config).toContain('"expo-notifications"');
    expect(config).toContain('"POST_NOTIFICATIONS"');
    expect(config).toContain("compileSdkVersion: 36");
    expect(config).toContain("targetSdkVersion: 36");
    expect(config).not.toContain('"expo-audio"');
    expect(config).toContain("process.env.GOOGLE_SERVICES_JSON?.trim()");
    expect(config).toContain("existsSync(googleServicesSecretPath)");
    expect(config).toContain("googleServicesFile,");
    const packageJson = JSON.parse(readFileSync("package.json", "utf8")) as { scripts?: Record<string, string> };
    expect(packageJson.scripts?.["eas-build-pre-install"]).toBe("node scripts/validate-google-services.mjs");
    const validator = readFileSync("scripts/validate-google-services.mjs", "utf8");
    expect(validator).toContain("copyFileSync(filePath, destinationPath)");
    expect(validator).toContain('resolve(process.cwd(), "google-services.json")');
  });

  it("matérialise et valide un secret fichier avant Expo Prebuild", () => {
    const fixtureRoot = mkdtempSync(resolve(tmpdir(), "globallogix-eas-hook-"));
    const secretPath = resolve(fixtureRoot, "eas-file-secret.json");
    const buildRoot = resolve(fixtureRoot, "project");
    const scriptPath = resolve(process.cwd(), "scripts/validate-google-services.mjs");

    try {
      mkdirSync(buildRoot);
      writeFileSync(
        secretPath,
        JSON.stringify({
          project_info: { project_id: "globallogix-74286" },
          client: [{ client_info: { android_client_info: { package_name: "com.app.globallogixmobile" } } }],
        }),
      );

      execFileSync(process.execPath, [scriptPath], {
        cwd: buildRoot,
        env: { ...process.env, EAS_BUILD_PLATFORM: "android", GOOGLE_SERVICES_JSON: secretPath },
        stdio: "pipe",
      });

      const materializedPath = resolve(buildRoot, "google-services.json");
      expect(existsSync(materializedPath)).toBe(true);
      expect(JSON.parse(readFileSync(materializedPath, "utf8")).project_info.project_id).toBe("globallogix-74286");
    } finally {
      rmSync(fixtureRoot, { force: true, recursive: true });
    }
  });
});

describeFirebasePreproduction("configuration Firebase Android de préproduction", () => {
  it("conserve le fichier Firebase Android fourni hors dépôt", () => {
    expect(existsSync("google-services.json")).toBe(true);
  });
});
