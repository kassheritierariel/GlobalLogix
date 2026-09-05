import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/lib/auth-context";
import { createAgencyUser, fetchAgencyUsers, sendAgencyUserInvitation, setAgencyUserStatus, updateAgencyUserRole, type AgencyManagedUser } from "@/lib/logistics-api";
import { haptic } from "@/lib/haptics";

type ManagedRole = "staff" | "viewer";

export default function TeamScreen() {
  const { user } = useAuth();
  const [members, setMembers] = useState<AgencyManagedUser[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<ManagedRole>("staff");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const agencyId = user?.agencyId ?? "";
  const canManage = user?.role === "agency_admin" && Boolean(agencyId);
  const visibleMembers = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase("fr-FR");
    if (!query) return members;
    return members.filter((member) => [member.email, member.role, member.disabled ? "retiré" : "actif"].some((value) => value?.toLocaleLowerCase("fr-FR").includes(query)));
  }, [members, searchQuery]);

  const loadMembers = useCallback(async () => {
    if (!canManage) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const result = await fetchAgencyUsers();
      setMembers(result.users);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Chargement de l’équipe impossible.");
    } finally {
      setLoading(false);
    }
  }, [canManage]);

  useEffect(() => { void loadMembers(); }, [loadMembers]);

  const runAction = async (action: () => Promise<void>, successMessage: string) => {
    try {
      setSaving(true);
      setError("");
      await action();
      setMessage(successMessage);
      haptic.success();
      await loadMembers();
    } catch (actionError) {
      haptic.error();
      setError(actionError instanceof Error ? actionError.message : "Action impossible.");
    } finally {
      setSaving(false);
    }
  };

  const createMember = async () => {
    if (!email.trim()) {
      setError("Saisissez une adresse e-mail professionnelle.");
      return;
    }
    await runAction(async () => {
      const result = await createAgencyUser({ email: email.trim(), role });
      setEmail("");
      setMessage(`Compte ${role} créé. Invitation demandée pour ${result.invitation.email}.`);
    }, "Collaborateur ajouté à l’équipe.");
  };

  const resendInvitation = async (member: AgencyManagedUser) => {
    await runAction(() => sendAgencyUserInvitation(member.uid), `Nouvelle invitation demandée pour ${member.email ?? "ce collaborateur"}.`);
  };

  const changeRole = (member: AgencyManagedUser) => {
    const nextRole: ManagedRole = member.role === "staff" ? "viewer" : "staff";
    Alert.alert("Modifier le rôle", `Attribuer le rôle ${nextRole} à ${member.email ?? "ce collaborateur"} ?`, [
      { text: "Annuler", style: "cancel" },
      { text: "Confirmer", onPress: () => void runAction(() => updateAgencyUserRole(member.uid, nextRole), `${member.email ?? "Le collaborateur"} est désormais ${nextRole}.`) },
    ]);
  };

  const toggleMemberRemoval = (member: AgencyManagedUser) => {
    const nextDisabled = !member.disabled;
    const title = nextDisabled ? "Retirer de l’équipe" : "Réactiver le collaborateur";
    const description = nextDisabled
      ? `${member.email ?? "Ce collaborateur"} sera désactivé et ne pourra plus accéder aux opérations. Vous pourrez le réactiver ultérieurement.`
      : `Rétablir les accès opérationnels de ${member.email ?? "ce collaborateur"} ?`;
    Alert.alert(title, description, [
      { text: "Annuler", style: "cancel" },
      { text: nextDisabled ? "Retirer" : "Réactiver", style: nextDisabled ? "destructive" : "default", onPress: () => void runAction(() => setAgencyUserStatus(member.uid, nextDisabled), nextDisabled ? "Collaborateur retiré de l’équipe. Son compte reste récupérable." : "Collaborateur réactivé.") },
    ]);
  };

  const header = useMemo(() => (
    <View>
      <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.back, pressed && styles.pressed]}>
        <MaterialIcons name="arrow-back" size={20} color="#0A2540" /><Text style={styles.backText}>Réglages</Text>
      </Pressable>
      <Text style={styles.eyebrow}>ADMINISTRATION D’AGENCE</Text>
      <Text style={styles.title}>Mon équipe</Text>
      <Text style={styles.subtitle}>Gérez les accès opérationnels limités à l’agence {agencyId || "non définie"}.</Text>
      {canManage ? <View style={styles.createBox}>
        <Text style={styles.createTitle}>Ajouter un collaborateur</Text>
        <Text style={styles.createHint}>Chaque collaborateur reçoit une invitation Firebase pour définir son mot de passe.</Text>
        <TextInput value={email} onChangeText={setEmail} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" placeholder="prenom.nom@entreprise.com" placeholderTextColor="#718496" style={styles.input} returnKeyType="done" onSubmitEditing={() => void createMember()} />
        <View style={styles.roleRow}>
          {(["staff", "viewer"] as const).map((itemRole) => <Pressable key={itemRole} onPress={() => setRole(itemRole)} style={({ pressed }) => [styles.roleButton, role === itemRole && styles.roleButtonSelected, pressed && styles.pressed]}><MaterialIcons name={itemRole === "staff" ? "build" : "visibility"} size={18} color={role === itemRole ? "#FFFFFF" : "#0A2540"} /><Text style={[styles.roleText, role === itemRole && styles.roleTextSelected]}>{itemRole === "staff" ? "Staff" : "Viewer"}</Text></Pressable>)}
        </View>
        <Pressable disabled={saving} onPress={() => void createMember()} style={({ pressed }) => [styles.createButton, (pressed || saving) && styles.pressed, saving && styles.disabled]}><MaterialIcons name="person-add" size={20} color="#FFFFFF" /><Text style={styles.createButtonText}>{saving ? "Traitement…" : "Créer et inviter"}</Text></Pressable>
      </View> : <View style={styles.denied}><MaterialIcons name="lock" size={24} color="#C43D3D" /><Text style={styles.deniedTitle}>Accès réservé</Text><Text style={styles.deniedText}>Seul l’administrateur de cette agence peut gérer les comptes staff et viewer.</Text></View>}
      {message ? <Text style={styles.message}>{message}</Text> : null}{error ? <Text style={styles.error}>{error}</Text> : null}
      {canManage ? <View style={teamSearchStyles.box}><MaterialIcons name="search" size={19} color="#718496" /><TextInput value={searchQuery} onChangeText={setSearchQuery} autoCapitalize="none" autoCorrect={false} placeholder="Rechercher par e-mail, rôle ou statut" placeholderTextColor="#718496" style={teamSearchStyles.input} /><Text style={teamSearchStyles.count}>{visibleMembers.length}/{members.length}</Text></View> : null}
      <Text style={styles.sectionTitle}>COLLABORATEURS DE L’AGENCE</Text>
    </View>
  ), [agencyId, canManage, email, error, members.length, message, role, saving, searchQuery, visibleMembers.length]);

  if (loading) return <ScreenContainer className="bg-background"><View style={styles.loader}><ActivityIndicator color="#FF6B35" /><Text style={styles.loaderText}>Chargement de l’équipe…</Text></View></ScreenContainer>;

  return <ScreenContainer className="bg-background"><FlatList data={visibleMembers} keyExtractor={(member) => member.uid} contentContainerStyle={styles.content} ListHeaderComponent={header} refreshing={loading} onRefresh={() => void loadMembers()} ListEmptyComponent={canManage ? <View style={styles.empty}><MaterialIcons name="group" size={30} color="#718496" /><Text style={styles.emptyTitle}>{searchQuery ? "Aucun résultat" : "Aucun collaborateur"}</Text><Text style={styles.emptyText}>{searchQuery ? "Essayez une autre adresse e-mail, un rôle ou un statut." : "Créez un premier accès staff ou viewer pour cette agence."}</Text></View> : null} renderItem={({ item }) => <View style={[styles.member, item.disabled && styles.memberDisabled]}><View style={styles.memberAvatar}><Text style={styles.memberAvatarText}>{(item.email ?? "U").slice(0, 1).toUpperCase()}</Text></View><View style={styles.memberInfo}><View style={styles.memberTop}><Text numberOfLines={1} style={styles.memberEmail}>{item.email ?? "Adresse non disponible"}</Text><View style={[styles.badge, item.role === "staff" ? styles.badgeStaff : styles.badgeViewer]}><Text style={styles.badgeText}>{item.role === "staff" ? "STAFF" : "VIEWER"}</Text></View></View><Text style={styles.memberMeta}>{item.disabled ? "Compte retiré — réactivation possible" : "Accès actif"} · {item.agencyId}</Text><View style={styles.actions}><Pressable disabled={saving} onPress={() => void resendInvitation(item)} style={({ pressed }) => [styles.action, pressed && styles.pressed, saving && styles.disabled]}><MaterialIcons name="mail-outline" size={17} color="#235B9D" /><Text style={styles.actionText}>Invitation</Text></Pressable><Pressable disabled={saving || item.disabled} onPress={() => changeRole(item)} style={({ pressed }) => [styles.action, pressed && styles.pressed, (saving || item.disabled) && styles.disabled]}><MaterialIcons name="swap-horiz" size={17} color="#235B9D" /><Text style={styles.actionText}>Rôle</Text></Pressable><Pressable disabled={saving} onPress={() => toggleMemberRemoval(item)} style={({ pressed }) => [styles.action, item.disabled ? styles.activateAction : styles.disableAction, pressed && styles.pressed, saving && styles.disabled]}><MaterialIcons name={item.disabled ? "lock-open" : "person-remove"} size={17} color={item.disabled ? "#147A46" : "#C43D3D"} /><Text style={[styles.actionText, item.disabled ? styles.activateText : styles.disableText]}>{item.disabled ? "Réactiver" : "Retirer"}</Text></Pressable></View></View></View>} /></ScreenContainer>;
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 32 }, back: { alignItems: "center", flexDirection: "row", marginBottom: 24 }, backText: { color: "#0A2540", fontSize: 14, fontWeight: "800", marginLeft: 6 }, eyebrow: { color: "#FF6B35", fontSize: 11, fontWeight: "800", letterSpacing: 1 }, title: { color: "#0A2540", fontSize: 29, fontWeight: "800", marginTop: 5 }, subtitle: { color: "#718496", fontSize: 13, lineHeight: 19, marginTop: 8 }, createBox: { backgroundColor: "#FFFFFF", borderColor: "#D9E2EC", borderRadius: 18, borderWidth: 1, marginTop: 20, padding: 16 }, createTitle: { color: "#0A2540", fontSize: 16, fontWeight: "800" }, createHint: { color: "#718496", fontSize: 12, lineHeight: 18, marginTop: 5 }, input: { backgroundColor: "#F7FAFC", borderColor: "#D9E2EC", borderRadius: 12, borderWidth: 1, color: "#0A2540", fontSize: 14, height: 48, marginTop: 14, paddingHorizontal: 13 }, roleRow: { flexDirection: "row", gap: 10, marginTop: 12 }, roleButton: { alignItems: "center", backgroundColor: "#FFFFFF", borderColor: "#D9E2EC", borderRadius: 11, borderWidth: 1, flex: 1, flexDirection: "row", height: 42, justifyContent: "center" }, roleButtonSelected: { backgroundColor: "#0A2540", borderColor: "#0A2540" }, roleText: { color: "#0A2540", fontSize: 13, fontWeight: "800", marginLeft: 6 }, roleTextSelected: { color: "#FFFFFF" }, createButton: { alignItems: "center", backgroundColor: "#FF6B35", borderRadius: 12, flexDirection: "row", height: 50, justifyContent: "center", marginTop: 14 }, createButtonText: { color: "#FFFFFF", fontSize: 14, fontWeight: "800", marginLeft: 8 }, sectionTitle: { color: "#718496", fontSize: 11, fontWeight: "800", letterSpacing: 1, marginBottom: 10, marginTop: 24 }, member: { alignItems: "flex-start", backgroundColor: "#FFFFFF", borderColor: "#D9E2EC", borderRadius: 16, borderWidth: 1, flexDirection: "row", marginBottom: 10, padding: 14 }, memberDisabled: { opacity: 0.68 }, memberAvatar: { alignItems: "center", backgroundColor: "#E8F0F8", borderRadius: 18, height: 36, justifyContent: "center", marginRight: 10, width: 36 }, memberAvatarText: { color: "#235B9D", fontSize: 14, fontWeight: "800" }, memberInfo: { flex: 1 }, memberTop: { alignItems: "center", flexDirection: "row", gap: 8 }, memberEmail: { color: "#0A2540", flex: 1, fontSize: 13, fontWeight: "800" }, badge: { borderRadius: 99, paddingHorizontal: 7, paddingVertical: 3 }, badgeStaff: { backgroundColor: "#E9F5ED" }, badgeViewer: { backgroundColor: "#E8F0F8" }, badgeText: { color: "#0A2540", fontSize: 9, fontWeight: "800", letterSpacing: 0.4 }, memberMeta: { color: "#718496", fontSize: 11, marginTop: 5 }, actions: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 }, action: { alignItems: "center", backgroundColor: "#F7FAFC", borderRadius: 9, flexDirection: "row", height: 34, justifyContent: "center", paddingHorizontal: 9 }, actionText: { color: "#235B9D", fontSize: 11, fontWeight: "800", marginLeft: 4 }, disableAction: { backgroundColor: "#FBE8E8" }, disableText: { color: "#C43D3D" }, activateAction: { backgroundColor: "#E9F5ED" }, activateText: { color: "#147A46" }, empty: { alignItems: "center", backgroundColor: "#FFFFFF", borderColor: "#D9E2EC", borderRadius: 16, borderWidth: 1, padding: 28 }, emptyTitle: { color: "#0A2540", fontSize: 15, fontWeight: "800", marginTop: 9 }, emptyText: { color: "#718496", fontSize: 12, lineHeight: 18, marginTop: 5, textAlign: "center" }, denied: { alignItems: "center", backgroundColor: "#FBE8E8", borderRadius: 16, marginTop: 20, padding: 20 }, deniedTitle: { color: "#C43D3D", fontSize: 15, fontWeight: "800", marginTop: 8 }, deniedText: { color: "#A13434", fontSize: 12, lineHeight: 18, marginTop: 5, textAlign: "center" }, message: { color: "#147A46", fontSize: 12, lineHeight: 18, marginTop: 12 }, error: { color: "#C43D3D", fontSize: 12, lineHeight: 18, marginTop: 12 }, loader: { alignItems: "center", flex: 1, justifyContent: "center" }, loaderText: { color: "#718496", fontSize: 13, marginTop: 10 }, pressed: { opacity: 0.78, transform: [{ scale: 0.985 }] }, disabled: { opacity: 0.6 },
});

const teamSearchStyles = StyleSheet.create({
  box: { alignItems: "center", backgroundColor: "#FFFFFF", borderColor: "#D9E2EC", borderRadius: 12, borderWidth: 1, flexDirection: "row", height: 46, marginTop: 16, paddingHorizontal: 12 },
  input: { color: "#0A2540", flex: 1, fontSize: 13, height: 44, marginLeft: 8 },
  count: { color: "#718496", fontSize: 11, fontWeight: "800" },
});
