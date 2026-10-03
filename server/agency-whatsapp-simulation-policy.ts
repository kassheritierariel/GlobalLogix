export const WHATSAPP_SIMULATION_EVENT_TYPES = ["status_changed", "eta_changed", "customs_hold", "delay_detected", "delivery_confirmed"] as const;
export type WhatsAppSimulationEventType = (typeof WHATSAPP_SIMULATION_EVENT_TYPES)[number];

/** Produit un aperçu strictement local : pas de numéro, pas de jeton, pas de requête Meta. */
export function createAgencyWhatsAppSimulation(input: { trackingNumber: string; eventType: WhatsAppSimulationEventType; message: string }) {
  const trackingNumber = input.trackingNumber.trim().toUpperCase().slice(0, 80);
  const message = input.message.trim().slice(0, 180);
  if (!trackingNumber) throw new Error("Indiquez une référence de colis pour la simulation.");
  if (!message) throw new Error("Indiquez le contenu de la mise à jour simulée.");
  return {
    trackingNumber,
    eventType: input.eventType,
    status: "simulated" as const,
    sanitizedSummary: `Simulation WhatsApp · ${input.eventType.replace(/_/g, " ")} · ${trackingNumber}`,
    preview: `Bonjour, mise à jour simulée pour le colis ${trackingNumber} : ${message}`,
    safetyNote: "Simulation locale : aucun numéro client, secret d’agence ou appel Meta n’a été utilisé.",
  };
}
