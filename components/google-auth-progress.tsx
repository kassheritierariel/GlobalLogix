import { ActivityIndicator, Animated, StyleSheet, Text, View } from "react-native";

export function GoogleAuthProgress({ visible, progress }: { visible: boolean; progress: Animated.Value }) {
  if (!visible) return null;
  return (
    <Animated.View accessibilityLiveRegion="polite" style={[styles.container, { opacity: progress, transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [-8, 0] }) }] }]}>
      <ActivityIndicator size="small" color="#007FFF" />
      <View style={styles.copy}>
        <Text style={styles.title}>Connexion Google sécurisée</Text>
        <Text style={styles.text}>La fenêtre Google est en cours d’ouverture. Ne fermez pas cette page.</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", backgroundColor: "#E7F3FF", borderRadius: 12, flexDirection: "row", gap: 10, marginTop: 10, padding: 12 },
  copy: { flex: 1 },
  title: { color: "#003F87", fontSize: 12, fontWeight: "900" },
  text: { color: "#415F80", fontSize: 11, lineHeight: 16, marginTop: 2 },
});
