import { describe, expect, it } from "vitest";
import { createAgencyWhatsAppSimulation } from "../server/agency-whatsapp-simulation-policy";

describe("simulation WhatsApp d’agence", () => {
  it("produit un aperçu sans numéro ni appel Meta", () => {
    const result = createAgencyWhatsAppSimulation({ trackingNumber: "glx-243-1", eventType: "delay_detected", message: "Arrivée reportée de 24 h." });
    expect(result.status).toBe("simulated");
    expect(result.preview).toContain("GLX-243-1");
    expect(result.safetyNote).toMatch(/aucun numéro client/i);
  });
  it("refuse un aperçu incomplet", () => {
    expect(() => createAgencyWhatsAppSimulation({ trackingNumber: "", eventType: "status_changed", message: "Mise à jour" })).toThrow(/référence/);
  });
  it("autorise un aperçu de confirmation de livraison", () => {
    expect(createAgencyWhatsAppSimulation({ trackingNumber: "GLX-24", eventType: "delivery_confirmed", message: "Votre colis a été livré." }).eventType).toBe("delivery_confirmed");
  });
});
