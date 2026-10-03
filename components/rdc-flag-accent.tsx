import { StyleSheet, View } from "react-native";

export function RdcFlagAccent({ compact = false }: { compact?: boolean }) {
  return <View style={[styles.flag, compact && styles.compact]}><View style={styles.blue} /><View style={styles.yellow} /><View style={styles.red} /></View>;
}

const styles = StyleSheet.create({
  flag: { borderRadius: 99, flexDirection: "row", height: 6, overflow: "hidden", width: 88 },
  compact: { height: 4, width: 62 },
  blue: { backgroundColor: "#007FFF", flex: 1 },
  yellow: { backgroundColor: "#F7D116", flex: 0.34 },
  red: { backgroundColor: "#CE1126", flex: 0.26 },
});
