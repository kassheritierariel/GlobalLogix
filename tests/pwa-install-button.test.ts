import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { describe, expect, it } from "vitest";

function executeBootstrap() {
  const source = readFileSync("app/+html.tsx", "utf8");
  const script = source.match(/const serviceWorkerRegistration = `([\s\S]*?)`;/)?.[1];
  if (!script) throw new Error("Script PWA non trouvé");
  const listeners = new Map<string, (event?: { preventDefault?: () => void }) => void>();
  const events: string[] = [];
  const win = {
    location: { hostname: "globallogix.example", protocol: "https:" },
    addEventListener: (name: string, callback: (event?: { preventDefault?: () => void }) => void) => listeners.set(name, callback),
    dispatchEvent: (event: { type: string }) => events.push(event.type),
    __globallogixInstallPrompt: null as unknown,
  };
  runInNewContext(script, { window: win, navigator: {}, Event: class { constructor(public type: string) {} } });
  return { win, listeners, events };
}

describe("installation personnalisée GlobalLogix PWA", () => {
  it("capte le prompt natif avant le chargement de React et l’oublie après installation", () => {
    const { win, listeners, events } = executeBootstrap();
    let prevented = false;
    const prompt = { preventDefault: () => { prevented = true; }, prompt: async () => ({ outcome: "accepted" }) };
    listeners.get("beforeinstallprompt")?.(prompt);
    expect(prevented).toBe(true);
    expect(win.__globallogixInstallPrompt).toBe(prompt);
    expect(events).toContain("globallogix:install-available");
    listeners.get("appinstalled")?.();
    expect(win.__globallogixInstallPrompt).toBeNull();
  });

  it("affiche le bouton aux visiteurs et aux comptes connectés, jamais comme promesse native iOS", () => {
    const button = readFileSync("components/pwa-install-button.tsx", "utf8");
    const login = readFileSync("app/login.tsx", "utf8");
    const settings = readFileSync("app/(tabs)/settings.tsx", "utf8");
    expect(button).toContain('Platform.OS !== "web" || installed');
    expect(button).toContain('browser.addEventListener("beforeinstallprompt"');
    expect(button).toContain('browser.addEventListener("appinstalled"');
    expect(button).toContain('prompt.prompt()');
    expect(button).toContain("prompt.userChoice");
    expect(button).toContain("Safari, touchez Partager");
    expect(button).toContain("accessibilityLiveRegion=\"polite\"");
    expect(login).toContain("<PwaInstallButton compact />");
    expect(settings).toContain("<PwaInstallButton />");
  });

  it("distingue visuellement le mode hors ligne et ne confirme la reconnexion qu’après un test API", () => {
    const banner = readFileSync("components/network-status-banner.tsx", "utf8");
    expect(banner).toContain('"MODE HORS LIGNE"');
    expect(banner).toContain("styles.badgeOffline");
    expect(banner).toContain('network-restored=${Date.now()}');
    expect(banner).toContain("if (!response.ok || !mounted) return");
  });
});
