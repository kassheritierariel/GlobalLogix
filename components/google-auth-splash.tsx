import { AccessibilityInfo, ActivityIndicator, Animated, Easing, Modal, StyleSheet, Text, View } from "react-native";
import { useEffect, useRef, useState } from "react";

import { GlobalLogixBrandLogo } from "@/components/globallogix-brand-logo";
import { RdcFlagAccent } from "@/components/rdc-flag-accent";
import type { GoogleAuthPhase } from "@/components/google-auth-progress";

const PHASE_COPY: Record<GoogleAuthPhase, { eyebrow: string; title: string; text: string }> = {
  opening: {
    eyebrow: "CONNEXION SÉCURISÉE",
    title: "Ouverture de Google",
    text: "Nous préparons le sélecteur de compte et protégeons votre session.",
  },
  redirecting: {
    eyebrow: "DOMAINE VÉRIFIÉ",
    title: "Redirection sécurisée",
    text: "GlobalLogix rejoint son adresse publique autorisée par Firebase.",
  },
  waiting: {
    eyebrow: "AUTHENTIFICATION GOOGLE",
    title: "Sélectionnez votre compte",
    text: "Terminez l’étape dans la fenêtre Google. Votre progression est conservée ici.",
  },
  finalizing: {
    eyebrow: "PRESQUE TERMINÉ",
    title: "Chargement de votre espace",
    text: "Nous vérifions votre rôle et le périmètre sécurisé de votre agence.",
  },
};

export function GoogleAuthSplash({ visible, phase }: { visible: boolean; phase: GoogleAuthPhase }) {
  const entrance = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const sweep = useRef(new Animated.Value(0)).current;
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted) setReduceMotion(enabled);
    });
    const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduceMotion);
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (!visible) {
      entrance.setValue(0);
      pulse.setValue(0);
      sweep.setValue(0);
      return;
    }
    if (reduceMotion) {
      entrance.setValue(1);
      pulse.setValue(0);
      sweep.setValue(0.5);
      return;
    }

    Animated.timing(entrance, {
      toValue: 1,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    const sweepLoop = Animated.loop(
      Animated.timing(sweep, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }),
    );
    pulseLoop.start();
    sweepLoop.start();
    return () => {
      pulseLoop.stop();
      sweepLoop.stop();
    };
  }, [entrance, pulse, reduceMotion, sweep, visible]);

  const copy = PHASE_COPY[phase];

  return (
    <Modal animationType="fade" presentationStyle="fullScreen" statusBarTranslucent transparent visible={visible}>
      <View accessibilityLiveRegion="polite" accessibilityRole="progressbar" style={styles.backdrop}>
        <Animated.View
          pointerEvents="none"
          style={[
            styles.halo,
            {
              opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.16, 0.34] }),
              transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1.08] }) }],
            },
          ]}
        />
        <Animated.View
          style={[
            styles.card,
            {
              opacity: entrance,
              transform: [
                { translateY: entrance.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) },
                { scale: entrance.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) },
              ],
            },
          ]}
        >
          <GlobalLogixBrandLogo size="client" />
          <Text style={styles.eyebrow}>{copy.eyebrow}</Text>
          <Text style={styles.title}>{copy.title}</Text>
          <Text style={styles.text}>{copy.text}</Text>
          <View style={styles.progressTrack}>
            <Animated.View
              style={[
                styles.progressSweep,
                {
                  transform: [{ translateX: sweep.interpolate({ inputRange: [0, 1], outputRange: [-170, 250] }) }],
                },
              ]}
            />
          </View>
          <View style={styles.statusRow}>
            <ActivityIndicator color="#F7D116" size="small" />
            <Text style={styles.status}>Veuillez patienter quelques secondes</Text>
          </View>
          <View style={styles.flag}><RdcFlagAccent /></View>
          <Text style={styles.security}>Firebase Auth · Session chiffrée · Isolation par agence</Text>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { alignItems: "center", backgroundColor: "#007FFF", flex: 1, justifyContent: "center", overflow: "hidden", padding: 24 },
  halo: { backgroundColor: "#F7D116", borderRadius: 230, height: 460, position: "absolute", width: 460 },
  card: { alignItems: "center", backgroundColor: "#FFFFFF", borderColor: "rgba(255,255,255,0.72)", borderRadius: 30, borderWidth: 1, maxWidth: 440, paddingHorizontal: 28, paddingVertical: 30, shadowColor: "#00224D", shadowOffset: { height: 18, width: 0 }, shadowOpacity: 0.26, shadowRadius: 30, width: "100%" },
  eyebrow: { color: "#007FFF", fontSize: 11, fontWeight: "900", letterSpacing: 1.5, marginTop: 4 },
  title: { color: "#062B5C", fontSize: 25, fontWeight: "900", letterSpacing: -0.4, marginTop: 9, textAlign: "center" },
  text: { color: "#5B6D84", fontSize: 14, lineHeight: 21, marginTop: 9, maxWidth: 330, textAlign: "center" },
  progressTrack: { backgroundColor: "#DCEBFA", borderRadius: 999, height: 7, marginTop: 24, overflow: "hidden", width: "100%" },
  progressSweep: { backgroundColor: "#F7D116", borderRadius: 999, height: 7, width: 170 },
  statusRow: { alignItems: "center", backgroundColor: "#003F87", borderRadius: 14, flexDirection: "row", gap: 10, marginTop: 16, paddingHorizontal: 15, paddingVertical: 12, width: "100%" },
  status: { color: "#FFFFFF", flex: 1, fontSize: 12, fontWeight: "800" },
  flag: { marginTop: 20 },
  security: { color: "#718496", fontSize: 10, fontWeight: "700", marginTop: 12, textAlign: "center" },
});
