import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import type { Shipment } from "@/lib/types";
import { getExternalMapUrl, getMultimodalLocationPresentation } from "@/lib/multimodal-location";
import { haptic } from "@/lib/haptics";

export function MultimodalLocationCard({ shipment }: { shipment: Shipment }) {
  const presentation = getMultimodalLocationPresentation(shipment);
  const openExternalMap = async () => {
    try {
      haptic.selection();
      await Linking.openURL(getExternalMapUrl(shipment));
    } catch {
      haptic.error();
    }
  };

  return <View style={styles.card}>
    <View style={styles.header}><View style={styles.icon}><MaterialIcons name={presentation.icon} size={20} color="#235B9D" /></View><View style={styles.headerCopy}><Text style={styles.title}>{presentation.title}</Text><Text style={styles.subtitle}>{presentation.subtitle}</Text></View></View>
    <View style={styles.position}><Text style={styles.label}>{presentation.landmarkLabel}</Text><Text style={styles.value}>{shipment.currentPosition}</Text><Text style={styles.updated}>Télémétrie reçue · {shipment.lastTelemetryAt}</Text></View>
    <Pressable onPress={() => void openExternalMap()} style={({ pressed }) => [styles.mapButton, pressed && styles.pressed]}><MaterialIcons name="map" size={18} color="#0A2540" /><Text style={styles.mapButtonText}>Voir le contexte cartographique</Text><MaterialIcons name="open-in-new" size={16} color="#235B9D" /></Pressable>
  </View>;
}

const styles = StyleSheet.create({
  card: { backgroundColor: "#FFFFFF", borderColor: "#D9E2EC", borderRadius: 18, borderWidth: 1, marginTop: 14, padding: 15 },
  header: { alignItems: "center", flexDirection: "row" }, icon: { alignItems: "center", backgroundColor: "#E8F0F8", borderRadius: 18, height: 36, justifyContent: "center", width: 36 }, headerCopy: { flex: 1, marginLeft: 10 }, title: { color: "#0A2540", fontSize: 14, fontWeight: "800" }, subtitle: { color: "#718496", fontSize: 11, lineHeight: 16, marginTop: 2 },
  position: { backgroundColor: "#F7FAFC", borderRadius: 12, marginTop: 14, padding: 12 }, label: { color: "#718496", fontSize: 10, fontWeight: "800", letterSpacing: 0.5 }, value: { color: "#0A2540", fontSize: 14, fontWeight: "800", marginTop: 5 }, updated: { color: "#718496", fontSize: 11, marginTop: 5 },
  mapButton: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginTop: 13 }, mapButtonText: { color: "#0A2540", flex: 1, fontSize: 12, fontWeight: "800", marginLeft: 7 }, pressed: { opacity: 0.75, transform: [{ scale: 0.985 }] },
});
