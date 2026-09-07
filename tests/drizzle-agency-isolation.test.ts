import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function migration(name: string) {
  return readFileSync(resolve(process.cwd(), "drizzle", name), "utf8");
}

describe("migrations Drizzle et isolation multi-agence", () => {
  it("porte agencyId dans les données opérationnelles et clientes cloisonnées", () => {
    const logistics = migration("0002_rapid_crystal.sql");
    const customerPortal = migration("0003_typical_thunderbolt.sql");

    expect(logistics.match(/`agencyId` varchar\(128\) NOT NULL/g)?.length).toBeGreaterThanOrEqual(4);
    expect(logistics).toContain("CREATE INDEX `shipments_agency_idx`");
    expect(logistics).toContain("CREATE INDEX `shipments_agency_status_idx`");
    expect(customerPortal).toContain("`agencyId` varchar(128) NOT NULL");
  });

  it("cloisonne les abonnements, transactions et messages par agencyId", () => {
    const subscriptions = migration("0004_large_the_leader.sql");
    const channels = migration("0006_confused_valeria_richards.sql");

    expect(subscriptions.match(/`agencyId` varchar\(128\) NOT NULL/g)?.length).toBeGreaterThanOrEqual(2);
    expect(subscriptions).toContain("CREATE INDEX `saasTransactions_agency_idx`");
    expect(channels).toContain("CONSTRAINT `agencyWhatsAppConfigs_agencyId` PRIMARY KEY(`agencyId`)");
    expect(channels).toContain("CREATE INDEX `agencyWhatsAppMessageLogs_agency_created_idx`");
  });

  it("garde les liens publics uniques et les demandes séparées des tenants actifs", () => {
    const links = migration("0007_numerous_zuras.sql");
    const requests = migration("0008_tiny_carnage.sql");

    expect(links).toContain("agencyProfiles_public_slug_unique");
    expect(requests).toContain("`status` enum('pending','approved','rejected')");
    expect(requests).not.toContain("agencyId");
  });

  it("n’ajoute planId qu’une seule fois aux transactions SaaS", () => {
    const transactions = migration("0005_stale_marrow.sql");
    expect(transactions.match(/ADD `planId`/g)).toHaveLength(1);
    expect(transactions).toContain("ADD `billingCycle`");
  });
});
