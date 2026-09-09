import { describe, expect, it } from "vitest";
import { getExternalMapUrl, getMultimodalLocationPresentation } from "../lib/multimodal-location";

describe("localisation multimodale", () => {
  it("présente un contexte aérien sans inventer de coordonnées", () => {
    const value = getMultimodalLocationPresentation({ mode: "air", currentPosition: "Couloir aérien Afrique de l’Est" });
    expect(value.title).toBe("Localisation aérienne");
    expect(value.icon).toBe("flight");
  });

  it("présente un contexte maritime et terrestre selon le mode", () => {
    expect(getMultimodalLocationPresentation({ mode: "sea", currentPosition: "Port de Matadi" }).icon).toBe("directions-boat");
    expect(getMultimodalLocationPresentation({ mode: "land", currentPosition: "Hub Kasai" }).icon).toBe("local-shipping");
  });

  it("construit un lien cartographique avec une requête encodée", () => {
    expect(getExternalMapUrl({ currentPosition: "Port de Matadi", destination: "Kinshasa" })).toContain("Port%20de%20Matadi%2C%20Kinshasa");
  });
});
