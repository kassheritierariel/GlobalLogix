export type GoogleMapsFallbackReason = "missing" | "invalid" | "unavailable";

/**
 * Ne prétend jamais qu'une carte est active : ce texte sert de repli lorsque
 * la clé n'est pas configurée ou que la plateforme Google la refuse.
 */
export function getGoogleMapsFallbackCopy(reason: GoogleMapsFallbackReason = "unavailable") {
  if (reason === "missing") {
    return "La carte interactive nécessite une clé Google Maps configurée. Les jalons de transit et les coordonnées disponibles restent consultables.";
  }
  if (reason === "invalid") {
    return "La clé Google Maps est refusée ou ses services ne sont pas activés. Les jalons de transit et les coordonnées disponibles restent consultables.";
  }
  return "La carte interactive est actuellement indisponible. Vérifiez la clé Google Maps, la facturation et les services Maps requis. Les jalons de transit restent consultables.";
}
