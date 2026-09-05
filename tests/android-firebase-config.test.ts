import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("configuration Firebase Android", () => {
  it("associe la build GlobalLogix au bon package et au bon projet Firebase", () => {
    const projectRoot = resolve(process.cwd());
    const googleServices = JSON.parse(readFileSync(resolve(projectRoot, "google-services.json"), "utf8")) as {
      project_info: { project_id: string };
      client: Array<{ client_info: { android_client_info: { package_name: string } } }>;
    };
    const appConfig = readFileSync(resolve(projectRoot, "app.config.ts"), "utf8");

    expect(googleServices.project_info.project_id).toBe("globallogix-74286");
    expect(googleServices.client[0]?.client_info.android_client_info.package_name).toBe("com.app.globallogixmobile");
    expect(appConfig).toContain('googleServicesFile: "./google-services.json"');
  });
});
