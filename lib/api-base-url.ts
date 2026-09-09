type BrowserLocation = Pick<Location, "protocol" | "hostname" | "port" | "origin">;

export function resolveApiBaseUrl(configuredBaseUrl: string, location?: BrowserLocation | null) {
  if (location) {
    const { protocol, hostname, port, origin } = location;
    const apiHostname = hostname.replace(/^8081-/, "3000-");
    if (apiHostname !== hostname) return `${protocol}//${apiHostname}`;
    if ((hostname === "localhost" || hostname === "127.0.0.1") && port === "8081") {
      return `${protocol}//${hostname}:3000`;
    }
    return origin.replace(/\/$/, "");
  }
  return configuredBaseUrl.replace(/\/$/, "");
}

export function getApiBaseUrl() {
  const browserLocation = typeof window !== "undefined" && window.location ? window.location : null;
  return resolveApiBaseUrl(process.env.EXPO_PUBLIC_API_BASE_URL ?? "", browserLocation);
}
