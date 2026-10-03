/* GlobalLogix PWA: never store HTML navigations or account-specific content. */
const CACHE_PREFIX = "globallogix-pwa";
const CACHE_VERSION = "v4";
const CACHE_NAME = `${CACHE_PREFIX}-${CACHE_VERSION}`;
const PUBLIC_SHELL = [
  "/offline.html",
  "/manifest.json",
  "/pwa/icon-192.png",
  "/pwa/icon-512.png",
  "/pwa/icon-maskable-512.png",
  "/pwa/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(PUBLIC_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then(async (names) => {
      await Promise.all(
        names
          .filter((name) => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME)
          .map((name) => caches.delete(name)),
      );
      await self.clients.claim();
    }),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;

  if (request.mode === "navigate") {
    // The route may show tenant data after login. Never write or read HTML from cache.
    event.respondWith(fetch(request).catch(async () => (
      (await caches.match("/offline.html")) || Response.error()
    )));
    return;
  }

  const isPublicAsset = url.pathname.startsWith("/_expo/static/")
    || url.pathname.startsWith("/pwa/")
    || url.pathname === "/manifest.json"
    || url.pathname === "/offline.html";
  if (!isPublicAsset) return;

  event.respondWith(caches.match(request).then(async (cached) => {
    if (cached) return cached;
    const response = await fetch(request);
    if (response.ok && response.type !== "opaque") {
      await caches.open(CACHE_NAME).then((cache) => cache.put(request, response.clone()));
    }
    return response;
  }));
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});
