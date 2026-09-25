export type AgencyStatusReportRow = { status: string; label: string; count: number; sharePercent: number };

function escapeHtml(value: string | number) {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

function safeLogoUrl(value: string | null | undefined) {
  if (!value) return null;
  return value.startsWith("/manus-storage/") || value.startsWith("https://") ? value : null;
}

export function buildAgencyStatusReportPdfHtml(input: { periodLabel: string; rows: AgencyStatusReportRow[]; generatedAt?: Date; agency?: { displayName: string; logoUrl?: string | null; primaryColor?: string | null } }) {
  const total = input.rows.reduce((sum, row) => sum + row.count, 0);
  const generatedAt = input.generatedAt ?? new Date();
  const rows = input.rows.map((row) => `<tr><td>${escapeHtml(row.label)}</td><td>${escapeHtml(row.count)}</td><td>${escapeHtml(`${row.sharePercent}%`)}</td></tr>`).join("");
  const displayName = input.agency?.displayName || "GlobalLogix";
  const primaryColor = /^#[0-9A-Fa-f]{6}$/.test(input.agency?.primaryColor ?? "") ? input.agency!.primaryColor! : "#003F87";
  const logoUrl = safeLogoUrl(input.agency?.logoUrl);
  const logo = logoUrl ? `<img class="logo" src="${escapeHtml(logoUrl)}" alt="Logo ${escapeHtml(displayName)}"/>` : `<div class="monogram">${escapeHtml(displayName.slice(0, 1).toUpperCase())}</div>`;
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><style>@page{margin:26px}body{font-family:Arial,sans-serif;color:#062B5C}.brand{align-items:center;border-bottom:3px solid ${primaryColor};display:flex;gap:12px;padding-bottom:12px}.logo,.monogram{border-radius:8px;height:42px;object-fit:contain;width:42px}.monogram{align-items:center;background:${primaryColor};color:#fff;display:flex;font-size:20px;font-weight:700;justify-content:center}h1{font-size:21px;margin:0}.agency{color:${primaryColor};font-size:10px;font-weight:700;letter-spacing:.7px;margin:4px 0 0}p{color:#65768B;font-size:11px;line-height:1.5}.summary{background:#EAF4FD;border-left:4px solid ${primaryColor};margin-top:16px;padding:12px}table{border-collapse:collapse;font-size:11px;margin-top:18px;width:100%}th{background:${primaryColor};color:#fff;padding:8px;text-align:left}td{border-bottom:1px solid #D9E2EC;padding:8px}.foot{font-size:9px;margin-top:18px}</style></head><body><header class="brand">${logo}<div><h1>Répartition des statuts</h1><div class="agency">${escapeHtml(displayName)} · réseau GlobalLogix</div></div></header><p>Période analysée : ${escapeHtml(input.periodLabel)}<br/>Généré le ${escapeHtml(generatedAt.toLocaleString("fr-FR"))}</p><div class="summary"><strong>${escapeHtml(total)}</strong> colis comptabilisés sur la période. Ce rapport ne contient ni numéro client, ni adresse, ni identifiant Meta.</div><table><thead><tr><th>Statut</th><th>Colis</th><th>Répartition</th></tr></thead><tbody>${rows || "<tr><td colspan=\"3\">Aucun colis sur cette période.</td></tr>"}</tbody></table><p class="foot">Rapport analytique réservé à l’agence ${escapeHtml(displayName)}.</p></body></html>`;
}
