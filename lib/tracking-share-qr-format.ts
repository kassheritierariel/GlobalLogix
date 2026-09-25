type QrPrintDocument = {
  trackingNumber: string;
  expiresAt: string;
  qrDataUri: string;
};

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character] ?? character);

/** Crée une fiche imprimable sans y afficher le jeton du lien sécurisé. */
export function buildTrackingQrPrintHtml({ trackingNumber, expiresAt, qrDataUri }: QrPrintDocument) {
  const qrImage = qrDataUri.startsWith("data:image/png;base64,") ? qrDataUri : "";
  return `<!DOCTYPE html><html><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><style>@page{margin:20mm}body{font-family:Arial,sans-serif;color:#062B5C;text-align:center}.mark{height:7px;background:linear-gradient(90deg,#007FFF 0 55%,#F7D116 55% 78%,#CE1126 78%)}h1{font-size:25px;margin:24px 0 6px}p{color:#5B6D84;font-size:14px;line-height:1.5}.qr{border:1px solid #B9D9F7;border-radius:16px;margin:24px auto 14px;padding:18px;width:230px}.qr img{display:block;width:220px;height:220px;margin:auto}.note{font-size:12px;color:#936200}.footer{font-size:11px;color:#718496;margin-top:30px}</style></head><body><div class="mark"></div><h1>Suivi GlobalLogix</h1><p>Scannez ce QR code pour suivre le colis <strong>${escapeHtml(trackingNumber)}</strong>.</p><div class="qr">${qrImage ? `<img src="${qrImage}" alt="QR code de suivi" />` : "<p>QR code indisponible.</p>"}</div><p class="note">Lien sécurisé valable jusqu’au ${escapeHtml(new Date(expiresAt).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" }))}.</p><p class="footer">GlobalLogix · Ce document ne révèle pas l’adresse du lien ni son jeton.</p></body></html>`;
}
