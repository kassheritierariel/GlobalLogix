import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

function pngDimensions(path: string) {
  const buffer = readFileSync(path);
  expect(buffer.subarray(1, 4).toString()).toBe("PNG");
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

describe("PWA GlobalLogix", () => {
  it("déclare un manifeste installable et ses icônes", () => {
    const manifest = JSON.parse(readFileSync("public/manifest.json", "utf8")) as {
      name: string;
      short_name: string;
      start_url: string;
      scope: string;
      display: string;
      icons: Array<{ src: string; sizes: string; purpose: string }>;
    };

    expect(manifest.name).toBe("GlobalLogix Mobile");
    expect(manifest.short_name).toBe("GlobalLogix");
    expect(manifest.start_url).toBe("/");
    expect(manifest.scope).toBe("/");
    expect(manifest.display).toBe("standalone");
    expect(manifest.icons.some((icon) => icon.sizes === "192x192")).toBe(true);
    expect(manifest.icons.some((icon) => icon.sizes === "512x512" && icon.purpose === "maskable")).toBe(true);

    expect(pngDimensions("public/pwa/icon-192.png")).toEqual({ width: 192, height: 192 });
    expect(pngDimensions("public/pwa/icon-512.png")).toEqual({ width: 512, height: 512 });
    expect(pngDimensions("public/pwa/icon-maskable-512.png")).toEqual({ width: 512, height: 512 });
    expect(pngDimensions("public/pwa/apple-touch-icon.png")).toEqual({ width: 180, height: 180 });
  });

  it("relie le manifeste et enregistre le service worker uniquement sur un hôte stable HTTPS", () => {
    const html = readFileSync("app/+html.tsx", "utf8");
    expect(html).toContain('rel="manifest" href="/manifest.json"');
    expect(html).toContain('rel="apple-touch-icon" href="/pwa/apple-touch-icon.png"');
    expect(html).toContain('navigator.serviceWorker.register("/sw.js"');
    expect(html).toContain('hostname.endsWith(".manus.computer")');
    expect(html).toContain('window.location.protocol !== "https:"');
  });

  it("utilise un cache réseau-d’abord sans intercepter les API", () => {
    const worker = readFileSync("public/sw.js", "utf8");
    expect(worker).toContain('url.pathname.startsWith("/api/")');
    expect(worker).toContain('request.mode === "navigate"');
    expect(worker).toContain("fetch(request)");
    expect(worker).toContain('caches.match("/offline.html")');
    expect(worker).not.toContain("firebase");
    expect(existsSync("public/offline.html")).toBe(true);
  });

  it("empêche le navigateur de figer une ancienne version du worker", () => {
    const server = readFileSync("server/_core/index.ts", "utf8");
    expect(server).toContain('normalizedPath.endsWith("/sw.js")');
    expect(server).toContain('"no-cache, no-store, must-revalidate"');
    expect(server).toContain('normalizedPath.includes("/_expo/static/")');
  });
});
