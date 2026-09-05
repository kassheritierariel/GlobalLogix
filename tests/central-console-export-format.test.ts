import { describe, expect, it } from "vitest";

import { buildCentralConsoleCsv, buildCentralConsolePdfHtml } from "../lib/central-console-export-format";

const row = { agencyId: "ag;01", agencyName: "Kivu;Line", plan: "Operations", usage: "80/100", usageAlert: "Limite proche", periodUpdates: 5, activeShipments: 4, atRisk: 1, openExceptions: 2, chariowStatus: "trial", paidTransactions: 0, pendingTransactions: 0, failedTransactions: 0, whatsAppStatus: "Meta validé", whatsAppMessages: 2, whatsAppFailedMessages: 0 };

describe("exports de la console centralisée", () => {
  it("protège les séparateurs CSV", () => {
    expect(buildCentralConsoleCsv([row])).toContain('"Kivu;Line"');
  });

  it("échappe les valeurs HTML du rapport PDF", () => {
    expect(buildCentralConsolePdfHtml([{ ...row, agencyName: "<Agence>" }], "Rapport", "30 jours")).toContain("&lt;Agence&gt;");
  });
});
