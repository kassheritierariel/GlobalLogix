import { describe, expect, it } from "vitest";

import { assertChariowCheckoutConfiguration, getChariowProductEnvKey } from "../server/chariow-api";

describe("Chariow product configuration", () => {
  it("uses a distinct server configuration key per plan and billing cycle", () => {
    expect(getChariowProductEnvKey("starter", "monthly")).toBe("CHARIOW_PRODUCT_STARTER_MONTHLY_ID");
    expect(getChariowProductEnvKey("enterprise", "annual")).toBe("CHARIOW_PRODUCT_ENTERPRISE_ANNUAL_ID");
  });

  it("keeps checkout inactive until an API key is configured", () => {
    const previous = process.env.CHARIOW_API_KEY;
    delete process.env.CHARIOW_API_KEY;
    expect(() => assertChariowCheckoutConfiguration("starter", "monthly")).toThrow("mode configuration");
    if (previous === undefined) delete process.env.CHARIOW_API_KEY;
    else process.env.CHARIOW_API_KEY = previous;
  });
});
