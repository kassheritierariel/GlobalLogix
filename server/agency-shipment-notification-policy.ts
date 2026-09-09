export type NotifiableShipmentEvent = "location_update" | "status_changed" | "eta_changed" | "customs_hold" | "delay_detected" | "note";

/** Les jalons métier notifient le client ; les coordonnées GPS seules sont exclues pour éviter le spam. */
export function shouldNotifyAgencyShipmentEvent(type: NotifiableShipmentEvent, severity: "info" | "warning" | "critical") {
  if (type === "note" || type === "location_update") return false;
  if (type === "delay_detected" || type === "customs_hold") return true;
  return type === "status_changed" || (type === "eta_changed" && severity !== "info");
}

export function notificationSkipSummary(reason: "no_customer_phone" | "channel_inactive") {
  return reason === "no_customer_phone"
    ? "Notification automatique non envoyée : numéro WhatsApp client absent"
    : "Notification automatique en attente : canal WhatsApp de l’agence inactif";
}
