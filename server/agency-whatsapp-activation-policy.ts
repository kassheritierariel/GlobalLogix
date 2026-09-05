export type AgencyChannelActivationSummary = {
  configured: boolean;
  connectionConfigured?: boolean;
  webhookConfigured?: boolean;
  status: "draft" | "verified" | "active" | "disabled";
  lastValidatedAt: Date | string | null;
};

/**
 * Empêche toute activation tant que Meta n’a pas confirmé le webhook de l’agence.
 * La confirmation est matérialisée par le challenge `hub.verify_token` reçu sur
 * le webhook propre au tenant ; aucune validation locale ou secret n’est exposé.
 */
export function assertAgencyChannelCanActivate(summary: AgencyChannelActivationSummary | null) {
  if (!summary?.configured) throw new Error("La connexion Meta de l’agence est incomplète.");
  if (summary.status === "active") return;
  if (summary.status !== "verified" || !summary.lastValidatedAt) {
    throw new Error("Le webhook Meta doit être validé avant l’activation du canal.");
  }
}

export function describeAgencyChannelActivation(summary: AgencyChannelActivationSummary | null) {
  if (!summary) return { canActivate: false, tone: "neutral" as const, message: "Aucune connexion Meta n’est enregistrée pour cette agence." };
  if (summary.status === "active") return { canActivate: false, tone: "success" as const, message: "Canal actif : les mises à jour sont autorisées pour cette agence." };
  if (summary.status === "disabled") return { canActivate: false, tone: "neutral" as const, message: "Canal désactivé : réactivez la configuration Meta depuis les réglages d’agence." };
  if (summary.connectionConfigured === false) return { canActivate: false, tone: "error" as const, message: "Validation Meta impossible : jeton, numéro professionnel ou modèle de message manquant." };
  if (summary.webhookConfigured === false) return { canActivate: false, tone: "error" as const, message: "Validation Meta impossible : secret d’application ou jeton de webhook manquant." };
  if (!summary.configured) return { canActivate: false, tone: "error" as const, message: "Validation Meta impossible : configuration de sécurité incomplète." };
  if (summary.status !== "verified" || !summary.lastValidatedAt) return { canActivate: false, tone: "warning" as const, message: "En attente : Meta doit confirmer le webhook de cette agence avant l’activation." };
  return { canActivate: true, tone: "success" as const, message: "Webhook Meta validé : le super administrateur peut activer le canal." };
}
