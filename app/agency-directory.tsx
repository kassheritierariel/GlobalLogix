import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/lib/auth-context";
import { onboardAgency } from "@/lib/agency-api";

const colors = ["#007FFF", "#0F766E", "#6D28D9", "#B45309", "#CE1126"];

export default function AgencyDirectoryScreen() {
  const { user } = useAuth();
  const [agencyId, setAgencyId] = useState("");
  const [publicSlug, setPublicSlug] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [legalName, setLegalName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [publicPhone, setPublicPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [primaryColor, setPrimaryColor] = useState(colors[0]);
  const [supportHours, setSupportHours] = useState("Lun–Ven · 08:00–18:00");
  const [result, setResult] = useState<{ link: string; email: string } | null>(null);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const suggestedSlug = useMemo(() => displayName.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""), [displayName]);

  if (user?.role !== "super_admin") return <ScreenContainer><View style={styles.center}><MaterialIcons name="lock" size={34} color="#CE1126" /><Text style={styles.title}>Accès éditeur requis</Text><Text style={styles.denied}>L’onboarding d’une nouvelle agence est réservé à GlobalLogix.</Text></View></ScreenContainer>;

  const createAgency = async () => {
    try {
      const normalizedId = agencyId.trim().toUpperCase();
      if (!/^[A-Z0-9][A-Z0-9_-]{2,63}$/.test(normalizedId)) throw new Error("Utilisez un code d’agence de 3 à 64 caractères : lettres, chiffres, tirets ou soulignés.");
      if (!displayName.trim()) throw new Error("Le nom commercial est requis.");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail.trim())) throw new Error("Saisissez l’adresse e-mail de l’administrateur de l’agence.");
      setSaving(true); setMessage(""); setResult(null);
      const created = await onboardAgency({
        agencyId: normalizedId, publicSlug: publicSlug.trim() || suggestedSlug || undefined, displayName: displayName.trim(), legalName: legalName.trim() || undefined,
        adminEmail: adminEmail.trim(), publicEmail: adminEmail.trim(), publicPhone: publicPhone.trim() || undefined, website: website.trim() || undefined,
        primaryColor, supportHours: supportHours.trim() || undefined, timeZone: "Africa/Kinshasa",
      });
      setResult({ link: created.agencyPath, email: created.admin.email });
      setMessage(`Agence créée. L’invitation Firebase de définition du mot de passe a été demandée pour ${created.admin.email}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Création de l’agence impossible.");
    } finally { setSaving(false); }
  };

  return <ScreenContainer><KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.flex}><ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled"><Pressable onPress={() => router.back()} style={styles.back}><MaterialIcons name="arrow-back" size={20} color="#062B5C" /><Text style={styles.backText}>Réglages</Text></Pressable><Text style={styles.eyebrow}>ÉDITEUR GLOBALLOGIX</Text><Text style={styles.title}>Onboarder une agence SaaS</Text><Text style={styles.subtitle}>Créez l’espace isolé de l’agence, désignez son administrateur et générez son lien client personnalisé. L’administrateur reçoit ensuite une invitation et complète le logo, les couleurs et sa connexion WhatsApp.</Text>
    <View style={styles.step}><MaterialIcons name="verified-user" size={18} color="#007FFF" /><Text style={styles.stepText}>1. Informations générales et administrateur</Text></View>
    <Text style={styles.label}>Code agence</Text><TextInput value={agencyId} onChangeText={setAgencyId} autoCapitalize="characters" placeholder="KIVULINE-001" style={styles.input} returnKeyType="next" />
    <Text style={styles.label}>Nom commercial</Text><TextInput value={displayName} onChangeText={setDisplayName} placeholder="KivuLine Cargo" style={styles.input} returnKeyType="next" />
    <Text style={styles.label}>Raison sociale <Text style={styles.optional}>optionnel</Text></Text><TextInput value={legalName} onChangeText={setLegalName} placeholder="KivuLine Cargo SARL" style={styles.input} returnKeyType="next" />
    <Text style={styles.label}>E-mail de l’administrateur</Text><TextInput value={adminEmail} onChangeText={setAdminEmail} placeholder="admin@kivuline.cd" autoCapitalize="none" keyboardType="email-address" autoComplete="email" style={styles.input} returnKeyType="next" />
    <Text style={styles.label}>Téléphone professionnel <Text style={styles.optional}>optionnel</Text></Text><TextInput value={publicPhone} onChangeText={setPublicPhone} placeholder="+243 000 000 000" keyboardType="phone-pad" style={styles.input} returnKeyType="next" />
    <Text style={styles.label}>Site web <Text style={styles.optional}>optionnel</Text></Text><TextInput value={website} onChangeText={setWebsite} placeholder="https://www.kivuline.cd" autoCapitalize="none" keyboardType="url" style={styles.input} returnKeyType="next" />
    <View style={styles.step}><MaterialIcons name="link" size={18} color="#007FFF" /><Text style={styles.stepText}>2. Lien client et identité initiale</Text></View>
    <Text style={styles.label}>Lien de l’agence</Text><TextInput value={publicSlug} onChangeText={setPublicSlug} autoCapitalize="none" placeholder={suggestedSlug || "kivuline-cargo"} style={styles.input} returnKeyType="next" /><Text style={styles.hint}>Le lien sera créé sous la forme <Text style={styles.hintBold}>/agency/{publicSlug || suggestedSlug || "votre-agence"}</Text>. Un sous-domaine personnalisé pourra pointer vers ce même espace après la configuration DNS.</Text>
    <Text style={styles.label}>Couleur principale</Text><View style={styles.colorRow}>{colors.map((color) => <Pressable key={color} onPress={() => setPrimaryColor(color)} style={[styles.colorChoice, { backgroundColor: color }, primaryColor === color && styles.colorSelected]} accessibilityLabel={`Choisir la couleur ${color}`}><MaterialIcons name={primaryColor === color ? "check" : "circle"} size={17} color="#FFFFFF" /></Pressable>)}</View>
    <Text style={styles.label}>Horaires d’assistance <Text style={styles.optional}>optionnel</Text></Text><TextInput value={supportHours} onChangeText={setSupportHours} placeholder="Lun–Ven · 08:00–18:00" style={styles.input} returnKeyType="done" />
    <Pressable disabled={saving} onPress={() => void createAgency()} style={({ pressed }) => [styles.button, saving && styles.disabled, pressed && styles.pressed]}>{saving ? <ActivityIndicator color="#FFFFFF" /> : <><MaterialIcons name="add-business" size={19} color="#FFFFFF" /><Text style={styles.buttonText}>Créer l’espace et inviter l’administrateur</Text></>}</Pressable>
    {message ? <View style={[styles.message, result ? styles.successMessage : styles.errorMessage]}><MaterialIcons name={result ? "check-circle" : "error-outline"} size={17} color={result ? "#147A46" : "#B4232B"} /><Text style={[styles.messageText, { color: result ? "#147A46" : "#B4232B" }]}>{message}</Text></View> : null}
    {result ? <View style={styles.result}><Text style={styles.resultLabel}>LIEN D’AGENCE GÉNÉRÉ</Text><Text selectable style={styles.resultLink}>{result.link}</Text><Text style={styles.resultCopy}>Partagez ce lien aux clients. Ils créent un compte unique avec leur numéro WhatsApp et voient uniquement les colis rattachés à cette agence.</Text></View> : null}
  </ScrollView></KeyboardAvoidingView></ScreenContainer>;
}

const styles = StyleSheet.create({
  flex: { flex: 1 }, content: { padding: 20, paddingBottom: 34 }, center: { alignItems: "center", flex: 1, justifyContent: "center", padding: 26 }, denied: { color: "#65768B", fontSize: 13, lineHeight: 18, marginTop: 7, textAlign: "center" }, back: { alignItems: "center", flexDirection: "row", gap: 6, height: 40 }, backText: { color: "#062B5C", fontWeight: "800" }, eyebrow: { color: "#CE1126", fontSize: 10, fontWeight: "900", letterSpacing: 1.1, marginTop: 14 }, title: { color: "#062B5C", fontSize: 25, fontWeight: "900", marginTop: 5 }, subtitle: { color: "#65768B", fontSize: 13, lineHeight: 19, marginTop: 8 }, step: { alignItems: "center", backgroundColor: "#EDF6FF", borderRadius: 11, flexDirection: "row", gap: 8, marginTop: 20, padding: 11 }, stepText: { color: "#062B5C", fontSize: 12, fontWeight: "900" }, label: { color: "#062B5C", fontSize: 12, fontWeight: "800", marginBottom: 6, marginTop: 15 }, optional: { color: "#65768B", fontWeight: "600" }, input: { backgroundColor: "#FFFFFF", borderColor: "#C8DFF5", borderRadius: 12, borderWidth: 1, color: "#062B5C", height: 50, paddingHorizontal: 12 }, hint: { color: "#65768B", fontSize: 10, lineHeight: 15, marginTop: 6 }, hintBold: { color: "#003F87", fontWeight: "900" }, colorRow: { flexDirection: "row", gap: 10 }, colorChoice: { alignItems: "center", borderColor: "transparent", borderRadius: 14, borderWidth: 3, height: 36, justifyContent: "center", width: 36 }, colorSelected: { borderColor: "#062B5C" }, button: { alignItems: "center", backgroundColor: "#003F87", borderRadius: 13, flexDirection: "row", gap: 8, minHeight: 54, justifyContent: "center", marginTop: 23, paddingHorizontal: 12 }, buttonText: { color: "#FFFFFF", fontSize: 12, fontWeight: "900", textAlign: "center" }, message: { alignItems: "flex-start", borderRadius: 11, flexDirection: "row", gap: 8, marginTop: 15, padding: 11 }, successMessage: { backgroundColor: "#E8F8EF" }, errorMessage: { backgroundColor: "#FDEBEC" }, messageText: { flex: 1, fontSize: 11, lineHeight: 16 }, result: { backgroundColor: "#FFFFFF", borderColor: "#9FC0DF", borderRadius: 13, borderWidth: 1, marginTop: 12, padding: 13 }, resultLabel: { color: "#CE1126", fontSize: 10, fontWeight: "900", letterSpacing: 0.8 }, resultLink: { color: "#003F87", fontSize: 15, fontWeight: "900", marginTop: 5 }, resultCopy: { color: "#65768B", fontSize: 11, lineHeight: 16, marginTop: 8 }, disabled: { opacity: 0.55 }, pressed: { opacity: 0.82, transform: [{ scale: 0.99 }] },
});
