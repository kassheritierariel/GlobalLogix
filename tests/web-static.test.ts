import { mkdirSync, writeFileSync } from "node:fs";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { resolveExpoWebFile } from "../server/web-static";

function createWebRoot() {
  const root = mkdtempSync(path.join(tmpdir(), "globallogix-web-"));
  mkdirSync(path.join(root, "agency"), { recursive: true });
  writeFileSync(path.join(root, "index.html"), "root");
  writeFileSync(path.join(root, "login.html"), "login");
  writeFileSync(path.join(root, "agency", "[slug].html"), "agency");
  writeFileSync(path.join(root, "+not-found.html"), "404");
  return root;
}

describe("résolution des routes Expo Web publiées", () => {
  it("sert la racine et les pages statiques directes", () => {
    const root = createWebRoot();
    expect(resolveExpoWebFile(root, "/")).toBe(path.join(root, "index.html"));
    expect(resolveExpoWebFile(root, "/login")).toBe(path.join(root, "login.html"));
  });

  it("sert le modèle des routes dynamiques d’agence", () => {
    const root = createWebRoot();
    expect(resolveExpoWebFile(root, "/agency/kivuline-cargo")).toBe(path.join(root, "agency", "[slug].html"));
  });

  it("ne remplace jamais une route API par une page Web", () => {
    const root = createWebRoot();
    expect(resolveExpoWebFile(root, "/api/health")).toBeNull();
  });
});
