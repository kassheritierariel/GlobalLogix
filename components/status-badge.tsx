import { StyleSheet, Text, View } from "react-native";

import type { ShipmentStatus } from "@/lib/types";

const LABELS: Record<ShipmentStatus, string> = {
  "in-transit": "En transit",
  customs: "Douane",
  delayed: "Retard",
  delivered: "Livrée",
};

const COLORS: Record<ShipmentStatus, { background: string; color: string }> = {
  "in-transit": { background: "#E7F3FF", color: "#003F87" },
  customs: { background: "#FFF6CC", color: "#8A6500" },
  delayed: { background: "#FDE9E8", color: "#CE1126" },
  delivered: { background: "#E7F3FF", color: "#007FFF" },
};

export function StatusBadge({ status }: { status: ShipmentStatus }) {
  const colors = COLORS[status];
  return (
    <View style={[styles.badge, { backgroundColor: colors.background }]}>
      <Text style={[styles.label, { color: colors.color }]}>{LABELS[status]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { alignSelf: "flex-start", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  label: { fontSize: 12, fontWeight: "700" },
});
