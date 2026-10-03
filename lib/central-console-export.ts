import * as FileSystem from "expo-file-system/legacy";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";

import { buildCentralConsoleCsv, buildCentralConsolePdfHtml, type CentralConsoleExportRow } from "@/lib/central-console-export-format";

export { buildCentralConsoleCsv, buildCentralConsolePdfHtml, type CentralConsoleExportRow } from "@/lib/central-console-export-format";

function reportFilename(extension: "csv" | "pdf") {
  return `globallogix-console-${new Date().toISOString().slice(0, 10)}.${extension}`;
}

export async function exportCentralConsoleCsv(rows: CentralConsoleExportRow[], title: string) {
  const content = `\uFEFF${buildCentralConsoleCsv(rows)}`;
  if (Platform.OS === "web") {
    const url = URL.createObjectURL(new Blob([content], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = reportFilename("csv"); anchor.click(); URL.revokeObjectURL(url); return;
  }
  if (!(await Sharing.isAvailableAsync())) throw new Error("Le partage de fichier n’est pas disponible sur cet appareil.");
  const uri = `${FileSystem.cacheDirectory ?? ""}${reportFilename("csv")}`;
  await FileSystem.writeAsStringAsync(uri, content, { encoding: FileSystem.EncodingType.UTF8 });
  await Sharing.shareAsync(uri, { mimeType: "text/csv", dialogTitle: title });
}

export async function exportCentralConsolePdf(rows: CentralConsoleExportRow[], title: string, periodLabel: string) {
  const html = buildCentralConsolePdfHtml(rows, title, periodLabel);
  if (Platform.OS === "web") {
    const popup = window.open("", "_blank");
    if (!popup) throw new Error("Autorisez les fenêtres contextuelles pour exporter le rapport PDF.");
    popup.document.write(html); popup.document.close(); popup.focus(); popup.print(); return;
  }
  if (!(await Sharing.isAvailableAsync())) throw new Error("Le partage de fichier n’est pas disponible sur cet appareil.");
  const { uri } = await Print.printToFileAsync({ html, width: 842, height: 595 });
  await Sharing.shareAsync(uri, { mimeType: "application/pdf", dialogTitle: title, UTI: ".pdf" });
}
