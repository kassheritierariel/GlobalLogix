import { router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/lib/auth-context";
import { haptic } from "@/lib/haptics";
import { requestAccountDeletion } from "@/lib/logistics-api";

export default function AccountDeletionScreen() {
  const { user, logout } = useAuth();
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const submitDeletion = async () => {
    setSubmitting(true);
    setMessage("");
    setIsError(false);
    try {
      const result = await requestAccountDeletion();
      haptic.success();
      if (result.requiresReview) {
        setConfirming(false);
        setMessage(`Demande ${result.requestId} enregistrée. Une revue est requise pour protéger les données et obligations de votre agence.`);
        return;
      }
      setMessage("Votre compte et ses données personnelles ont été supprimés.");
      try { await logout(); } catch { /* Le compte Firebase est déjà supprimé côté serveur. */ }
      setTimeout(() => router.replace("/login" as never), 700);
    } catch (error) {
      haptic.error();
      setIsError(true);
      setMessage(error instanceof Error ? error.message : "La demande de suppression a échoué.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenContainer className="bg-background">
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable onPress={() => router.canGoBack() ? router.back() : router.replace("/login" as never)} style={({ pressed }) => [styles.back, pressed && styles.pressed]}>
          <Text style={styles.backText}>‹ Retour</Text>
        </Pressable>
        <Text style={styles.eyebrow}>CONFIDENTIALITÉ</Text>
        <Text style={styles.title}>Supprimer mon compte</Text>
        <Text style={styles.lead}>Cette page est accessible depuis l’application et le Web. Connectez-vous avec le compte concerné afin que GlobalLogix puisse vérifier votre identité.</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Ce qui sera supprimé</Text>
          <Text style={styles.body}>Le compte Firebase, les jetons de notification, le profil client et les liens personnels vers les colis seront supprimés. Les informations personnelles des dossiers de colis associés seront anonymisées.</Text>
          <Text style={styles.cardTitle}>Ce qui peut être conservé</Text>
          <Text style={styles.body}>Les événements logistiques, preuves d’opération et informations nécessaires aux obligations légales ou contractuelles peuvent être conservés sous une forme anonymisée. Un compte super administrateur ou administrateur d’agence nécessite une revue avant suppression.</Text>
        </View>

        {!user ? (
          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>Authentification requise</Text>
            <Text style={styles.body}>Aucun compte connecté. Ouvrez la page de connexion, puis revenez ici depuis Réglages.</Text>
            <Pressable onPress={() => router.push("/login" as never)} style={({ pressed }) => [styles.primary, pressed && styles.pressed]}>
              <Text style={styles.primaryText}>Se connecter</Text>
            </Pressable>
          </View>
        ) : !confirming ? (
          <Pressable onPress={() => setConfirming(true)} style={({ pressed }) => [styles.dangerOutline, pressed && styles.pressed]}>
            <Text style={styles.dangerOutlineText}>Commencer la suppression</Text>
          </Pressable>
        ) : (
          <View style={styles.confirmBox}>
            <Text style={styles.confirmTitle}>Confirmer la demande</Text>
            <Text style={styles.body}>Cette action est irréversible pour les comptes supprimés immédiatement. Vérifiez que vous avez exporté les informations dont vous avez besoin.</Text>
            <View style={styles.actions}>
              <Pressable disabled={submitting} onPress={() => setConfirming(false)} style={({ pressed }) => [styles.cancel, pressed && styles.pressed, submitting && styles.disabled]}>
                <Text style={styles.cancelText}>Annuler</Text>
              </Pressable>
              <Pressable disabled={submitting} onPress={() => void submitDeletion()} style={({ pressed }) => [styles.danger, pressed && styles.pressed, submitting && styles.disabled]}>
                {submitting ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.dangerText}>Supprimer ou envoyer la demande</Text>}
              </Pressable>
            </View>
          </View>
        )}

        {message ? <Text accessibilityRole="alert" style={[styles.message, isError && styles.error]}>{message}</Text> : null}
        <Pressable onPress={() => router.push("/privacy" as never)} style={({ pressed }) => [styles.policyLink, pressed && styles.pressed]}>
          <Text style={styles.policyLinkText}>Lire la politique de confidentialité</Text>
        </Pressable>
        <Text style={styles.contact}>Assistance : info@telgroups.org</Text>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { alignSelf: "center", maxWidth: 760, padding: 22, paddingBottom: 48, width: "100%" },
  back: { alignSelf: "flex-start", minHeight: 40, justifyContent: "center", marginBottom: 18 },
  backText: { color: "#235B9D", fontSize: 15, fontWeight: "800" },
  eyebrow: { color: "#CE1126", fontSize: 11, fontWeight: "900", letterSpacing: 1.2 },
  title: { color: "#062B5C", fontSize: 30, fontWeight: "900", lineHeight: 37, marginTop: 6 },
  lead: { color: "#4F6578", fontSize: 15, lineHeight: 23, marginTop: 12 },
  card: { backgroundColor: "#FFFFFF", borderColor: "#D9E2EC", borderRadius: 18, borderWidth: 1, marginTop: 22, padding: 18 },
  cardTitle: { color: "#062B5C", fontSize: 15, fontWeight: "900", marginTop: 6 },
  body: { color: "#4F6578", fontSize: 13, lineHeight: 21, marginTop: 7 },
  infoBox: { backgroundColor: "#E7F3FF", borderColor: "#B9D9F7", borderRadius: 16, borderWidth: 1, marginTop: 16, padding: 16 },
  infoTitle: { color: "#003F87", fontSize: 15, fontWeight: "900" },
  primary: { alignItems: "center", backgroundColor: "#003F87", borderRadius: 12, justifyContent: "center", marginTop: 14, minHeight: 48 },
  primaryText: { color: "#FFFFFF", fontSize: 14, fontWeight: "900" },
  dangerOutline: { alignItems: "center", borderColor: "#CE1126", borderRadius: 14, borderWidth: 1, justifyContent: "center", marginTop: 18, minHeight: 52 },
  dangerOutlineText: { color: "#CE1126", fontSize: 14, fontWeight: "900" },
  confirmBox: { backgroundColor: "#FFF2F3", borderColor: "#E8A4AC", borderRadius: 16, borderWidth: 1, marginTop: 18, padding: 16 },
  confirmTitle: { color: "#8D0C1C", fontSize: 16, fontWeight: "900" },
  actions: { gap: 10, marginTop: 16 },
  cancel: { alignItems: "center", backgroundColor: "#FFFFFF", borderColor: "#B8C6D3", borderRadius: 12, borderWidth: 1, justifyContent: "center", minHeight: 48 },
  cancelText: { color: "#062B5C", fontSize: 14, fontWeight: "900" },
  danger: { alignItems: "center", backgroundColor: "#CE1126", borderRadius: 12, justifyContent: "center", minHeight: 50, paddingHorizontal: 12 },
  dangerText: { color: "#FFFFFF", fontSize: 13, fontWeight: "900", textAlign: "center" },
  message: { color: "#147A46", fontSize: 13, fontWeight: "700", lineHeight: 20, marginTop: 16, textAlign: "center" },
  error: { color: "#CE1126" },
  policyLink: { alignItems: "center", justifyContent: "center", marginTop: 22, minHeight: 40 },
  policyLinkText: { color: "#235B9D", fontSize: 13, fontWeight: "800" },
  contact: { color: "#718496", fontSize: 12, marginTop: 10, textAlign: "center" },
  pressed: { opacity: 0.8, transform: [{ scale: 0.985 }] },
  disabled: { opacity: 0.6 },
});
