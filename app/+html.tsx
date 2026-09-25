import { ScrollViewStyleReset } from "expo-router/html";
import type { PropsWithChildren } from "react";

const serviceWorkerRegistration = `
(() => {
  if (!("serviceWorker" in navigator)) return;
  const hostname = window.location.hostname;
  const isTemporaryPreview = hostname.endsWith(".manus.computer");
  const isLocal = hostname === "localhost" || hostname === "127.0.0.1";
  if (isTemporaryPreview || isLocal || window.location.protocol !== "https:") return;

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => {
      // L’application reste entièrement utilisable en ligne si le navigateur refuse la PWA.
    });
  });
})();
`;

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="fr">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#007FFF" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="GlobalLogix" />
        <meta name="description" content="Plateforme logistique multi-agence pour gérer et suivre les expéditions en temps réel." />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/pwa/apple-touch-icon.png" />
        <ScrollViewStyleReset />
        <script dangerouslySetInnerHTML={{ __html: serviceWorkerRegistration }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
