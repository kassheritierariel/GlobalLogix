import { useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { ScreenContainer } from "@/components/screen-container";
import { StatusBadge } from "@/components/status-badge";
import { haptic } from "@/lib/haptics";
import { useTracking } from "@/lib/tracking-context";
import type { Shipment, ShipmentStatus } from "@/lib/types";

type Filter = "all" | ShipmentStatus;

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "Toutes" }, { key: "in-transit", label: "Transit" }, { key: "customs", label: "Douane" }, { key: "delayed", label: "Retard" }, { key: "delivered", label: "Livrées" },
];

function operationalRank(shipment: Shipment) {
  if (shipment.status === "delayed") return 0;
  if (shipment.status === "customs") return 1;
  if (shipment.status === "in-transit") return 2;
  return 3;
}

function modeLabel(mode: Shipment["mode"]) {
  if (mode === "air") return "Transport aérien";
  if (mode === "sea") return "Transport maritime";
  return "Transport terrestre";
}

export default function ShipmentsScreen() {
  const { shipments, selectShipment } = useTracking();
  const [filter, setFilter] = useState<Filter>("all");
  const filtered = useMemo(() => shipments.filter((shipment) => filter === "all" || shipment.status === filter).sort((left, right) => operationalRank(left) - operationalRank(right) || left.progress - right.progress), [filter, shipments]);
  const atRisk = shipments.filter((shipment) => shipment.status === "delayed" || shipment.status === "customs").length;
  const inTransit = shipments.filter((shipment) => shipment.status === "in-transit").length;

  const openShipment = (shipment: Shipment) => {
    haptic.light();
    selectShipment(shipment.id);
    router.push(`/shipment/${shipment.id}` as never);
  };

  return (
    <ScreenContainer className="bg-background">
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        ListHeaderComponent={<View><Text style={styles.eyebrow}>PORTEFEUILLE LOGISTIQUE</Text><Text style={styles.title}>Expéditions</Text><Text style={styles.subtitle}>Suivez le portefeuille par priorité opérationnelle, statut et échéance estimée.</Text><View style={styles.overview}><View style={styles.overviewItem}><MaterialIcons name="local-shipping" size={18} color="#235B9D" /><View><Text style={styles.overviewValue}>{inTransit}</Text><Text style={styles.overviewLabel}>en transit</Text></View></View><View style={[styles.overviewItem, atRisk > 0 && styles.overviewRisk]}><MaterialIcons name="warning-amber" size={18} color={atRisk > 0 ? "#C43D3D" : "#147A46"} /><View><Text style={[styles.overviewValue, atRisk > 0 && styles.overviewValueRisk]}>{atRisk}</Text><Text style={styles.overviewLabel}>à surveiller</Text></View></View></View><FlatList horizontal showsHorizontalScrollIndicator={false} data={FILTERS} keyExtractor={(item) => item.key} contentContainerStyle={styles.filterRow} renderItem={({ item }) => <Pressable onPress={() => { haptic.selection(); setFilter(item.key); }} style={({ pressed }) => [styles.filter, item.key === filter && styles.filterActive, pressed && styles.pressed]}><Text style={[styles.filterLabel, item.key === filter && styles.filterLabelActive]}>{item.label}</Text></Pressable>} /><View style={styles.resultLine}><Text style={styles.resultText}>{filtered.length} expédition{filtered.length > 1 ? "s" : ""} affichée{filtered.length > 1 ? "s" : ""}</Text><Text style={styles.resultHint}>{filter === "all" ? "Triées par attention requise" : FILTERS.find((item) => item.key === filter)?.label}</Text></View></View>}
        ListEmptyComponent={<View style={styles.empty}><MaterialIcons name="inventory-2" size={32} color="#8CA0B2" /><Text style={styles.emptyTitle}>Aucune expédition trouvée</Text><Text style={styles.emptyText}>Modifiez le filtre ou attendez la prochaine synchronisation de votre agence.</Text></View>}
        renderItem={({ item }) => {
          const atRiskItem = item.status === "delayed" || item.status === "customs";
          return <Pressable onPress={() => openShipment(item)} style={({ pressed }) => [styles.card, atRiskItem && styles.cardRisk, pressed && styles.cardPressed]}><View style={styles.cardTop}><View style={styles.identity}><View style={[styles.modeIcon, atRiskItem && styles.modeIconRisk]}><MaterialIcons name={item.mode === "air" ? "flight" : item.mode === "sea" ? "directions-boat" : "local-shipping"} size={19} color={atRiskItem ? "#C43D3D" : "#0A2540"} /></View><View><Text style={styles.id}>{item.trackingNumber}</Text><Text style={styles.mode}>{modeLabel(item.mode)}</Text></View></View><StatusBadge status={item.status} /></View>{atRiskItem ? <View style={styles.alertLine}><MaterialIcons name="priority-high" size={15} color="#C43D3D" /><Text style={styles.alertText}>{item.status === "customs" ? "Action douanière potentiellement requise" : "Risque de retard détecté"}</Text></View> : null}<Text style={styles.destination}>{item.origin} <Text style={styles.arrow}>→</Text> {item.destination}</Text><View style={styles.progressRow}><View style={styles.progressTrack}><View style={[styles.progressFill, atRiskItem && styles.progressRisk, { width: `${Math.max(0, Math.min(100, item.progress))}%` }]} /></View><Text style={styles.progressText}>{item.progress}%</Text></View><View style={styles.cardFooter}><View style={styles.positionWrap}><MaterialIcons name="place" size={14} color="#718496" /><Text numberOfLines={1} style={styles.position}>{item.currentPosition}</Text></View><View style={styles.etaWrap}><Text style={styles.etaLabel}>ETA</Text><Text style={styles.eta}>{item.eta}</Text></View></View></Pressable>;
        }}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 28 }, eyebrow: { color: "#FF6B35", fontSize: 11, fontWeight: "800", letterSpacing: 1 }, title: { color: "#0A2540", fontSize: 28, fontWeight: "800", marginTop: 5 }, subtitle: { color: "#607386", fontSize: 13, lineHeight: 20, marginTop: 8 }, overview: { flexDirection: "row", gap: 10, marginTop: 18 }, overviewItem: { alignItems: "center", backgroundColor: "#FFFFFF", borderColor: "#D9E2EC", borderRadius: 14, borderWidth: 1, flex: 1, flexDirection: "row", gap: 8, padding: 12 }, overviewRisk: { backgroundColor: "#FFF8F6", borderColor: "#F5C2B5" }, overviewValue: { color: "#0A2540", fontSize: 19, fontWeight: "800" }, overviewValueRisk: { color: "#C43D3D" }, overviewLabel: { color: "#607386", fontSize: 10, fontWeight: "700", marginTop: 1 }, filterRow: { gap: 8, marginTop: 18, paddingBottom: 10 }, filter: { backgroundColor: "#FFFFFF", borderColor: "#D9E2EC", borderRadius: 999, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 9 }, filterActive: { backgroundColor: "#0A2540", borderColor: "#0A2540" }, filterLabel: { color: "#607386", fontSize: 12, fontWeight: "800" }, filterLabelActive: { color: "#FFFFFF" }, resultLine: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginBottom: 10 }, resultText: { color: "#0A2540", fontSize: 12, fontWeight: "800" }, resultHint: { color: "#718496", fontSize: 10 }, card: { backgroundColor: "#FFFFFF", borderColor: "#D9E2EC", borderRadius: 18, borderWidth: 1, marginBottom: 12, padding: 15 }, cardRisk: { borderColor: "#EFC0B6" }, cardTop: { alignItems: "flex-start", flexDirection: "row", justifyContent: "space-between" }, identity: { alignItems: "center", flex: 1, flexDirection: "row", paddingRight: 8 }, modeIcon: { alignItems: "center", backgroundColor: "#E8F0F8", borderRadius: 11, height: 38, justifyContent: "center", marginRight: 10, width: 38 }, modeIconRisk: { backgroundColor: "#FBE8E8" }, id: { color: "#0A2540", fontSize: 14, fontWeight: "800" }, mode: { color: "#718496", fontSize: 11, marginTop: 4 }, alertLine: { alignItems: "center", backgroundColor: "#FBE8E8", borderRadius: 8, flexDirection: "row", marginTop: 13, paddingHorizontal: 9, paddingVertical: 7 }, alertText: { color: "#C43D3D", fontSize: 11, fontWeight: "800", marginLeft: 5 }, destination: { color: "#324A5F", fontSize: 13, fontWeight: "700", marginTop: 15 }, arrow: { color: "#FF6B35" }, progressRow: { alignItems: "center", flexDirection: "row", gap: 10, marginTop: 14 }, progressTrack: { backgroundColor: "#E6EDF4", borderRadius: 99, flex: 1, height: 7, overflow: "hidden" }, progressFill: { backgroundColor: "#FF6B35", borderRadius: 99, height: 7 }, progressRisk: { backgroundColor: "#C43D3D" }, progressText: { color: "#0A2540", fontSize: 12, fontWeight: "800", width: 34 }, cardFooter: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginTop: 14 }, positionWrap: { alignItems: "center", flex: 1, flexDirection: "row", paddingRight: 8 }, position: { color: "#607386", flex: 1, fontSize: 11, marginLeft: 3 }, etaWrap: { alignItems: "flex-end" }, etaLabel: { color: "#718496", fontSize: 9, fontWeight: "800", letterSpacing: 0.5 }, eta: { color: "#0A2540", fontSize: 11, fontWeight: "800", marginTop: 2 }, empty: { alignItems: "center", backgroundColor: "#FFFFFF", borderColor: "#D9E2EC", borderRadius: 18, borderWidth: 1, marginTop: 20, padding: 28 }, emptyTitle: { color: "#0A2540", fontSize: 16, fontWeight: "800", marginTop: 11 }, emptyText: { color: "#718496", fontSize: 12, lineHeight: 18, marginTop: 5, textAlign: "center" }, pressed: { opacity: 0.86 }, cardPressed: { opacity: 0.72 },
});
