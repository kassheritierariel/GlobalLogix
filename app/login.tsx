import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Animated, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";

import { RdcFlagAccent } from "@/components/rdc-flag-accent";
import { GlobalLogixBrandLogo } from "@/components/globallogix-brand-logo";
import { GoogleAuthProgress } from "@/components/google-auth-progress";
import { useAuth } from "@/lib/auth-context";

export default function LoginScreen() {
  const { login, loginWithGoogle } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const googleProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(googleProgress, { toValue: isGoogleSubmitting ? 1 : 0, duration: 180, useNativeDriver: true }).start();
  }, [googleProgress, isGoogleSubmitting]);

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
  const googleLogin = async () => { setError(""); setIsGoogleSubmitting(true); try { await loginWithGoogle(); router.replace("/" as never); } catch (caughtError) { setError(caughtError instanceof Error ? caughtError.message : "Connexion Google impossible."); } finally { setIsGoogleSubmitting(false); } };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.container}>
      <View style={styles.brandBlock}>
        <GlobalLogixBrandLogo size="login" />
        <Text style={styles.brand}>GlobalLogix</Text>
        <Text style={styles.tagline}>Opérations logistiques, où que vous soyez.</Text>
        <View style={styles.flagWrap}><RdcFlagAccent /></View>
      </View>
      <View style={styles.formCard}>
        <Text style={styles.title}>Accès agence</Text>
        <Text style={styles.subtitle}>Connectez-vous pour suivre vos expéditions en temps réel.</Text>
        <Text style={styles.label}>Adresse e-mail</Text>
        <TextInput value={username} onChangeText={setUsername} placeholder="admin@agence.com" autoCapitalize="none" autoComplete="email" keyboardType="email-address" style={styles.input} returnKeyType="next" />
        <Text style={styles.label}>Mot de passe</Text>
        <TextInput value={password} onChangeText={setPassword} placeholder="Votre mot de passe" secureTextEntry style={styles.input} returnKeyType="done" onSubmitEditing={submit} />
        {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
        <Pressable disabled={isSubmitting} onPress={submit} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed, isSubmitting && styles.disabled]}>
          {isSubmitting ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryLabel}>Ouvrir l’espace de suivi</Text>}
        </Pressable>
        <Pressable accessibilityState={{ busy: isGoogleSubmitting, disabled: isSubmitting || isGoogleSubmitting }} disabled={isSubmitting || isGoogleSubmitting} onPress={() => void googleLogin()} style={({ pressed }) => [styles.googleButton, pressed && styles.pressed, (isSubmitting || isGoogleSubmitting) && styles.disabled]}>{isGoogleSubmitting ? <View style={styles.googleBusy}><ActivityIndicator size="small" color="#007FFF" /><Text style={styles.googleLabel}>Ouverture de Google…</Text></View> : <Text style={styles.googleLabel}>Continuer avec Google</Text>}</Pressable>
        <GoogleAuthProgress visible={isGoogleSubmitting} progress={googleProgress} />
        <Pressable onPress={() => router.push("/agency-signup" as never)} style={({ pressed }) => [styles.signupButton, pressed && styles.pressed]}><Text style={styles.signupLabel}>Créer une demande d’agence SaaS</Text></Pressable>
        <Pressable onPress={() => router.push("/client" as never)} style={({ pressed }) => [styles.clientButton, pressed && styles.pressed]}>
          <Text style={styles.clientButtonLabel}>Je suis client · suivre mes colis par SMS</Text>
        </Pressable>
        <View style={styles.noteBox}>
          <Text style={styles.noteTitle}>Accès sécurisé</Text>
          <Text style={styles.note}>La connexion utilise Firebase Auth. Les permissions et le périmètre agence proviennent des Custom Claims définis par votre administration.</Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#007FFF", justifyContent: "center", padding: 24 },
  brandBlock: { alignItems: "center", marginBottom: 32 },
  brand: { color: "#FFFFFF", fontSize: 30, fontWeight: "800", letterSpacing: -0.5 },
  tagline: { color: "#FFF6CC", fontSize: 15, marginTop: 8, textAlign: "center" },
  flagWrap: { marginTop: 14 },
  formCard: { backgroundColor: "#FFFFFF", borderRadius: 24, padding: 24 },
  title: { color: "#062B5C", fontSize: 24, fontWeight: "800" },
  subtitle: { color: "#5B6D84", fontSize: 15, lineHeight: 22, marginTop: 8, marginBottom: 24 },
  label: { color: "#062B5C", fontSize: 14, fontWeight: "700", marginBottom: 8 },
  input: { borderColor: "#C7DBF3", borderWidth: 1, borderRadius: 12, color: "#062B5C", fontSize: 16, height: 50, marginBottom: 16, paddingHorizontal: 14 },
  error: { color: "#CE1126", fontSize: 14, fontWeight: "600", marginBottom: 12 },
  primaryButton: { alignItems: "center", backgroundColor: "#F7D116", borderRadius: 14, height: 52, justifyContent: "center", marginTop: 4 },
  primaryLabel: { color: "#062B5C", fontSize: 16, fontWeight: "800" },
  googleButton: { alignItems: "center", backgroundColor: "#FFFFFF", borderColor: "#C7DBF3", borderRadius: 14, borderWidth: 1, height: 50, justifyContent: "center", marginTop: 10 },
  googleLabel: { color: "#062B5C", fontSize: 14, fontWeight: "800" },
  googleBusy: { alignItems: "center", flexDirection: "row", gap: 8 },
  signupButton: { alignItems: "center", height: 38, justifyContent: "center", marginTop: 5 },
  signupLabel: { color: "#007FFF", fontSize: 12, fontWeight: "800" },
  clientButton: { alignItems: "center", borderColor: "#007FFF", borderRadius: 14, borderWidth: 1, height: 48, justifyContent: "center", marginTop: 10 },
  clientButtonLabel: { color: "#007FFF", fontSize: 13, fontWeight: "800" },
  pressed: { opacity: 0.86, transform: [{ scale: 0.98 }] },
  disabled: { opacity: 0.6 },
  noteBox: { backgroundColor: "#E7F3FF", borderRadius: 14, marginTop: 18, padding: 14 },
  noteTitle: { color: "#003F87", fontSize: 13, fontWeight: "800", marginBottom: 4 },
  note: { color: "#5B6D84", fontSize: 12, lineHeight: 18 },
});
