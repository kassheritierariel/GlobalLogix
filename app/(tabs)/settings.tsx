import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import { useRef, useState } from "react";
import { FlatList, Pressable, StyleSheet, Switch, Text, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { ScrollJumpControls } from "@/components/scroll-jump-controls";
import { useAuth } from "@/lib/auth-context";
import { getFirebaseIdToken } from "@/lib/firebase";
import { haptic } from "@/lib/haptics";
import { registerPushTokenWithApi, requestExpoPushToken } from "@/lib/notifications";
import { useThemeContext } from "@/lib/theme-provider";

const ITEMS = [
  { icon: "shield", title: "Accès Firebase", description: "Session et autorisations gérées par Custom Claims", color: "#235B9D" },
  { icon: "sync", title: "Télémétrie WebSocket", description: "Canal authentifié avec reconnexion automatique", color: "#147A46" },
  { icon: "dashboard", title: "Console Web centralisatrice", description: "Pilotage des agences, opérations, abonnements et canaux clients", color: "#007FFF", href: "/central-console", role: "super_admin" },
  { icon: "info-outline", title: "À propos", description: "Notre identité, nos fondations et les plateformes prises en charge", color: "#936200", href: "/about" },
];

export default function SettingsScreen() {
  const { user, logout, refreshClaims } = useAuth();
  const { colorScheme, setColorScheme } = useThemeContext();
  const listRef = useRef<FlatList<(typeof ITEMS)[number]>>(null);
  const [pushStatus, setPushStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [message, setMessage] = useState("");

  const signOut = async () => { await logout(); router.replace("/login" as never); };
  const enablePush = async () => {
    setPushStatus("loading"); setMessage("");
    try { const firebaseToken = await getFirebaseIdToken(true); if (!firebaseToken) throw new Error("Connectez-vous avant d’activer les alertes."); const expoToken = await requestExpoPushToken(); await registerPushTokenWithApi(expoToken, firebaseToken); haptic.success(); setPushStatus("ready"); setMessage("Ce terminal recevra les alertes d’expédition importantes."); }
    catch (error) { haptic.error(); setPushStatus("error"); setMessage(error instanceof Error ? error.message : "Activation des alertes impossible."); }
  };
  const refreshRole = async () => { try { await refreshClaims(); haptic.success(); setMessage("Les autorisations Firebase ont été actualisées."); } catch { haptic.error(); setMessage("Impossible d’actualiser les autorisations."); } };

  return <ScreenContainer className="bg-background"><View style={[styles.screen, { backgroundColor: colorScheme === "dark" ? "#091725" : "#F3F8FC" }]}><FlatList ref={listRef} data={ITEMS.filter((item) => !item.role || item.role === user?.role)} keyExtractor={(item) => item.title} contentContainerStyle={[styles.content, styles.contentWithScrollControls]} showsVerticalScrollIndicator
    ListHeaderComponent={<View><Text style={styles.eyebrow}>COMPTE ET APPLICATION</Text><Text style={styles.title}>Réglages</Text><View style={[styles.themeControl, { backgroundColor: colorScheme === "dark" ? "#183651" : "#EAF4FD", borderColor: colorScheme === "dark" ? "#315673" : "#B9D9F7" }]}><View><Text style={[styles.themeTitle, { color: colorScheme === "dark" ? "#F6FAFF" : "#062B5C" }]}>Mode sombre global</Text><Text style={[styles.themeText, { color: colorScheme === "dark" ? "#B6C8D9" : "#65768B" }]}>Appliqué à la navigation et aux espaces administrateur.</Text></View><Switch value={colorScheme === "dark"} onValueChange={(value) => setColorScheme(value ? "dark" : "light")} trackColor={{ false: "#9FB4C7", true: "#3E85C6" }} thumbColor={colorScheme === "dark" ? "#F7D116" : "#FFFFFF"} /></View><View style={styles.profile}><View style={styles.avatar}><Text style={styles.avatarText}>{(user?.displayName ?? "U").slice(0, 1).toUpperCase()}</Text></View><View><Text style={styles.profileName}>{user?.displayName}</Text><Text style={styles.profileMeta}>{user?.role} · {user?.agencyId ?? "Périmètre global"}</Text></View></View></View>}
    renderItem={({ item }) => item.href ? <Pressable onPress={() => router.push(item.href as never)} style={({ pressed }) => [styles.item, pressed && styles.pressed]}><View style={[styles.itemIcon, { backgroundColor: `${item.color}18` }]}><MaterialIcons name={item.icon as never} size={20} color={item.color} /></View><View style={styles.itemText}><Text style={styles.itemTitle}>{item.title}</Text><Text style={styles.itemDescription}>{item.description}</Text></View><MaterialIcons name="chevron-right" size={22} color="#718496" /></Pressable> : <View style={styles.item}><View style={[styles.itemIcon, { backgroundColor: `${item.color}18` }]}><MaterialIcons name={item.icon as never} size={20} color={item.color} /></View><View style={styles.itemText}><Text style={styles.itemTitle}>{item.title}</Text><Text style={styles.itemDescription}>{item.description}</Text></View></View>}
    ListFooterComponent={<View style={styles.footer}><Pressable onPress={() => router.push("/profile" as never)} style={({ pressed }) => [styles.profileButton, pressed && styles.pressed]}><MaterialIcons name="person" size={20} color="#0A2540" /><Text style={styles.profileButtonText}>Mon profil et mon mot de passe</Text></Pressable>{user?.role === "super_admin" ? <><Pressable onPress={() => router.push("/agency-directory" as never)} style={({ pressed }) => [styles.agencyButton, pressed && styles.pressed]}><MaterialIcons name="add-business" size={20} color="#FFFFFF" /><Text style={styles.agencyButtonText}>Créer une agence SaaS</Text></Pressable><Pressable onPress={() => router.push("/agency-registration-requests" as never)} style={({ pressed }) => [styles.analyticsButton, pressed && styles.pressed]}><MaterialIcons name="fact-check" size={20} color="#FFFFFF" /><Text style={styles.pushButtonText}>Valider les demandes d’agence</Text></Pressable><Pressable onPress={() => router.push("/agency-preview" as never)} style={({ pressed }) => [styles.previewButton, pressed && styles.pressed]}><MaterialIcons name="visibility" size={20} color="#062B5C" /><Text style={styles.previewButtonText}>Prévisualiser une agence</Text></Pressable></> : null}{user?.role === "agency_admin" ? <><Pressable onPress={() => router.push("/agency-settings" as never)} style={({ pressed }) => [styles.agencyButton, pressed && styles.pressed]}><MaterialIcons name="storefront" size={20} color="#FFFFFF" /><Text style={styles.agencyButtonText}>Marque et WhatsApp de l’agence</Text></Pressable><Pressable onPress={() => router.push("/agency-analytics" as never)} style={({ pressed }) => [styles.analyticsButton, pressed && styles.pressed]}><MaterialIcons name="insights" size={20} color="#FFFFFF" /><Text style={styles.pushButtonText}>Analytique colis et WhatsApp</Text></Pressable><Pressable onPress={() => router.push("/agency-clients" as never)} style={({ pressed }) => [styles.clientsButton, pressed && styles.pressed]}><MaterialIcons name="groups" size={20} color="#FFFFFF" /><Text style={styles.pushButtonText}>Gérer mes clients et colis</Text></Pressable></> : null}{user?.role === "agency_admin" || user?.role === "super_admin" ? <Pressable onPress={() => router.push("/subscription" as never)} style={({ pressed }) => [styles.billingButton, pressed && styles.pressed]}><MaterialIcons name="payments" size={20} color="#062B5C" /><Text style={styles.billingButtonText}>Plan, licences et facturation</Text></Pressable> : null}{user?.role === "agency_admin" ? <Pressable onPress={() => router.push("/team" as never)} style={({ pressed }) => [styles.teamButton, pressed && styles.pressed]}><MaterialIcons name="group" size={20} color="#FFFFFF" /><Text style={styles.pushButtonText}>Gérer l’équipe de l’agence</Text></Pressable> : null}<Pressable disabled={pushStatus === "loading"} onPress={() => void enablePush()} style={({ pressed }) => [styles.pushButton, pressed && styles.pressed, pushStatus === "loading" && styles.disabled]}><MaterialIcons name="notifications-active" size={20} color="#FFFFFF" /><Text style={styles.pushButtonText}>{pushStatus === "ready" ? "Alertes activées" : "Activer les alertes push"}</Text></Pressable><Pressable onPress={() => void refreshRole()} style={({ pressed }) => [styles.claimsButton, pressed && styles.pressed]}><MaterialIcons name="verified-user" size={19} color="#0A2540" /><Text style={styles.claimsButtonText}>Actualiser mes autorisations</Text></Pressable>{message ? <Text style={[styles.message, pushStatus === "error" && styles.messageError]}>{message}</Text> : null}<Pressable onPress={() => { haptic.medium(); void signOut(); }} style={({ pressed }) => [styles.logout, pressed && styles.pressed]}><MaterialIcons name="logout" size={20} color="#C43D3D" /><Text style={styles.logoutText}>Se déconnecter</Text></Pressable><Text style={styles.footerText}>Les alertes push exigent un appareil physique et une build de développement ou de publication ; elles ne sont pas prises en charge par Expo Go Android.</Text></View>}
  /><ScrollJumpControls onTop={() => listRef.current?.scrollToOffset({ offset: 0, animated: true })} onBottom={() => listRef.current?.scrollToEnd({ animated: true })} /></View></ScreenContainer>;
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 20, paddingBottom: 30 },
  contentWithScrollControls: { paddingBottom: 88 },
  themeControl: { alignItems: "center", borderRadius: 13, borderWidth: 1, flexDirection: "row", justifyContent: "space-between", marginTop: 15, padding: 12 },
  themeTitle: { fontSize: 13, fontWeight: "900" },
  themeText: { fontSize: 10, marginTop: 3 },
  eyebrow: { color: "#FF6B35", fontSize: 11, fontWeight: "800", letterSpacing: 1 },
  title: { color: "#0A2540", fontSize: 28, fontWeight: "800", marginTop: 5 },
  profile: { alignItems: "center", backgroundColor: "#FFFFFF", borderColor: "#D9E2EC", borderRadius: 18, borderWidth: 1, flexDirection: "row", marginBottom: 18, marginTop: 22, padding: 16 },
  avatar: { alignItems: "center", backgroundColor: "#0A2540", borderRadius: 24, height: 48, justifyContent: "center", marginRight: 12, width: 48 },
  avatarText: { color: "#FFFFFF", fontSize: 19, fontWeight: "800" },
  profileName: { color: "#0A2540", fontSize: 16, fontWeight: "800" },
  profileMeta: { color: "#718496", fontSize: 12, marginTop: 4 },
  item: { alignItems: "center", backgroundColor: "#FFFFFF", borderColor: "#D9E2EC", borderRadius: 16, borderWidth: 1, flexDirection: "row", marginBottom: 10, padding: 14 },
  itemIcon: { alignItems: "center", borderRadius: 12, height: 42, justifyContent: "center", marginRight: 12, width: 42 },
  itemText: { flex: 1 },
  itemTitle: { color: "#0A2540", fontSize: 14, fontWeight: "800" },
  itemDescription: { color: "#718496", fontSize: 12, lineHeight: 18, marginTop: 4 },
  footer: { marginTop: 20 },
  profileButton: { alignItems: "center", backgroundColor: "#FFFFFF", borderColor: "#D9E2EC", borderRadius: 14, borderWidth: 1, flexDirection: "row", height: 52, justifyContent: "center", marginBottom: 10 },
  profileButtonText: { color: "#0A2540", fontSize: 14, fontWeight: "800", marginLeft: 8 },
  agencyButton: { alignItems: "center", backgroundColor: "#003F87", borderRadius: 14, flexDirection: "row", height: 52, justifyContent: "center", marginBottom: 10 },
  agencyButtonText: { color: "#FFFFFF", fontSize: 14, fontWeight: "900", marginLeft: 8 },
  previewButton: { alignItems: "center", backgroundColor: "#E7F3FF", borderColor: "#B9D9F7", borderRadius: 14, borderWidth: 1, flexDirection: "row", height: 52, justifyContent: "center", marginBottom: 10 },
  previewButtonText: { color: "#062B5C", fontSize: 14, fontWeight: "900", marginLeft: 8 },
  billingButton: { alignItems: "center", backgroundColor: "#F7D116", borderRadius: 14, flexDirection: "row", height: 52, justifyContent: "center", marginBottom: 10 },
  billingButtonText: { color: "#062B5C", fontSize: 14, fontWeight: "900", marginLeft: 8 },
  teamButton: { alignItems: "center", backgroundColor: "#235B9D", borderRadius: 14, flexDirection: "row", height: 52, justifyContent: "center", marginBottom: 10 },
  analyticsButton: { alignItems: "center", backgroundColor: "#6D28D9", borderRadius: 14, flexDirection: "row", height: 52, justifyContent: "center", marginBottom: 10 },
  clientsButton: { alignItems: "center", backgroundColor: "#0F766E", borderRadius: 14, flexDirection: "row", height: 52, justifyContent: "center", marginBottom: 10 },
  pushButton: { alignItems: "center", backgroundColor: "#FF6B35", borderRadius: 14, flexDirection: "row", height: 52, justifyContent: "center" },
  pushButtonText: { color: "#FFFFFF", fontSize: 14, fontWeight: "800", marginLeft: 8 },
  claimsButton: { alignItems: "center", backgroundColor: "#FFFFFF", borderColor: "#D9E2EC", borderRadius: 14, borderWidth: 1, flexDirection: "row", height: 50, justifyContent: "center", marginTop: 10 },
  claimsButtonText: { color: "#0A2540", fontSize: 14, fontWeight: "800", marginLeft: 7 },
  message: { color: "#147A46", fontSize: 12, lineHeight: 18, marginTop: 12, textAlign: "center" },
  messageError: { color: "#C43D3D" },
  logout: { alignItems: "center", backgroundColor: "#FBE8E8", borderRadius: 14, flexDirection: "row", height: 50, justifyContent: "center", marginTop: 16 },
  logoutText: { color: "#C43D3D", fontSize: 14, fontWeight: "800", marginLeft: 8 },
  footerText: { color: "#718496", fontSize: 12, lineHeight: 18, marginTop: 18, textAlign: "center" },
  pressed: { opacity: 0.78, transform: [{ scale: 0.985 }] },
  disabled: { opacity: 0.62 },
});
