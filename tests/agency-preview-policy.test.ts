import { describe, expect, it } from "vitest";

import { assertSuperAdminAgencyPreview } from "../server/agency-preview-policy";

describe("prévisualisation éditeur d’agence", () => {
  it("autorise seulement le super administrateur", () => {
    expect(() => assertSuperAdminAgencyPreview({ role: "super_admin", agencyId: null })).not.toThrow();
    expect(() => assertSuperAdminAgencyPreview({ role: "agency_admin", agencyId: "KIVULINE-DEMO" })).toThrow("super administrateur");
  });
});
