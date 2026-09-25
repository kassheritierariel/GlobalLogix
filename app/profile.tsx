import * as FirebaseAuth from "firebase/auth";
import { router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { haptic } from "@/lib/haptics";
import { getFirebaseAuth } from "@/lib/firebase";
import { validatePasswordChange } from "@/lib/profile-password";

export default function ProfileScreen() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const savePassword = async () => {
    const validation = validatePasswordChange({ currentPassword, newPassword, confirmPassword });
    if (validation) {
      haptic.error();
      setStatus("error");
      setMessage(validation);
      return;
    }

    const user = getFirebaseAuth().currentUser;
    if (!user?.email) {
      haptic.error();
      setStatus("error");
      setMessage("Votre session Firebase a expiré. Reconnectez-vous avant de modifier votre mot de passe.");
      return;
    }

    setStatus("saving");
    setMessage("");
    try {
      const credential = FirebaseAuth.EmailAuthProvider.credential(user.email, currentPassword);
      await FirebaseAuth.reauthenticateWithCredential(user, credential);
      await FirebaseAuth.updatePassword(user, newPassword);
      await user.getIdToken(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      haptic.success();
      setStatus("success");
      setMessage("Mot de passe modifié. Votre session sécurisée reste active.");
    } catch (error) {
      haptic.error();
      setStatus("error");
      const code = typeof error === "object" && error && "code" in error ? String((error as { code?: string }).code) : "";
      setMessage(code === "auth/wrong-password" || code === "auth/invalid-credential" ? "Le mot de passe actuel est incorrect." : "La modification a échoué. Reconnectez-vous puis réessayez.");
    }
  };

  return (
    <ScreenContainer className="bg-background">
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.back, pressed && styles.pressed]}>
            <Text style={styles.backText}>‹ Réglages</Text>
          </Pressable>
          <Text style={styles.eyebrow}>SÉCURITÉ DU COMPTE</Text>
          <Text style={styles.title}>Profil</Text>
          <Text style={styles.subtitle}>Modifiez votre mot de passe Firebase en confirmant d’abord votre mot de passe actuel.</Text>

          <View style={styles.card}>
            <Text style={styles.label}>Mot de passe actuel</Text>
            <TextInput value={currentPassword} onChangeText={setCurrentPassword} style={styles.input} secureTextEntry autoCapitalize="none" autoCorrect={false} textContentType="password" returnKeyType="next" />
            <Text style={styles.label}>Nouveau mot de passe</Text>
            <TextInput value={newPassword} onChangeText={setNewPassword} style={styles.input} secureTextEntry autoCapitalize="none" autoCorrect={false} textContentType="newPassword" returnKeyType="next" />
            <Text style={styles.helper}>12 caractères minimum, avec majuscule, minuscule, chiffre et symbole.</Text>
            <Text style={styles.label}>Confirmer le nouveau mot de passe</Text>
            <TextInput value={confirmPassword} onChangeText={setConfirmPassword} style={styles.input} secureTextEntry autoCapitalize="none" autoCorrect={false} textContentType="newPassword" returnKeyType="done" onSubmitEditing={() => void savePassword()} />
            <Pressable disabled={status === "saving"} onPress={() => void savePassword()} style={({ pressed }) => [styles.submit, pressed && styles.pressed, status === "saving" && styles.disabled]}>
              {status === "saving" ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.submitText}>Mettre à jour le mot de passe</Text>}
            </Pressable>
            {message ? <Text style={[styles.message, status === "error" && styles.error]}>{message}</Text> : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 20, paddingBottom: 42 },
  back: { alignSelf: "flex-start", marginBottom: 24, minHeight: 36, justifyContent: "center" },
  backText: { color: "#235B9D", fontSize: 15, fontWeight: "800" },
  eyebrow: { color: "#FF6B35", fontSize: 11, fontWeight: "800", letterSpacing: 1 },
  title: { color: "#0A2540", fontSize: 30, fontWeight: "800", marginTop: 5 },
  subtitle: { color: "#718496", fontSize: 14, lineHeight: 21, marginTop: 10 },
  card: { backgroundColor: "#FFFFFF", borderColor: "#D9E2EC", borderRadius: 18, borderWidth: 1, marginTop: 26, padding: 18 },
  label: { color: "#0A2540", fontSize: 13, fontWeight: "800", marginBottom: 8, marginTop: 14 },
  input: { borderColor: "#C7D3DF", borderRadius: 12, borderWidth: 1, color: "#0A2540", fontSize: 16, height: 50, paddingHorizontal: 14 },
  helper: { color: "#718496", fontSize: 12, lineHeight: 17, marginTop: 8 },
  submit: { alignItems: "center", backgroundColor: "#FF6B35", borderRadius: 14, height: 52, justifyContent: "center", marginTop: 24 },
  submitText: { color: "#FFFFFF", fontSize: 14, fontWeight: "800" },
  message: { color: "#147A46", fontSize: 13, lineHeight: 18, marginTop: 15, textAlign: "center" },
  error: { color: "#C43D3D" },
  pressed: { opacity: 0.8, transform: [{ scale: 0.985 }] },
  disabled: { opacity: 0.65 },
});
