import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";

import { AnimatedPressable } from "@/components/animated-pressable";
import { RdcFlagAccent } from "@/components/rdc-flag-accent";
import { GlobalLogixBrandLogo } from "@/components/globallogix-brand-logo";
import { GoogleAuthSplash } from "@/components/google-auth-splash";
import type { GoogleAuthPhase } from "@/components/google-auth-progress";
import { ThemeToggleButton } from "@/components/theme-toggle-button";
import { useAuth } from "@/lib/auth-context";
import { useThemeContext } from "@/lib/theme-provider";

export default function LoginScreen() {
  const { login, loginWithGoogle } = useAuth();
  const { colorScheme } = useThemeContext();
  const dark = colorScheme === "dark";
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const [googlePhase, setGooglePhase] = useState<GoogleAuthPhase>("opening");
  const googlePhaseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (googlePhaseTimer.current) clearTimeout(googlePhaseTimer.current);
  }, []);

  useEffect(() => {
    if (!__DEV__ || Platform.OS !== "web" || typeof window === "undefined") return;
    if (new URLSearchParams(window.location.search).get("previewGoogleSplash") !== "1") return;
    setGooglePhase("waiting");
    setIsGoogleSubmitting(true);
  }, []);

  const submit = async () => {
    setError("");
    setIsSubmitting(true);
    try {
      await login(username, password);
      router.replace("/" as never);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Connexion impossible.");
    } finally {
      setIsSubmitting(false);
    }
  };
  const googleLogin = async () => {
    setError("");
    setGooglePhase("opening");
    setIsGoogleSubmitting(true);
    googlePhaseTimer.current = setTimeout(() => setGooglePhase("waiting"), 700);
    try {
      const outcome = await loginWithGoogle();
      if (googlePhaseTimer.current) clearTimeout(googlePhaseTimer.current);
      if (outcome === "redirected") {
        setGooglePhase("redirecting");
        await new Promise((resolve) => setTimeout(resolve, 500));
        return;
      }
      setGooglePhase("finalizing");
      await new Promise((resolve) => setTimeout(resolve, 250));
      router.replace("/" as never);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Connexion Google impossible.");
    } finally {
      if (googlePhaseTimer.current) clearTimeout(googlePhaseTimer.current);
      googlePhaseTimer.current = null;
      setIsGoogleSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={[styles.container, dark && styles.containerDark]}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.brandBlock}>
          <GlobalLogixBrandLogo size="login" />
          <Text style={styles.brand}>GlobalLogix</Text>
          <Text style={styles.tagline}>Opérations logistiques, où que vous soyez.</Text>
          <View style={styles.flagWrap}><RdcFlagAccent /></View>
        </View>
        <View style={[styles.formCard, dark && styles.formCardDark]}>
        <Text style={[styles.title, dark && styles.textLight]}>Accès agence</Text>
        <Text style={[styles.subtitle, dark && styles.textMutedDark]}>Connectez-vous pour suivre vos expéditions en temps réel.</Text>
        <Text style={[styles.label, dark && styles.textLight]}>Adresse e-mail</Text>
        <TextInput value={username} onChangeText={setUsername} placeholder="admin@agence.com" placeholderTextColor={dark ? "#8FA8BD" : "#718496"} autoCapitalize="none" autoComplete="email" keyboardType="email-address" style={[styles.input, dark && styles.inputDark]} returnKeyType="next" />
        <Text style={[styles.label, dark && styles.textLight]}>Mot de passe</Text>
        <TextInput value={password} onChangeText={setPassword} placeholder="Votre mot de passe" placeholderTextColor={dark ? "#8FA8BD" : "#718496"} secureTextEntry style={[styles.input, dark && styles.inputDark]} returnKeyType="done" onSubmitEditing={submit} />
        {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
        <AnimatedPressable disabled={isSubmitting} onPress={submit} style={[styles.primaryButton, isSubmitting && styles.disabled]}>
          {isSubmitting ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryLabel}>Ouvrir l’espace de suivi</Text>}
        </AnimatedPressable>
        <AnimatedPressable accessibilityState={{ busy: isGoogleSubmitting, disabled: isSubmitting || isGoogleSubmitting }} disabled={isSubmitting || isGoogleSubmitting} onPress={() => void googleLogin()} style={[styles.googleButton, dark && styles.googleButtonDark, (isSubmitting || isGoogleSubmitting) && styles.disabled]}>{isGoogleSubmitting ? <View style={styles.googleBusy}><ActivityIndicator size="small" color="#007FFF" /><Text style={[styles.googleLabel, dark && styles.textLight]}>{googlePhase === "opening" ? "Ouverture de Google…" : googlePhase === "redirecting" ? "Redirection sécurisée…" : googlePhase === "waiting" ? "Sélection du compte…" : "Vérification de la session…"}</Text></View> : <Text style={[styles.googleLabel, dark && styles.textLight]}>Continuer avec Google</Text>}</AnimatedPressable>
        <AnimatedPressable hapticFeedback="selection" onPress={() => router.push("/agency-signup" as never)} style={styles.signupButton}><Text style={[styles.signupLabel, dark && styles.linkDark]}>Créer une demande d’agence SaaS</Text></AnimatedPressable>
        <AnimatedPressable hapticFeedback="selection" onPress={() => router.push("/client" as never)} style={[styles.clientButton, dark && styles.clientButtonDark]}>
          <Text style={[styles.clientButtonLabel, dark && styles.linkDark]}>Je suis client · suivre mes colis par SMS</Text>
        </AnimatedPressable>
        <View style={[styles.noteBox, dark && styles.noteBoxDark]}>
          <Text style={[styles.noteTitle, dark && styles.linkDark]}>Accès sécurisé</Text>
          <Text style={[styles.note, dark && styles.textMutedDark]}>La connexion utilise Firebase Auth. Les permissions et le périmètre agence proviennent des Custom Claims définis par votre administration.</Text>
        </View>
        <View style={styles.legalLinks}>
          <AnimatedPressable hapticFeedback="selection" onPress={() => router.push("/privacy" as never)}><Text style={[styles.legalLink, dark && styles.linkDark]}>Confidentialité</Text></AnimatedPressable>
          <Text style={styles.legalSeparator}>·</Text>
          <AnimatedPressable hapticFeedback="selection" onPress={() => router.push("/account-deletion" as never)}><Text style={[styles.legalLink, dark && styles.linkDark]}>Supprimer un compte</Text></AnimatedPressable>
        </View>
        </View>
      </ScrollView>
      <View style={styles.themeToggle}><ThemeToggleButton /></View>
      <GoogleAuthSplash phase={googlePhase} visible={isGoogleSubmitting} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#007FFF" },
  containerDark: { backgroundColor: "#071A2D" },
  scrollContent: { flexGrow: 1, justifyContent: "center", padding: 24 },
  brandBlock: { alignItems: "center", marginBottom: 32 },
  brand: { color: "#FFFFFF", fontSize: 30, fontWeight: "800", letterSpacing: -0.5 },
  tagline: { color: "#FFF6CC", fontSize: 15, marginTop: 8, textAlign: "center" },
  flagWrap: { marginTop: 14 },
  formCard: { backgroundColor: "#FFFFFF", borderRadius: 24, padding: 24 },
  formCardDark: { backgroundColor: "#10283D", borderColor: "#315673", borderWidth: 1 },
  title: { color: "#062B5C", fontSize: 24, fontWeight: "800" },
  subtitle: { color: "#5B6D84", fontSize: 15, lineHeight: 22, marginTop: 8, marginBottom: 24 },
  label: { color: "#062B5C", fontSize: 14, fontWeight: "700", marginBottom: 8 },
  input: { borderColor: "#C7DBF3", borderWidth: 1, borderRadius: 12, color: "#062B5C", fontSize: 16, height: 50, marginBottom: 16, paddingHorizontal: 14 },
  inputDark: { backgroundColor: "#173858", borderColor: "#315673", color: "#F6FAFF" },
  error: { color: "#CE1126", fontSize: 14, fontWeight: "600", marginBottom: 12 },
  primaryButton: { alignItems: "center", backgroundColor: "#F7D116", borderRadius: 14, height: 52, justifyContent: "center", marginTop: 4 },
  primaryLabel: { color: "#062B5C", fontSize: 16, fontWeight: "800" },
  googleButton: { alignItems: "center", backgroundColor: "#FFFFFF", borderColor: "#C7DBF3", borderRadius: 14, borderWidth: 1, height: 50, justifyContent: "center", marginTop: 10 },
  googleButtonDark: { backgroundColor: "#173858", borderColor: "#315673" },
  googleLabel: { color: "#062B5C", fontSize: 14, fontWeight: "800" },
  googleBusy: { alignItems: "center", flexDirection: "row", gap: 8 },
  signupButton: { alignItems: "center", height: 38, justifyContent: "center", marginTop: 5 },
  signupLabel: { color: "#007FFF", fontSize: 12, fontWeight: "800" },
  clientButton: { alignItems: "center", borderColor: "#007FFF", borderRadius: 14, borderWidth: 1, height: 48, justifyContent: "center", marginTop: 10 },
  clientButtonDark: { borderColor: "#F7D116" },
  clientButtonLabel: { color: "#007FFF", fontSize: 13, fontWeight: "800" },
  disabled: { opacity: 0.6 },
  noteBox: { backgroundColor: "#E7F3FF", borderRadius: 14, marginTop: 18, padding: 14 },
  noteBoxDark: { backgroundColor: "#173858" },
  noteTitle: { color: "#003F87", fontSize: 13, fontWeight: "800", marginBottom: 4 },
  note: { color: "#5B6D84", fontSize: 12, lineHeight: 18 },
  legalLinks: { alignItems: "center", flexDirection: "row", justifyContent: "center", marginTop: 14 },
  legalLink: { color: "#235B9D", fontSize: 11, fontWeight: "800" },
  legalSeparator: { color: "#91A1B2", marginHorizontal: 8 },
  textLight: { color: "#F6FAFF" },
  textMutedDark: { color: "#B6C8D9" },
  linkDark: { color: "#F7D116" },
  themeToggle: { position: "absolute", right: 14, top: Platform.OS === "web" ? 14 : 52, zIndex: 50 },
});
