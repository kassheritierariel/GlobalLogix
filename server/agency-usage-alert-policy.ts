export type AgencyUsageAlert = {
  level: "unlimited" | "healthy" | "approaching" | "reached";
  percent: number | null;
  title: string;
  message: string;
};

/** Les seuils sont déterministes : 80 % avertit, 100 % bloque la capacité du plan. */
export function getAgencyUsageAlert(usedShipments: number, shipmentLimit: number | null): AgencyUsageAlert {
  if (!shipmentLimit || shipmentLimit <= 0) {
    return { level: "unlimited", percent: null, title: "Capacité non limitée", message: "Aucune limite d’expédition n’est définie pour ce plan." };
  }
  const percent = Math.min(100, Math.round((usedShipments / shipmentLimit) * 100));
  if (percent >= 100) {
    return { level: "reached", percent, title: "Limite atteinte", message: `La capacité de ${shipmentLimit} expéditions est atteinte.` };
  }
  if (percent >= 80) {
    return { level: "approaching", percent, title: "Limite proche", message: `${usedShipments}/${shipmentLimit} expéditions utilisées ; prévoyez une montée de plan.` };
  }
  return { level: "healthy", percent, title: "Capacité maîtrisée", message: `${usedShipments}/${shipmentLimit} expéditions utilisées.` };
}
