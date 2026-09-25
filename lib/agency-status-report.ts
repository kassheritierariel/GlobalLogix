import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";

import { buildAgencyStatusReportPdfHtml, type AgencyStatusReportRow } from "./agency-status-report-format";

export { buildAgencyStatusReportPdfHtml } from "./agency-status-report-format";

export async function exportAgencyStatusReportPdf(periodLabel: string, rows: AgencyStatusReportRow[], agency?: { displayName: string; logoUrl?: string | null; primaryColor?: string | null }) {
  const html = buildAgencyStatusReportPdfHtml({ periodLabel, rows, agency });
  if (Platform.OS === "web") {
    const popup = window.open("", "_blank");
    if (!popup) throw new Error("Autorisez les fenêtres contextuelles pour enregistrer le rapport PDF.");
    popup.document.write(html); popup.document.close(); popup.focus(); popup.print();
    return;
  }
  const { uri } = await Print.printToFileAsync({ html, width: 595, height: 842 });
  if (!(await Sharing.isAvailableAsync())) throw new Error("Le partage de PDF n’est pas disponible sur cet appareil.");
  await Sharing.shareAsync(uri, { mimeType: "application/pdf", dialogTitle: "Rapport PDF des statuts", UTI: ".pdf" });
}
