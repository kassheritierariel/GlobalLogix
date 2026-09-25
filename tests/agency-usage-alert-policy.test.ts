import { describe, expect, it } from "vitest";

import { getAgencyUsageAlert } from "../server/agency-usage-alert-policy";

describe("alertes de capacité SaaS", () => {
  it("signale une capacité proche à partir de 80 %", () => {
    expect(getAgencyUsageAlert(80, 100)).toMatchObject({ level: "approaching", percent: 80 });
  });

  it("signale une limite atteinte sans dépasser 100 %", () => {
    expect(getAgencyUsageAlert(150, 100)).toMatchObject({ level: "reached", percent: 100 });
  });

  it("indique explicitement les plans sans limite", () => {
    expect(getAgencyUsageAlert(7, null)).toMatchObject({ level: "unlimited", percent: null });
  });
});
