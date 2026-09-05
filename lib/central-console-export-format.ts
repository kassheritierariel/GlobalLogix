export type CentralConsoleExportRow = {
  agencyId: string;
  agencyName: string;
  plan: string;
  usage: string;
  usageAlert: string;
  periodUpdates: number;
  activeShipments: number;
  atRisk: number;
  openExceptions: number;
  chariowStatus: string;
  paidTransactions: number;
  pendingTransactions: number;
  failedTransactions: number;
  whatsAppStatus: string;
  whatsAppMessages: number;
  whatsAppFailedMessages: number;
};

function escapeCsv(value: string | number) {
  const raw = String(value).replaceAll('"', '""');
  return /[;"\n]/.test(raw) ? `"${raw}"` : raw;
}

function escapeHtml(value: string | number) {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

export function buildCentralConsoleCsv(rows: CentralConsoleExportRow[]) {
  const header = ["Agence", "Identifiant", "Plan", "Utilisation", "Alerte capacité", "Mises à jour période", "Expéditions actives", "À risque", "Exceptions ouvertes", "Chariow", "Paiements confirmés", "Paiements en attente", "Paiements échoués", "WhatsApp", "Événements WhatsApp", "Échecs WhatsApp"];
  const data = rows.map((row) => [row.agencyName, row.agencyId, row.plan, row.usage, row.usageAlert, row.periodUpdates, row.activeShipments, row.atRisk, row.openExceptions, row.chariowStatus, row.paidTransactions, row.pendingTransactions, row.failedTransactions, row.whatsAppStatus, row.whatsAppMessages, row.whatsAppFailedMessages]);
  return [header, ...data].map((line) => line.map(escapeCsv).join(";")).join("\n");
}

export function buildCentralConsolePdfHtml(rows: CentralConsoleExportRow[], title: string, periodLabel: string) {
  const tableRows = rows.map((row) => `<tr><td>${escapeHtml(row.agencyName)}</td><td>${escapeHtml(row.plan)}</td><td>${escapeHtml(row.usage)}</td><td>${escapeHtml(row.usageAlert)}</td><td>${escapeHtml(row.periodUpdates)}</td><td>${escapeHtml(row.activeShipments)}</td><td>${escapeHtml(row.atRisk)}</td><td>${escapeHtml(row.openExceptions)}</td><td>${escapeHtml(row.chariowStatus)}</td><td>${escapeHtml(row.paidTransactions)}</td><td>${escapeHtml(row.whatsAppStatus)}</td><td>${escapeHtml(row.whatsAppMessages)}</td></tr>`).join("");
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><style>@page{margin:20px;}body{font-family:Arial,sans-serif;color:#062B5C;}h1{font-size:20px;margin:0;}p{color:#65768B;font-size:11px;}table{border-collapse:collapse;width:100%;margin-top:16px;font-size:8px;}th{background:#003F87;color:#FFF;text-align:left;padding:6px;}td{border-bottom:1px solid #D9E2EC;padding:6px;vertical-align:top;}</style></head><body><h1>${escapeHtml(title)}</h1><p>Période : ${escapeHtml(periodLabel)} · ${rows.length} agence(s) · Généré le ${escapeHtml(new Date().toLocaleString("fr-FR"))}</p><table><thead><tr><th>Agence</th><th>Plan</th><th>Utilisation</th><th>Alerte</th><th>MAJ</th><th>Actives</th><th>À risque</th><th>Exceptions</th><th>Chariow</th><th>Payés</th><th>WhatsApp</th><th>Événements</th></tr></thead><tbody>${tableRows || "<tr><td colspan=\"12\">Aucune agence pour cette période.</td></tr>"}</tbody></table></body></html>`;
}
