export const GLOBALLOGIX_PUBLIC_WEB_URL = "https://globallogix-j5jxfyba.manus.space";
export const GLOBALLOGIX_PUBLIC_WEB_HOST = "globallogix-j5jxfyba.manus.space";

type BrowserAuthLocation = Pick<Location, "hostname" | "pathname" | "search" | "hash">;

function isTemporaryPreviewHost(hostname: string) {
  return hostname.endsWith(".manus.computer");
}

/**
 * Les hôtes de prévisualisation changent à chaque environnement et ne doivent pas
 * être ajoutés à la liste Firebase. Google Sign-In repart donc du domaine public stable.
 */
export function resolveCanonicalGoogleAuthUrl(location?: BrowserAuthLocation | null) {
  if (!location) return null;
  const hostname = location.hostname.trim().toLowerCase();
  if (hostname === GLOBALLOGIX_PUBLIC_WEB_HOST || !isTemporaryPreviewHost(hostname)) return null;

  const pathname = location.pathname.startsWith("/") ? location.pathname : `/${location.pathname}`;
  return `${GLOBALLOGIX_PUBLIC_WEB_URL}${pathname}${location.search}${location.hash}`;
}
