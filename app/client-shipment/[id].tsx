import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { fetchClientShipmentDetail } from "@/lib/client-portal-api";
import type { DetailedTransitEvent } from "@/lib/shipment-detail";
import type { Shipment } from "@/lib/types";

const modeIcon: Record<Shipment["mode"], "flight" | "directions-boat" | "local-shipping"> = { air: "flight", sea: "directions-boat", land: "local-shipping" };

export default function ClientShipmentScreen() {
  const { id, agency } = useLocalSearchParams<{ id: string; agency?: string }>();
  const agencySlug = typeof agency === "string" ? agency : undefined;
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [events, setEvents] = useState<DetailedTransitEvent[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    void fetchClientShipmentDetail(id, agencySlug).then((result) => {
      setShipment(result.shipment);
      setEvents(result.events);
    }).catch((caughtError) => setError(caughtError instanceof Error ? caughtError.message : "Chargement impossible."));
  }, [id, agencySlug]);

  if (!shipment && !error) return <ScreenContainer className="bg-background"><View style={styles.center}><ActivityIndicator color="#007FFF" /><Text style={styles.loading}>Chargement de votre colis…</Text></View></ScreenContainer>;
  if (!shipment) return <ScreenContainer className="bg-background"><View style={styles.center}><MaterialIcons name="lock-outline" size={36} color="#CE1126" /><Text style={styles.errorTitle}>Colis indisponible</Text><Text style={styles.errorCopy}>{error}</Text><Pressable onPress={() => router.back()} style={styles.backButton}><Text style={styles.backLabel}>Retour à mes colis</Text></Pressable></View></ScreenContainer>;

  return <ScreenContainer className="bg-background"><FlatList data={events} keyExtractor={(item) => item.id} contentContainerStyle={styles.content} ListHeaderComponent={<View><Pressable onPress={() => router.back()} style={({ pressed }) => [styles.back, pressed && styles.pressed]}><MaterialIcons name="arrow-back" size={19} color="#062B5C" /><Text style={styles.backText}>Mes expéditions</Text></Pressable><View style={styles.head}><View style={styles.icon}><MaterialIcons name={modeIcon[shipment.mode]} size={26} color="#007FFF" /></View><View style={styles.titleCopy}><Text style={styles.eyebrow}>SUIVI CLIENT</Text><Text style={styles.title}>{shipment.trackingNumber}</Text><Text style={styles.route}>{shipment.origin} → {shipment.destination}</Text></View></View><View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${Math.max(0, Math.min(100, shipment.progress))}%` }]} /></View><View style={styles.metrics}><View><Text style={styles.metricValue}>{shipment.progress}%</Text><Text style={styles.metricLabel}>progression</Text></View><View><Text style={styles.metricValue}>{shipment.eta}</Text><Text style={styles.metricLabel}>ETA</Text></View><View><Text style={styles.metricValue}>{shipment.distanceRemainingKm.toLocaleString("fr-FR")} km</Text><Text style={styles.metricLabel}>restants</Text></View></View><View style={styles.location}><Text style={styles.locationLabel}>DERNIÈRE POSITION</Text><Text style={styles.locationValue}>{shipment.currentPosition}</Text><Text style={styles.locationMeta}>Mise à jour {shipment.lastTelemetryAt}</Text></View><Text style={styles.section}>HISTORIQUE DE TRANSIT</Text></View>} ListEmptyComponent={<View style={styles.empty}><MaterialIcons name="timeline" size={28} color="#007FFF" /><Text style={styles.emptyTitle}>Aucun jalon disponible</Text><Text style={styles.emptyCopy}>Les mises à jour validées par GlobalLogix apparaîtront ici.</Text></View>} renderItem={({ item }) => <View style={styles.event}><View style={styles.dot}><MaterialIcons name={item.type === "location_update" ? "my-location" : "info-outline"} size={14} color="#FFFFFF" /></View><View style={styles.eventCopy}><Text style={styles.eventSource}>{item.source}</Text><Text style={styles.eventMessage}>{item.message}</Text><Text style={styles.eventDate}>{new Date(item.occurredAt).toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</Text></View></View>} /></ScreenContainer>;
}

const styles = StyleSheet.create({
  content: { padding: 18, paddingBottom: 30 },
  center: { alignItems: "center", flex: 1, justifyContent: "center", padding: 24 },
  loading: { color: "#5B6D84", fontSize: 13, marginTop: 10 },
  errorTitle: { color: "#062B5C", fontSize: 20, fontWeight: "800", marginTop: 10 },
  errorCopy: { color: "#5B6D84", fontSize: 13, lineHeight: 19, marginTop: 6, textAlign: "center" },
  backButton: { backgroundColor: "#F7D116", borderRadius: 12, marginTop: 16, paddingHorizontal: 16, paddingVertical: 12 },
  backLabel: { color: "#062B5C", fontSize: 13, fontWeight: "800" },
  back: { alignItems: "center", flexDirection: "row", marginBottom: 18 },
  backText: { color: "#062B5C", fontSize: 13, fontWeight: "800", marginLeft: 5 },
  head: { alignItems: "center", flexDirection: "row" },
  icon: { alignItems: "center", backgroundColor: "#E7F3FF", borderRadius: 16, height: 56, justifyContent: "center", marginRight: 12, width: 56 },
  titleCopy: { flex: 1 },
  eyebrow: { color: "#CE1126", fontSize: 10, fontWeight: "800", letterSpacing: 0.8 },
  title: { color: "#062B5C", fontSize: 22, fontWeight: "800", marginTop: 3 },
  route: { color: "#5B6D84", fontSize: 11, marginTop: 4 },
  progressTrack: { backgroundColor: "#D8EAFB", borderRadius: 99, height: 10, marginTop: 23 },
  progressFill: { backgroundColor: "#F7D116", borderRadius: 99, height: 10 },
  metrics: { flexDirection: "row", justifyContent: "space-between", marginTop: 16 },
  metricValue: { color: "#062B5C", fontSize: 14, fontWeight: "800" },
  metricLabel: { color: "#5B6D84", fontSize: 9, marginTop: 3 },
  location: { backgroundColor: "#FFFFFF", borderColor: "#D7E4F0", borderRadius: 15, borderWidth: 1, marginTop: 18, padding: 14 },
  locationLabel: { color: "#007FFF", fontSize: 10, fontWeight: "800", letterSpacing: 0.7 },
  locationValue: { color: "#062B5C", fontSize: 15, fontWeight: "800", marginTop: 5 },
  locationMeta: { color: "#5B6D84", fontSize: 10, marginTop: 5 },
  section: { color: "#5B6D84", fontSize: 10, fontWeight: "800", letterSpacing: 0.8, marginBottom: 8, marginTop: 22 },
  empty: { alignItems: "center", backgroundColor: "#FFFFFF", borderColor: "#D7E4F0", borderRadius: 15, borderWidth: 1, padding: 24 },
  emptyTitle: { color: "#062B5C", fontSize: 14, fontWeight: "800", marginTop: 7 },
  emptyCopy: { color: "#5B6D84", fontSize: 11, lineHeight: 16, marginTop: 4, textAlign: "center" },
  event: { flexDirection: "row", marginBottom: 14 },
  dot: { alignItems: "center", backgroundColor: "#007FFF", borderRadius: 14, height: 28, justifyContent: "center", marginRight: 10, width: 28 },
  eventCopy: { backgroundColor: "#FFFFFF", borderColor: "#D7E4F0", borderRadius: 12, borderWidth: 1, flex: 1, padding: 10 },
  eventSource: { color: "#007FFF", fontSize: 10, fontWeight: "800" },
  eventMessage: { color: "#062B5C", fontSize: 12, fontWeight: "600", lineHeight: 17, marginTop: 3 },
  eventDate: { color: "#5B6D84", fontSize: 9, marginTop: 5 },
  pressed: { opacity: 0.82 },
});
