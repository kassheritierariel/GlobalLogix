import { describe, expect, it } from "vitest";

import { buildTrackingQrPrintHtml } from "../lib/tracking-share-qr-format";

describe("fiche imprimable du QR de suivi", () => {
  it("intègre le QR sans révéler de lien client en clair", () => {
    const html = buildTrackingQrPrintHtml({ trackingNumber: "GLX<243>", expiresAt: "2026-08-25T10:00:00.000Z", qrDataUri: "data:image/png;base64,ABC" });
    expect(html).toContain("data:image/png;base64,ABC");
    expect(html).toContain("GLX&lt;243&gt;");
    expect(html).toContain("ne révèle pas l’adresse du lien");
  });
});
