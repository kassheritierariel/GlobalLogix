import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { describe, expect, it } from "vitest";

type WorkerEvent = {
  request?: { method: string; mode: string; url: string };
  data?: string;
  waitUntil?: (promise: Promise<unknown>) => void;
  respondWith?: (promise: Promise<unknown>) => void;
};

function createWorker(online: boolean) {
  const handlers: Record<string, (event: WorkerEvent) => void> = {};
  const entries = new Map<string, Map<string, unknown>>();
  const fetches: string[] = [];
  const cacheKey = (value: string | { url: string }) => typeof value === "string" ? value : value.url;
  const cacheStorage = {
    async open(name: string) {
      if (!entries.has(name)) entries.set(name, new Map());
      const content = entries.get(name)!;
      return {
        async addAll(paths: string[]) { paths.forEach((path) => content.set(path, { public: true })); },
        async put(request: string | { url: string }, response: unknown) { content.set(cacheKey(request), response); },
      };
    },
    async keys() { return [...entries.keys()]; },
    async delete(name: string) { return entries.delete(name); },
    async match(request: string | { url: string }) {
      for (const content of entries.values()) {
        if (content.has(cacheKey(request))) return content.get(cacheKey(request));
      }
      return undefined;
    },
  };
  runInNewContext(readFileSync("public/sw.js", "utf8"), {
    caches: cacheStorage,
    URL,
    Response: { error: () => ({ error: true }) },
    fetch: async (request: { url: string }) => {
      fetches.push(request.url);
      if (!online) throw new Error("offline");
      return { ok: true, type: "basic", clone: () => ({ copied: true }), url: request.url };
    },
    self: {
      location: { origin: "https://globallogix.example" },
      addEventListener: (kind: string, handler: (event: WorkerEvent) => void) => { handlers[kind] = handler; },
      skipWaiting: () => {},
      clients: { claim: async () => {} },
    },
  });
  async function dispatch(kind: string, request?: WorkerEvent["request"]) {
    let result: Promise<unknown> | undefined;
    handlers[kind]({
      request,
      waitUntil: (promise) => { result = promise; },
      respondWith: (promise) => { result = promise; },
    });
    return result && await result;
  }
  return { entries, fetches, cacheStorage, dispatch };
}

describe("service worker PWA : confidentialité des comptes", () => {
  it("purge le cache v2 qui pouvait contenir des pages privées", async () => {
    const worker = createWorker(true);
    (await worker.cacheStorage.open("globallogix-pwa-v2")).put(
      "https://globallogix.example/shipment/secret",
      { private: true },
    );
    await worker.dispatch("install");
    await worker.dispatch("activate");
    expect([...worker.entries.keys()]).toEqual(["globallogix-pwa-v3"]);
    expect(await worker.cacheStorage.match("https://globallogix.example/shipment/secret")).toBeUndefined();
    expect(worker.entries.get("globallogix-pwa-v3")?.has("/")).toBe(false);
    expect(worker.entries.get("globallogix-pwa-v3")?.has("/login")).toBe(false);
  });

  it("ne conserve jamais les navigations de client, agence ou administrateur", async () => {
    const worker = createWorker(true);
    await worker.dispatch("install");
    for (const route of ["/shipment/123", "/share/token", "/central-console", "/agency/kivuline-demo", "/login"]) {
      const url = `https://globallogix.example${route}`;
      expect(await worker.dispatch("fetch", { method: "GET", mode: "navigate", url })).toMatchObject({ url });
      expect(await worker.cacheStorage.match(url)).toBeUndefined();
    }
    expect(worker.fetches).toHaveLength(5);
  });

  it("n’affiche que la page publique hors ligne si la navigation échoue", async () => {
    const worker = createWorker(false);
    await worker.dispatch("install");
    const url = "https://globallogix.example/client-shipment/private";
    expect(await worker.dispatch("fetch", { method: "GET", mode: "navigate", url }))
      .toMatchObject({ public: true });
    expect(await worker.cacheStorage.match(url)).toBeUndefined();
  });

  it("n’intercepte aucune requête API ni ressource privée", async () => {
    const worker = createWorker(true);
    expect(await worker.dispatch("fetch", { method: "GET", mode: "cors", url: "https://globallogix.example/api/shipments" }))
      .toBeUndefined();
    expect(await worker.dispatch("fetch", { method: "GET", mode: "cors", url: "https://globallogix.example/uploads/photo.jpg" }))
      .toBeUndefined();
    expect(worker.fetches).toHaveLength(0);
  });
});
