import { describe, expect, it } from "vitest";

import { getSaaSPlan, isPlanWithinLimit, SAAS_PLANS } from "../lib/saas-plans";

describe("SaaS plans", () => {
  it("defines differentiated agency plans without inventing payment prices", () => {
    expect(SAAS_PLANS.map((plan) => plan.id)).toEqual(["starter", "operations", "enterprise"]);
    expect(getSaaSPlan("operations")?.shipmentLimit).toBe(1_000);
    expect(getSaaSPlan("unknown")).toBeUndefined();
  });

  it("enforces finite limits while keeping Enterprise unlimited", () => {
    expect(isPlanWithinLimit(99, 100)).toBe(true);
    expect(isPlanWithinLimit(100, 100)).toBe(false);
    expect(isPlanWithinLimit(99_999, null)).toBe(true);
  });
});
