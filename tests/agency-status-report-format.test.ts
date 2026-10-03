import { describe, expect, it } from "vitest";
import { buildAgencyStatusReportPdfHtml } from "../lib/agency-status-report-format";

describe("rapport PDF des statuts agence", () => {
  it("présente les comptes et exclut les données clients", () => {
    const html = buildAgencyStatusReportPdfHtml({ periodLabel: "30 derniers jours", rows: [{ status: "delivered", label: "Livrés", count: 8, sharePercent: 80 }], generatedAt: new Date("2026-09-05T10:00:00Z") });
    expect(html).toContain("Livrés"); expect(html).toContain("80%"); expect(html).toContain("ni numéro client");
  });
  it("échappe un libellé inattendu", () => {
    expect(buildAgencyStatusReportPdfHtml({ periodLabel: "Test", rows: [{ status: "custom", label: "<script>", count: 1, sharePercent: 100 }] })).not.toContain("<script>");
  });
  it("affiche la marque de l’agence avec une couleur et un logo de stockage sûrs", () => {
    const html = buildAgencyStatusReportPdfHtml({ periodLabel: "30 jours", rows: [], agency: { displayName: "KivuLine Cargo", primaryColor: "#0F766E", logoUrl: "/manus-storage/agencies/kivuline.png" } });
    expect(html).toContain("KivuLine Cargo"); expect(html).toContain("#0F766E"); expect(html).toContain("/manus-storage/agencies/kivuline.png");
  });
  it("écarte un logo hors stockage approuvé", () => {
    const html = buildAgencyStatusReportPdfHtml({ periodLabel: "30 jours", rows: [], agency: { displayName: "Agence", logoUrl: "javascript:alert(1)" } });
    expect(html).not.toContain("javascript:alert");
  });
});
