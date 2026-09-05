import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useMemo, useState } from "react";
import { FlatList, Pressable, Share, StyleSheet, Text, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { StatusBadge } from "@/components/status-badge";
import { ShipmentTimeline } from "@/components/shipment-timeline";
import { MultimodalLocationCard } from "@/components/multimodal-location-card";
import { haptic } from "@/lib/haptics";
import { createShareLink, getPublicTrackingUrl, hasLogisticsApi } from "@/lib/logistics-api";
import { useTracking } from "@/lib/tracking-context";

export default function TrackingScreen() {
  const { shipments, selectedShipmentId, selectShipment, connectionState, reconnect, resetLive, lastEventAt } = useTracking();
  const selected = useMemo(() => shipments.find((shipment) => shipment.id === selectedShipmentId) ?? shipments[0], [shipments, selectedShipmentId]);
  const [shareMessage, setShareMessage] = useState("");

  if (!selected) {
    return <ScreenContainer className="bg-background"><View style={styles.emptyState}><View style={styles.emptyStateIcon}><MaterialIcons name="radar" size={30} color="#235B9D" /></View><Text style={styles.emptyStateTitle}>Suivi prêt à démarrer</Text><Text style={styles.emptyStateBody}>Aucune expédition n’est encore disponible dans votre périmètre. Les positions et jalons apparaîtront ici dès la première synchronisation.</Text></View></ScreenContainer>;
  }

  const toggle = () => { haptic.medium(); reconnect(); };
  const reset = () => { haptic.success(); resetLive(); };
  const shareTracking = async () => {
    try {
      if (!hasLogisticsApi()) throw new Error("Configurez l’API logistique avant de partager un suivi client.");
      const { token, expiresAt } = await createShareLink(selected.id);
      const url = getPublicTrackingUrl(token);
      await Share.share({ title: "Suivi GlobalLogix", message: `Suivez l’expédition ${selected.trackingNumber} : ${url}` });
      setShareMessage(`Lien client actif jusqu’au ${new Date(expiresAt).toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}.`);
      haptic.success();
    } catch (error) {
      setShareMessage(error instanceof Error ? error.message : "Partage indisponible.");
      haptic.error();
    }
  };

  return (
    <ScreenContainer className="bg-background">
      <FlatList
        data={shipments}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={<View style={styles.main}><View style={styles.topLine}><View><Text style={styles.eyebrow}>TÉLÉMÉTRIE D’EXPÉDITION</Text><Text style={styles.title}>Suivi en direct</Text></View><View style={[styles.channelBadge, connectionState !== "connected" && styles.channelPaused]}><View style={[styles.channelDot, connectionState !== "connected" && styles.channelDotPaused]} /><Text style={[styles.channelText, connectionState !== "connected" && styles.channelTextPaused]}>{connectionState === "connected" ? "Canal actif" : "Reconnexion"}</Text></View></View><Text style={styles.subtitle}>Le canal WebSocket authentifié reçoit les événements envoyés par le serveur GlobalLogix.</Text><View style={styles.telemetryRow}><View style={styles.telemetryItem}><Text style={styles.telemetryLabel}>Dernier événement</Text><Text style={styles.telemetryValue}>{lastEventAt}</Text></View><View style={styles.telemetryDivider} /><View style={styles.telemetryItem}><Text style={styles.telemetryLabel}>Canal</Text><Text style={styles.telemetryValue}>{connectionState}</Text></View></View><View style={styles.detailCard}><View style={styles.detailTop}><View><Text style={styles.trackingNumber}>{selected.trackingNumber}</Text><Text style={styles.currentPosition}>{selected.currentPosition}</Text></View><StatusBadge status={selected.status} /></View><View style={styles.routeVisual}><View style={styles.routePoint}><View style={styles.originDot} /><Text style={styles.routeLabel}>{selected.origin}</Text></View><View style={styles.routeLine}><View style={[styles.routeLineActive, { width: `${selected.progress}%` }]} /><View style={[styles.vehicleMarker, { left: `${selected.progress}%` }]}><MaterialIcons name={selected.mode === "air" ? "flight" : selected.mode === "sea" ? "directions-boat" : "local-shipping"} size={15} color="#FFFFFF" /></View></View><View style={styles.routePointEnd}><View style={styles.destinationDot} /><Text style={styles.routeLabelEnd}>{selected.destination}</Text></View></View><View style={styles.progressMeta}><View><Text style={styles.progressValue}>{selected.progress}%</Text><Text style={styles.progressLabel}>progression</Text></View><View style={styles.metricRight}><Text style={styles.metricValue}>{selected.distanceRemainingKm.toLocaleString("fr-FR")} km</Text><Text style={styles.progressLabel}>distance restante</Text></View></View><View style={styles.etaCard}><MaterialIcons name="schedule" size={18} color="#FF6B35" /><Text style={styles.etaText}>Arrivée estimée · {selected.eta}</Text></View></View><MultimodalLocationCard shipment={selected} /><View style={styles.controls}><Pressable onPress={toggle} style={({ pressed }) => [styles.primaryControl, pressed && styles.pressed]}><MaterialIcons name="sync" size={21} color="#FFFFFF" /><Text style={styles.primaryControlText}>Reconnecter</Text></Pressable><Pressable onPress={reset} style={({ pressed }) => [styles.secondaryControl, pressed && styles.pressed]}><MaterialIcons name="restart-alt" size={20} color="#0A2540" /><Text style={styles.secondaryControlText}>Réinitialiser</Text></Pressable></View><Pressable onPress={() => void shareTracking()} style={({ pressed }) => [styles.shareButton, pressed && styles.pressed]}><MaterialIcons name="share" size={20} color="#0A2540" /><Text style={styles.shareText}>Créer un lien client sécurisé</Text></Pressable>{shareMessage ? <Text style={styles.shareMessage}>{shareMessage}</Text> : null}<ShipmentTimeline shipmentId={selected.id} /><Text style={styles.selectorTitle}>Changer d’expédition</Text></View>}
        renderItem={({ item }) => <Pressable onPress={() => { haptic.selection(); selectShipment(item.id); }} style={({ pressed }) => [styles.selector, item.id === selectedShipmentId && styles.selectorActive, pressed && styles.selectorPressed]}><View><Text style={[styles.selectorId, item.id === selectedShipmentId && styles.selectorIdActive]}>{item.id}</Text><Text numberOfLines={1} style={[styles.selectorRoute, item.id === selectedShipmentId && styles.selectorRouteActive]}>{item.origin} → {item.destination}</Text></View><MaterialIcons name="chevron-right" size={20} color={item.id === selectedShipmentId ? "#FFFFFF" : "#718496"} /></Pressable>}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 24 }, main: { width: "100%" }, topLine: { alignItems: "flex-start", flexDirection: "row", justifyContent: "space-between" }, eyebrow: { color: "#FF6B35", fontSize: 11, fontWeight: "800", letterSpacing: 1 }, title: { color: "#0A2540", fontSize: 28, fontWeight: "800", marginTop: 5 }, subtitle: { color: "#607386", fontSize: 14, lineHeight: 20, marginTop: 9 },
  channelBadge: { alignItems: "center", backgroundColor: "#E7F5EC", borderRadius: 999, flexDirection: "row", paddingHorizontal: 10, paddingVertical: 7 }, channelPaused: { backgroundColor: "#FFF2D9" }, channelDot: { backgroundColor: "#14804A", borderRadius: 5, height: 8, marginRight: 6, width: 8 }, channelDotPaused: { backgroundColor: "#C5851D" }, channelText: { color: "#147A46", fontSize: 11, fontWeight: "800" }, channelTextPaused: { color: "#936200" },
  telemetryRow: { alignItems: "center", backgroundColor: "#FFFFFF", borderColor: "#D9E2EC", borderRadius: 16, borderWidth: 1, flexDirection: "row", marginTop: 18, padding: 14 }, telemetryItem: { flex: 1 }, telemetryDivider: { backgroundColor: "#D9E2EC", height: 28, width: 1 }, telemetryLabel: { color: "#718496", fontSize: 11, fontWeight: "700" }, telemetryValue: { color: "#0A2540", fontFamily: "monospace", fontSize: 12, fontWeight: "700", marginTop: 5 },
  detailCard: { backgroundColor: "#FFFFFF", borderColor: "#D9E2EC", borderRadius: 20, borderWidth: 1, marginTop: 14, padding: 18 }, detailTop: { alignItems: "flex-start", flexDirection: "row", justifyContent: "space-between" }, trackingNumber: { color: "#0A2540", fontSize: 17, fontWeight: "800" }, currentPosition: { color: "#607386", fontSize: 12, marginTop: 5, maxWidth: 210 },
  routeVisual: { alignItems: "center", flexDirection: "row", marginTop: 26 }, routePoint: { alignItems: "flex-start", width: 72 }, routePointEnd: { alignItems: "flex-end", width: 72 }, originDot: { backgroundColor: "#0A2540", borderRadius: 6, height: 12, width: 12 }, destinationDot: { backgroundColor: "#FF6B35", borderRadius: 6, height: 12, width: 12 }, routeLabel: { color: "#0A2540", fontSize: 10, fontWeight: "700", marginTop: 7 }, routeLabelEnd: { color: "#0A2540", fontSize: 10, fontWeight: "700", marginTop: 7, textAlign: "right" }, routeLine: { backgroundColor: "#D9E2EC", flex: 1, height: 5, position: "relative" }, routeLineActive: { backgroundColor: "#FF6B35", height: 5 }, vehicleMarker: { alignItems: "center", backgroundColor: "#0A2540", borderColor: "#FFFFFF", borderRadius: 14, borderWidth: 2, height: 28, justifyContent: "center", marginLeft: -14, marginTop: -12, position: "absolute", top: 0, width: 28 },
  progressMeta: { flexDirection: "row", justifyContent: "space-between", marginTop: 24 }, progressValue: { color: "#0A2540", fontSize: 30, fontWeight: "800" }, progressLabel: { color: "#718496", fontSize: 11, fontWeight: "700", marginTop: 3 }, metricRight: { alignItems: "flex-end" }, metricValue: { color: "#0A2540", fontSize: 17, fontWeight: "800", marginTop: 6 }, etaCard: { alignItems: "center", backgroundColor: "#FFF4EF", borderRadius: 12, flexDirection: "row", marginTop: 20, padding: 12 }, etaText: { color: "#86402A", fontSize: 12, fontWeight: "700", marginLeft: 8 },
  controls: { flexDirection: "row", gap: 10, marginTop: 16 }, primaryControl: { alignItems: "center", backgroundColor: "#FF6B35", borderRadius: 14, flex: 1, flexDirection: "row", height: 50, justifyContent: "center" }, primaryControlText: { color: "#FFFFFF", fontSize: 14, fontWeight: "800", marginLeft: 7 }, secondaryControl: { alignItems: "center", backgroundColor: "#FFFFFF", borderColor: "#D9E2EC", borderRadius: 14, borderWidth: 1, flex: 1, flexDirection: "row", height: 50, justifyContent: "center" }, secondaryControlText: { color: "#0A2540", fontSize: 14, fontWeight: "800", marginLeft: 6 }, shareButton: { alignItems: "center", backgroundColor: "#E8F0F8", borderRadius: 14, flexDirection: "row", height: 48, justifyContent: "center", marginTop: 10 }, shareText: { color: "#0A2540", fontSize: 13, fontWeight: "800", marginLeft: 7 }, shareMessage: { color: "#607386", fontSize: 11, lineHeight: 16, marginTop: 8, textAlign: "center" }, selectorTitle: { color: "#0A2540", fontSize: 16, fontWeight: "800", marginTop: 24 },
  selector: { alignItems: "center", backgroundColor: "#FFFFFF", borderColor: "#D9E2EC", borderRadius: 14, borderWidth: 1, flexDirection: "row", justifyContent: "space-between", marginTop: 10, padding: 13 }, selectorActive: { backgroundColor: "#0A2540", borderColor: "#0A2540" }, selectorId: { color: "#0A2540", fontSize: 12, fontWeight: "800" }, selectorIdActive: { color: "#FFFFFF" }, selectorRoute: { color: "#718496", fontSize: 10, marginTop: 5 }, selectorRouteActive: { color: "#B8C9DA" }, emptyState: { alignItems: "center", flex: 1, justifyContent: "center", paddingHorizontal: 34 }, emptyStateIcon: { alignItems: "center", backgroundColor: "#E8F0F8", borderRadius: 26, height: 52, justifyContent: "center", width: 52 }, emptyStateTitle: { color: "#0A2540", fontSize: 18, fontWeight: "800", marginTop: 15 }, emptyStateBody: { color: "#718496", fontSize: 13, lineHeight: 20, marginTop: 8, textAlign: "center" }, pressed: { opacity: 0.86, transform: [{ scale: 0.98 }] }, selectorPressed: { opacity: 0.7 },
});
