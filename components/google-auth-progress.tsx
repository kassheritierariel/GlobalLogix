import { ActivityIndicator, Animated, StyleSheet, Text, View } from "react-native";

export type GoogleAuthPhase = "opening" | "redirecting" | "waiting" | "finalizing";

const COPY: Record<GoogleAuthPhase, { title: string; text: string }> = {
  opening: {
    title: "Ouverture sécurisée de Google",
    text: "Préparation du sélecteur de compte…",
  },
  redirecting: {
    title: "Ouverture du domaine sécurisé",
    text: "GlobalLogix vous redirige vers l’adresse publique autorisée par Firebase…",
  },
  waiting: {
    title: "Sélection du compte en cours",
    text: "Terminez la connexion dans la fenêtre Google. Cette page peut rester ouverte.",
  },
  finalizing: {
    title: "Vérification de votre session",
    text: "GlobalLogix charge maintenant votre rôle et votre périmètre d’agence.",
  },
};

export function GoogleAuthProgress({ visible, progress, phase }: { visible: boolean; progress: Animated.Value; phase: GoogleAuthPhase }) {
  if (!visible) return null;
  const copy = COPY[phase];
  return (
    <Animated.View accessibilityLiveRegion="polite" accessibilityRole="progressbar" style={[styles.container, { opacity: progress, transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [-8, 0] }) }] }]}>
      <ActivityIndicator size="small" color="#007FFF" />
      <View style={styles.copy}>
        <Text style={styles.title}>{copy.title}</Text>
        <Text style={styles.text}>{copy.text}</Text>
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
