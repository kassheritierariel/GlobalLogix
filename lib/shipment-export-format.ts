import type { Shipment } from "@/lib/types";

function escapeCsv(value: string | number) {
  const raw = String(value).replaceAll('"', '""');
  return /[;"\n]/.test(raw) ? `"${raw}"` : raw;
}

function modeLabel(mode: Shipment["mode"]) {
  return mode === "air" ? "Aérien" : mode === "sea" ? "Maritime" : "Terrestre";
}

export function buildShipmentCsv(shipments: Shipment[]) {
  const header = ["N° de suivi", "Transport", "Statut", "Origine", "Destination", "Progression", "Position actuelle", "ETA", "Distance restante (km)"];
  const rows = shipments.map((shipment) => [shipment.trackingNumber, modeLabel(shipment.mode), shipment.status, shipment.origin, shipment.destination, `${shipment.progress}%`, shipment.currentPosition, shipment.eta, shipment.distanceRemainingKm]);
  return [header, ...rows].map((row) => row.map(escapeCsv).join(";")).join("\n");
}

function escapeHtml(value: string | number) {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

export function buildShipmentPdfHtml(shipments: Shipment[], title: string) {
  const rows = shipments.map((shipment) => `<tr><td>${escapeHtml(shipment.trackingNumber)}</td><td>${escapeHtml(modeLabel(shipment.mode))}</td><td>${escapeHtml(shipment.status)}</td><td>${escapeHtml(`${shipment.origin} → ${shipment.destination}`)}</td><td>${escapeHtml(`${shipment.progress}%`)}</td><td>${escapeHtml(shipment.currentPosition)}</td><td>${escapeHtml(shipment.eta)}</td></tr>`).join("");
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><style>@page { margin: 24px; } body { font-family: Arial, sans-serif; color: #0A2540; } h1 { font-size: 20px; margin: 0; } p { color: #607386; font-size: 11px; } table { border-collapse: collapse; width: 100%; margin-top: 18px; font-size: 10px; } th { background: #0A2540; color: white; text-align: left; padding: 7px; } td { border-bottom: 1px solid #D9E2EC; padding: 7px; vertical-align: top; }</style></head><body><h1>${escapeHtml(title)}</h1><p>GlobalLogix · ${shipments.length} expédition(s) · Généré le ${escapeHtml(new Date().toLocaleString("fr-FR"))}</p><table><thead><tr><th>Suivi</th><th>Transport</th><th>Statut</th><th>Itinéraire</th><th>Avancement</th><th>Position</th><th>ETA</th></tr></thead><tbody>${rows || "<tr><td colspan=\"7\">Aucune expédition dans ce filtre.</td></tr>"}</tbody></table></body></html>`;
}
