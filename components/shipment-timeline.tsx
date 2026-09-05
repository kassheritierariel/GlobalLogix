import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { fetchShipmentTimeline, hasLogisticsApi, type ShipmentTimelineEvent } from "@/lib/logistics-api";

export function ShipmentTimeline({ shipmentId }: { shipmentId: string }) {
  const [events, setEvents] = useState<ShipmentTimelineEvent[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "unavailable">("loading");

  useEffect(() => {
    const load = async () => {
      if (!hasLogisticsApi()) {
        setState("unavailable");
        return;
      }
      setState("loading");
      try {
        setEvents(await fetchShipmentTimeline(shipmentId));
        setState("ready");
      } catch {
        setState("unavailable");
      }
    };
    void load();
  }, [shipmentId]);

  return (
    <View style={styles.container}>
      <View style={styles.header}><Text style={styles.title}>Journal d’événements</Text><Text style={styles.caption}>Source & traçabilité</Text></View>
      {state === "loading" ? <ActivityIndicator color="#FF6B35" style={styles.loader} /> : null}
      {state === "unavailable" ? <Text style={styles.empty}>Le journal réel apparaîtra dès que l’API logistique sera accessible.</Text> : null}
      {state === "ready" && events.length === 0 ? <Text style={styles.empty}>Aucun événement enregistré pour cette expédition.</Text> : null}
      {events.slice(0, 5).map((event) => <View key={event.id} style={styles.eventRow}><View style={[styles.eventIcon, event.severity === "critical" && styles.eventCritical, event.severity === "warning" && styles.eventWarning]}><MaterialIcons name={event.type === "customs_hold" ? "gavel" : event.type === "delay_detected" ? "warning-amber" : "my-location"} size={16} color="#FFFFFF" /></View><View style={styles.eventBody}><Text style={styles.eventMessage}>{event.message}</Text><Text style={styles.eventMeta}>{event.source} · {new Date(event.occurredAt).toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</Text></View></View>)}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: "#FFFFFF", borderColor: "#D9E2EC", borderRadius: 18, borderWidth: 1, marginTop: 18, padding: 16 }, header: { alignItems: "baseline", flexDirection: "row", justifyContent: "space-between" }, title: { color: "#0A2540", fontSize: 16, fontWeight: "800" }, caption: { color: "#718496", fontSize: 10, fontWeight: "700" }, loader: { marginVertical: 20 }, empty: { color: "#718496", fontSize: 12, lineHeight: 18, marginTop: 14 }, eventRow: { flexDirection: "row", marginTop: 16 }, eventIcon: { alignItems: "center", backgroundColor: "#235B9D", borderRadius: 12, height: 24, justifyContent: "center", marginRight: 10, width: 24 }, eventWarning: { backgroundColor: "#C5851D" }, eventCritical: { backgroundColor: "#C43D3D" }, eventBody: { flex: 1 }, eventMessage: { color: "#213547", fontSize: 12, fontWeight: "700", lineHeight: 18 }, eventMeta: { color: "#718496", fontSize: 10, marginTop: 3 },
});
