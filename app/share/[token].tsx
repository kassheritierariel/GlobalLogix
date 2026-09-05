import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";

type PublicShipment = { trackingNumber: string; origin: string; destination: string; mode: string; status: string; progress: number; distanceRemainingKm: number | null; eta: string | null; currentPosition: string | null; lastTelemetryAt: string | null; confidence: string };
type PublicEvent = { type: string; severity: string; message: string; occurredAt: string };

export default function SharedShipmentScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const [state, setState] = useState<"loading" | "ready" | "invalid">("loading");
  const [shipment, setShipment] = useState<PublicShipment | null>(null);
  const [events, setEvents] = useState<PublicEvent[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const base = process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "";
        const response = await fetch(`${base}/api/public/shipments/${encodeURIComponent(token)}`);
        if (!response.ok) throw new Error("Lien non valide");
        const body = await response.json() as { shipment: PublicShipment; events: PublicEvent[] };
        setShipment(body.shipment);
        setEvents(body.events);
        setState("ready");
      } catch {
        setState("invalid");
      }
    };
    if (token) void load();
  }, [token]);

  if (state === "loading") return <View style={styles.loading}><ActivityIndicator color="#FF6B35" size="large" /></View>;
  if (state === "invalid" || !shipment) return <View style={styles.loading}><MaterialIcons name="link-off" size={42} color="#C43D3D" /><Text style={styles.invalidTitle}>Lien de suivi indisponible</Text><Text style={styles.invalidText}>Ce lien a expiré, a été révoqué ou ne correspond à aucune expédition.</Text></View>;

  return <ScrollView contentContainerStyle={styles.content}><View style={styles.brand}><View style={styles.logo}><Text style={styles.logoText}>G</Text></View><Text style={styles.brandText}>GlobalLogix</Text><Text style={styles.brandSub}>Suivi d’expédition partagé</Text></View><View style={styles.card}><Text style={styles.label}>RÉFÉRENCE D’EXPÉDITION</Text><Text style={styles.tracking}>{shipment.trackingNumber}</Text><View style={styles.route}><Text style={styles.routeText}>{shipment.origin}</Text><MaterialIcons name="arrow-forward" size={18} color="#FF6B35" /><Text style={styles.routeText}>{shipment.destination}</Text></View><View style={styles.track}><View style={[styles.fill, { width: `${shipment.progress}%` }]} /></View><View style={styles.metrics}><View><Text style={styles.metricValue}>{shipment.progress}%</Text><Text style={styles.metricLabel}>progression</Text></View><View style={styles.metricRight}><Text style={styles.metricValue}>{shipment.distanceRemainingKm?.toLocaleString("fr-FR") ?? "—"} km</Text><Text style={styles.metricLabel}>distance restante</Text></View></View><View style={styles.position}><MaterialIcons name="my-location" size={17} color="#FF6B35" /><Text style={styles.positionText}>{shipment.currentPosition ?? "Position en attente"}</Text></View></View><View style={styles.events}><Text style={styles.eventsTitle}>Dernières mises à jour</Text>{events.length ? events.map((event, index) => <View key={`${event.occurredAt}-${index}`} style={styles.event}><View style={[styles.eventDot, event.severity === "critical" && styles.eventCritical]} /><View><Text style={styles.eventText}>{event.message}</Text><Text style={styles.eventMeta}>{new Date(event.occurredAt).toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</Text></View></View>) : <Text style={styles.noEvents}>Aucune mise à jour disponible.</Text>}</View><Text style={styles.footer}>Ce lien est personnel et temporaire. Ne le partagez qu’avec les personnes autorisées.</Text></ScrollView>;
}

const styles = StyleSheet.create({
  loading: { alignItems: "center", backgroundColor: "#E8F0F8", flex: 1, justifyContent: "center", padding: 28 }, invalidTitle: { color: "#0A2540", fontSize: 19, fontWeight: "800", marginTop: 14 }, invalidText: { color: "#607386", fontSize: 14, lineHeight: 21, marginTop: 7, textAlign: "center" }, content: { backgroundColor: "#E8F0F8", flexGrow: 1, padding: 20, paddingTop: 54 }, brand: { alignItems: "center", marginBottom: 24 }, logo: { alignItems: "center", backgroundColor: "#FF6B35", borderRadius: 13, height: 42, justifyContent: "center", width: 42 }, logoText: { color: "#FFFFFF", fontSize: 22, fontWeight: "900" }, brandText: { color: "#0A2540", fontSize: 21, fontWeight: "900", marginTop: 10 }, brandSub: { color: "#718496", fontSize: 12, marginTop: 4 }, card: { backgroundColor: "#FFFFFF", borderRadius: 20, padding: 20 }, label: { color: "#FF6B35", fontSize: 10, fontWeight: "900", letterSpacing: 1 }, tracking: { color: "#0A2540", fontSize: 20, fontWeight: "900", marginTop: 6 }, route: { alignItems: "center", flexDirection: "row", gap: 7, marginTop: 20 }, routeText: { color: "#294258", flex: 1, fontSize: 12, fontWeight: "700" }, track: { backgroundColor: "#E6EDF4", borderRadius: 999, height: 8, marginTop: 20, overflow: "hidden" }, fill: { backgroundColor: "#FF6B35", borderRadius: 999, height: 8 }, metrics: { flexDirection: "row", justifyContent: "space-between", marginTop: 14 }, metricRight: { alignItems: "flex-end" }, metricValue: { color: "#0A2540", fontSize: 19, fontWeight: "900" }, metricLabel: { color: "#718496", fontSize: 10, fontWeight: "700", marginTop: 3 }, position: { alignItems: "center", backgroundColor: "#FFF4EF", borderRadius: 12, flexDirection: "row", marginTop: 20, padding: 12 }, positionText: { color: "#86402A", fontSize: 12, fontWeight: "700", marginLeft: 7 }, events: { backgroundColor: "#FFFFFF", borderRadius: 20, marginTop: 16, padding: 20 }, eventsTitle: { color: "#0A2540", fontSize: 16, fontWeight: "900" }, event: { flexDirection: "row", marginTop: 16 }, eventDot: { backgroundColor: "#235B9D", borderRadius: 5, height: 10, marginRight: 10, marginTop: 3, width: 10 }, eventCritical: { backgroundColor: "#C43D3D" }, eventText: { color: "#294258", fontSize: 12, fontWeight: "700", lineHeight: 18, paddingRight: 18 }, eventMeta: { color: "#718496", fontSize: 10, marginTop: 3 }, noEvents: { color: "#718496", fontSize: 12, marginTop: 12 }, footer: { color: "#718496", fontSize: 11, lineHeight: 17, marginBottom: 24, marginTop: 18, textAlign: "center" },
});
