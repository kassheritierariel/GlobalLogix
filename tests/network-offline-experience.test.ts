import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("expérience réseau et hors ligne", () => {
  it("monte une bannière réseau globale fondée sur la portée Internet réelle", () => {
    const layout = readFileSync("app/_layout.tsx", "utf8");
    const banner = readFileSync("components/network-status-banner.tsx", "utf8");
    const packageJson = JSON.parse(readFileSync("package.json", "utf8")) as { dependencies: Record<string, string> };

    expect(packageJson.dependencies["expo-network"]).toMatch(/^~8\./);
    expect(layout).toContain("<NetworkStatusBanner />");
    expect(banner).toContain("state.isInternetReachable === false");
    expect(banner).toContain("Network.addNetworkStateListener");
    expect(banner).toContain("Network.getNetworkStateAsync()");
    expect(banner).toContain("navigator.onLine === false");
    expect(banner).toContain('window.addEventListener("offline", offlineListener)');
    expect(banner).toContain('fetch(`/api/health?network-event=${Date.now()}`');
    expect(banner).toContain('fetch(`/api/health?network-check=${Date.now()}`');
    expect(banner).toContain("Connexion Internet perdue");
    expect(banner).toContain("Connexion rétablie");
    expect(banner).toContain("Réessayer");
    expect(banner).toContain('accessibilityLiveRegion="assertive"');
    expect(banner).toContain('accessibilityElementsHidden={status === "hidden"}');
    expect(banner).toContain('__DEV__ && Platform.OS === "web"');
    expect(banner).toContain('get("previewOfflineBanner") === "1"');
  });

  it("permet un réessai manuel réel depuis la page hors ligne", () => {
    const offline = readFileSync("public/offline.html", "utf8");
    const worker = readFileSync("public/sw.js", "utf8");

    expect(offline).toContain('<button class="button" id="retry" type="button">Réessayer</button>');
    expect(offline).toContain('fetch(`/api/health?retry=${Date.now()}`');
    expect(offline).toContain('cache: "no-store"');
    expect(offline).toContain('window.addEventListener("online", retryConnection)');
    expect(offline).toContain('window.location.replace("/")');
    expect(worker).toContain('const CACHE_VERSION = "v2"');
  });
});
