import { Platform } from "react-native";
import * as FileSystem from "expo-file-system/legacy";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

import type { Shipment } from "@/lib/types";
import { buildShipmentCsv, buildShipmentPdfHtml } from "@/lib/shipment-export-format";

export { buildShipmentCsv, buildShipmentPdfHtml } from "@/lib/shipment-export-format";

export async function exportShipmentsCsv(shipments: Shipment[], title: string) {
  const filename = `globallogix-${new Date().toISOString().slice(0, 10)}.csv`;
  const content = `\uFEFF${buildShipmentCsv(shipments)}`;
  if (Platform.OS === "web") {
    const url = URL.createObjectURL(new Blob([content], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = filename; anchor.click(); URL.revokeObjectURL(url); return;
  }
  const uri = `${FileSystem.cacheDirectory ?? ""}${filename}`;
  await FileSystem.writeAsStringAsync(uri, content, { encoding: FileSystem.EncodingType.UTF8 });
  await Sharing.shareAsync(uri, { mimeType: "text/csv", dialogTitle: title });
}

export async function exportShipmentsPdf(shipments: Shipment[], title: string) {
  const html = buildShipmentPdfHtml(shipments, title);
  if (Platform.OS === "web") {
    const popup = window.open("", "_blank"); if (!popup) throw new Error("Autorisez les fenêtres contextuelles pour exporter le rapport PDF."); popup.document.write(html); popup.document.close(); popup.focus(); popup.print(); return;
  }
  const { uri } = await Print.printToFileAsync({ html, width: 595, height: 842 });
  await Sharing.shareAsync(uri, { mimeType: "application/pdf", dialogTitle: title, UTI: ".pdf" });
}
