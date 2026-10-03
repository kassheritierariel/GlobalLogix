import { existsSync } from "node:fs";
import path from "node:path";

const DYNAMIC_WEB_ROUTES: Array<{ prefix: string; template: string }> = [
  { prefix: "/agency/", template: "agency/[slug].html" },
  { prefix: "/agency-client/", template: "agency-client/[id].html" },
  { prefix: "/client-shipment/", template: "client-shipment/[id].html" },
  { prefix: "/share/", template: "share/[token].html" },
  { prefix: "/shipment/", template: "shipment/[id].html" },
];

function safeRequestPath(requestPath: string) {
  const pathname = decodeURIComponent(requestPath.split("?")[0] || "/");
  if (pathname.includes("\0") || pathname.split("/").includes("..")) return null;
  return pathname;
}

export function resolveExpoWebFile(webRoot: string, requestPath: string): string | null {
  const pathname = safeRequestPath(requestPath);
  if (!pathname || pathname.startsWith("/api/")) return null;

  if (pathname === "/") {
    const rootIndex = path.join(webRoot, "index.html");
    return existsSync(rootIndex) ? rootIndex : null;
  }

  const cleanPath = pathname.replace(/^\/+|\/+$/g, "");
  const staticCandidates = [
    path.join(webRoot, `${cleanPath}.html`),
    path.join(webRoot, cleanPath, "index.html"),
  ];
  const exactMatch = staticCandidates.find((candidate) => existsSync(candidate));
  if (exactMatch) return exactMatch;

  const dynamicRoute = DYNAMIC_WEB_ROUTES.find(({ prefix }) => pathname.startsWith(prefix));
  if (dynamicRoute) {
    const dynamicTemplate = path.join(webRoot, dynamicRoute.template);
    return existsSync(dynamicTemplate) ? dynamicTemplate : null;
  }

  const notFound = path.join(webRoot, "+not-found.html");
  return existsSync(notFound) ? notFound : null;
}
