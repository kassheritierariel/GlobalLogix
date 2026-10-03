import { describe, expect, it } from "vitest";
import { isValidAgencyPublicEmail, normalizeAgencyPublicEmail } from "../lib/agency-registration-validation";

describe("validation de l’e-mail public d’agence", () => {
  it("normalise une adresse publique valide", () => {
    expect(normalizeAgencyPublicEmail(" Contact@KivuLine.cd ")).toBe("contact@kivuline.cd");
    expect(isValidAgencyPublicEmail(" Contact@KivuLine.cd ")).toBe(true);
  });

  it("refuse une adresse incomplète avant la requête", () => {
    expect(isValidAgencyPublicEmail("contact@agence")).toBe(false);
    expect(isValidAgencyPublicEmail("agence.com")).toBe(false);
  });
});
