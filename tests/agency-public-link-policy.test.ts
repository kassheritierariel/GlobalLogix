import { describe, expect, it } from "vitest";

import { defaultAgencyPublicSlug, normalizeAgencyPublicSlug } from "../server/agency-public-link-policy";

describe("liens publics d’agence", () => {
  it("normalise un lien en minuscules avec tirets", () => {
    expect(normalizeAgencyPublicSlug("Kivu Line Cargo")).toBe("kivu-line-cargo");
  });

  it("dérive un lien sûr à partir d’un code agence", () => {
    expect(defaultAgencyPublicSlug("GLX_243_0001")).toBe("glx-243-0001");
  });
});
