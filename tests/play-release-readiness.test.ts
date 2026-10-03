import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function sourceFiles(root: string): string[] {
  return readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const path = join(root, entry.name);
    return entry.isDirectory() ? sourceFiles(path) : /\.(ts|tsx)$/.test(entry.name) ? [path] : [];
  });
}

describe("préparation de la commercialisation Google Play", () => {
  it("fournit une politique publique et un parcours de suppression intégré", () => {
    const privacy = readFileSync("app/privacy.tsx", "utf8");
    const deletion = readFileSync("app/account-deletion.tsx", "utf8");
    const server = readFileSync("server/_core/index.ts", "utf8");
    const database = readFileSync("server/db.ts", "utf8");
    expect(privacy).toContain("Politique de confidentialité");
    expect(privacy).toContain("info@telgroups.org");
    expect(deletion).toContain("requestAccountDeletion");
    expect(deletion).toContain("Commencer la suppression");
    expect(server).toContain('app.delete("/api/account"');
    expect(server).toContain("verifyFirebaseAccountPrincipal");
    expect(server.indexOf("anonymizeEndUserAccountData(principal.uid)")).toBeLessThan(server.indexOf("deleteFirebaseUser(principal.uid)"));
    expect(server.indexOf("deleteFirebaseUser(principal.uid)")).toBeLessThan(server.indexOf("completeEndUserAccountDeletion(request.id, principal.uid)"));
    expect(database).toContain("completeEndUserAccountDeletion");
    expect(database).toContain('customerName: "Client supprimé"');
    expect(database).toContain("tx.delete(users)");
    expect(database).toContain("assignedTo: null");
  });

  it("n’affiche aucune expédition de démonstration en production", () => {
    const tracking = readFileSync("lib/tracking-context.tsx", "utf8");
    expect(tracking).toContain('process.env.NODE_ENV === "production" ? [] : DEMO_SHIPMENTS');
    expect(tracking).toContain("Aucune donnée fictive n’est affichée");
  });

  it("évite le chargement de la police MaterialIcons dans les écrans Web", () => {
    const webIcon = readFileSync("components/material-icon.web.tsx", "utf8");
    expect(webIcon).toContain('import type MaterialIcons from "@expo/vector-icons/MaterialIcons"');
    expect(webIcon).not.toMatch(/^import MaterialIcons from/m);
    const directRuntimeImports = [...sourceFiles("app"), ...sourceFiles("components")]
      .filter((path) => !path.endsWith("components/material-icon.tsx"))
      .filter((path) => /^import MaterialIcons from "@expo\/vector-icons\/MaterialIcons";/m.test(readFileSync(path, "utf8")));
    expect(directRuntimeImports).toEqual([]);
  });

  it("persiste les événements WebSocket à partir de la base et du RBAC", () => {
    const realtime = readFileSync("server/realtime.ts", "utf8");
    expect(realtime).not.toContain("knownShipments");
    expect(realtime).toContain("await db.getShipment");
    expect(realtime).toContain("await db.recordShipmentEvent");
    expect(realtime).toContain("await db.getClientShipment");
    expect(realtime).toContain("client.subscriptions.has(event.shipment.id)");
  });

  it("refuse d’activer un abonnement Chariow sur un produit incohérent", () => {
    const database = readFileSync("server/db.ts", "utf8");
    expect(database).toContain('reason: "product_mismatch"');
    expect(database).toContain('reason: "amount_mismatch"');
    expect(database).toContain('reason: "agency_mismatch"');
  });
});
