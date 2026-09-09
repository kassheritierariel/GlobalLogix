import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { fetchExceptions, hasLogisticsApi, transitionException, type ExceptionCase } from "@/lib/logistics-api";
import { haptic } from "@/lib/haptics";
import { useTracking } from "@/lib/tracking-context";

const kindLabels: Record<ExceptionCase["kind"], string> = { delay: "Retard", customs: "Douane", no_signal: "Signal perdu", eta_risk: "Risque ETA", temperature: "Température" };

export default function ExceptionsScreen() {
  const { selectShipment } = useTracking();
  const [items, setItems] = useState<ExceptionCase[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "unavailable">("loading");

  const load = useCallback(async () => {
    if (!hasLogisticsApi()) {
      setState("unavailable");
      return;
    }
    setState("loading");
    try {
      setItems(await fetchExceptions());
      setState("ready");
    } catch {
      setState("unavailable");
    }
  }, []);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const transition = async (item: ExceptionCase, status: "acknowledged" | "resolved") => {
    try {
      await transitionException(item.id, status);
      haptic.success();
      await load();
    } catch {
      haptic.error();
    }
  };

  return <ScreenContainer className="bg-background"><FlatList data={items} keyExtractor={(item) => item.id} contentContainerStyle={styles.content} refreshing={state === "loading"} onRefresh={() => void load()} ListHeaderComponent={<View><Text style={styles.eyebrow}>ACTION OPÉRATIONNELLE</Text><Text style={styles.title}>Centre d’exceptions</Text><Text style={styles.subtitle}>Les incidents ouverts sont triés pour accélérer la décision et protéger le service client.</Text><View style={styles.legend}><View style={styles.legendItem}><View style={[styles.dot, styles.criticalDot]} /><Text style={styles.legendText}>Critique</Text></View><View style={styles.legendItem}><View style={[styles.dot, styles.warningDot]} /><Text style={styles.legendText}>À surveiller</Text></View></View></View>} ListEmptyComponent={<View style={styles.empty}>{state === "loading" ? <ActivityIndicator color="#FF6B35" /> : <><MaterialIcons name={state === "unavailable" ? "cloud-off" : "verified"} size={34} color="#718496" /><Text style={styles.emptyTitle}>{state === "unavailable" ? "Centre non connecté" : "Aucune exception ouverte"}</Text><Text style={styles.emptyBody}>{state === "unavailable" ? "Configurez l’API logistique pour charger les incidents réels de votre agence." : "Les expéditions sont dans leur fenêtre de service actuelle."}</Text></>}</View>} renderItem={({ item }) => <View style={[styles.card, item.severity === "critical" && styles.cardCritical]}><View style={styles.cardTop}><View style={[styles.severity, item.severity === "critical" ? styles.severityCritical : styles.severityWarning]}><Text style={styles.severityText}>{item.severity === "critical" ? "CRITIQUE" : "À SURVEILLER"}</Text></View><Text style={styles.kind}>{kindLabels[item.kind]}</Text></View><Text style={styles.cardTitle}>{item.title}</Text><Text style={styles.description}>{item.description}</Text><Pressable onPress={() => { haptic.light(); selectShipment(item.shipment.id); router.push("/tracking" as never); }} style={({ pressed }) => [styles.shipmentRef, pressed && styles.pressed]}><MaterialIcons name="local-shipping" size={17} color="#0A2540" /><Text style={styles.shipmentRefText}>{item.shipment.trackingNumber}</Text><MaterialIcons name="arrow-forward" size={16} color="#718496" /></Pressable><View style={styles.actions}>{item.status === "open" ? <Pressable onPress={() => void transition(item, "acknowledged")} style={({ pressed }) => [styles.ackButton, pressed && styles.pressed]}><Text style={styles.ackText}>Prendre en charge</Text></Pressable> : null}<Pressable onPress={() => void transition(item, "resolved")} style={({ pressed }) => [styles.resolveButton, pressed && styles.pressed]}><Text style={styles.resolveText}>Résoudre</Text></Pressable></View></View>} /></ScreenContainer>;
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 26 }, eyebrow: { color: "#FF6B35", fontSize: 11, fontWeight: "800", letterSpacing: 1 }, title: { color: "#0A2540", fontSize: 28, fontWeight: "800", marginTop: 5 }, subtitle: { color: "#607386", fontSize: 14, lineHeight: 21, marginTop: 8 }, legend: { flexDirection: "row", gap: 16, marginBottom: 16, marginTop: 18 }, legendItem: { alignItems: "center", flexDirection: "row" }, dot: { borderRadius: 4, height: 8, marginRight: 6, width: 8 }, criticalDot: { backgroundColor: "#C43D3D" }, warningDot: { backgroundColor: "#C5851D" }, legendText: { color: "#607386", fontSize: 11, fontWeight: "700" }, card: { backgroundColor: "#FFFFFF", borderColor: "#D9E2EC", borderRadius: 18, borderWidth: 1, marginBottom: 12, padding: 16 }, cardCritical: { borderColor: "#E8B6B6" }, cardTop: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" }, severity: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5 }, severityCritical: { backgroundColor: "#FBE8E8" }, severityWarning: { backgroundColor: "#FFF2D9" }, severityText: { color: "#A43838", fontSize: 10, fontWeight: "900" }, kind: { color: "#718496", fontSize: 12, fontWeight: "800" }, cardTitle: { color: "#0A2540", fontSize: 16, fontWeight: "800", marginTop: 14 }, description: { color: "#607386", fontSize: 12, lineHeight: 18, marginTop: 6 }, shipmentRef: { alignItems: "center", backgroundColor: "#E8F0F8", borderRadius: 12, flexDirection: "row", marginTop: 14, padding: 10 }, shipmentRefText: { color: "#0A2540", flex: 1, fontSize: 12, fontWeight: "800", marginLeft: 8 }, actions: { flexDirection: "row", gap: 10, marginTop: 12 }, ackButton: { alignItems: "center", backgroundColor: "#FFF2D9", borderRadius: 11, flex: 1, height: 42, justifyContent: "center" }, ackText: { color: "#936200", fontSize: 12, fontWeight: "800" }, resolveButton: { alignItems: "center", backgroundColor: "#E7F5EC", borderRadius: 11, flex: 1, height: 42, justifyContent: "center" }, resolveText: { color: "#147A46", fontSize: 12, fontWeight: "800" }, empty: { alignItems: "center", paddingHorizontal: 30, paddingTop: 56 }, emptyTitle: { color: "#0A2540", fontSize: 17, fontWeight: "800", marginTop: 14 }, emptyBody: { color: "#718496", fontSize: 13, lineHeight: 19, marginTop: 7, textAlign: "center" }, pressed: { opacity: 0.72, transform: [{ scale: 0.98 }] },
});
