import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Image, Pressable, StyleSheet, Text, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/lib/auth-context";
import { fetchAgencyDashboardPreview, fetchPreviewAgencies, type AgencyPreviewProfile, type AgencyPreviewSubscription } from "@/lib/logistics-api";
import type { Shipment } from "@/lib/types";

type AgencyOption = AgencyPreviewProfile & { subscription: AgencyPreviewSubscription };

function operationalMetrics(shipments: Shipment[]) {
  const inTransit = shipments.filter((shipment) => shipment.status === "in-transit").length;
  const atRisk = shipments.filter((shipment) => shipment.status === "delayed" || shipment.status === "customs").length;
  const delivered = shipments.filter((shipment) => shipment.status === "delivered").length;
  const active = Math.max(shipments.length - delivered, 0);
  return { inTransit, atRisk, delivered, health: active === 0 ? 100 : Math.max(0, Math.round(((active - atRisk) / active) * 100)) };
}

function planLabel(subscription: AgencyPreviewSubscription) {
  if (!subscription) return "Sans souscription";
  return subscription.planId === "operations" ? "Operations" : subscription.planId === "enterprise" ? "Enterprise" : "Starter";
}

export default function AgencyPreviewScreen() {
  const { user } = useAuth();
  const { agencyId: requestedAgencyId } = useLocalSearchParams<{ agencyId?: string }>();
  const [agencies, setAgencies] = useState<AgencyOption[]>([]);
  const [agencyId, setAgencyId] = useState<string | null>(null);
  const [profile, setProfile] = useState<AgencyPreviewProfile | null>(null);
  const [subscription, setSubscription] = useState<AgencyPreviewSubscription>(null);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const loadPreview = useCallback(async (selectedAgencyId: string) => {
    try {
      setLoading(true);
      setMessage("");
      const preview = await fetchAgencyDashboardPreview(selectedAgencyId);
      setAgencyId(preview.agencyId);
      setProfile(preview.profile);
      setSubscription(preview.subscription);
      setShipments(preview.shipments);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Prévisualisation indisponible.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role !== "super_admin") return;
    void (async () => {
      try {
        setLoading(true);
        const result = await fetchPreviewAgencies();
        setAgencies(result.agencies);
        const requested = result.agencies.find((agency) => agency.agencyId === requestedAgencyId);
        if (requested ?? result.agencies[0]) await loadPreview((requested ?? result.agencies[0]).agencyId);
        else setLoading(false);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Liste des agences indisponible.");
        setLoading(false);
      }
    })();
  }, [loadPreview, requestedAgencyId, user?.role]);

  const metrics = useMemo(() => operationalMetrics(shipments), [shipments]);
  const accent = /^#[0-9A-F]{6}$/i.test(profile?.primaryColor ?? "") ? profile?.primaryColor! : "#007FFF";

  if (user?.role !== "super_admin") {
    return <ScreenContainer><View style={styles.denied}><MaterialIcons name="lock" size={34} color="#CE1126" /><Text style={styles.deniedTitle}>Accès éditeur requis</Text><Text style={styles.deniedText}>Seul le super administrateur peut prévisualiser l’espace d’une autre agence.</Text></View></ScreenContainer>;
  }

  return <ScreenContainer><FlatList data={shipments.slice(0, 5)} keyExtractor={(item) => item.id} contentContainerStyle={styles.content} ListHeaderComponent={<>
    <Pressable onPress={() => router.back()} style={styles.back}><MaterialIcons name="arrow-back" size={20} color="#062B5C" /><Text style={styles.backText}>Réglages</Text></Pressable>
    <Text style={styles.eyebrow}>ÉDITEUR GLOBALLLOGIX</Text><Text style={styles.title}>Prévisualisation d’agence</Text><Text style={styles.subtitle}>Lecture seule : vous voyez le tableau de bord, la marque et les données de l’agence sélectionnée, sans modifier son périmètre.</Text>
    <Text style={styles.sectionLabel}>SÉLECTIONNER UNE AGENCE</Text>
    <FlatList horizontal data={agencies} keyExtractor={(item) => item.agencyId} showsHorizontalScrollIndicator={false} contentContainerStyle={styles.agencyChoices} renderItem={({ item }) => <Pressable onPress={() => void loadPreview(item.agencyId)} style={[styles.agencyChoice, agencyId === item.agencyId && { borderColor: accent, backgroundColor: "#F0FDFA" }]}><Text numberOfLines={1} style={styles.agencyChoiceText}>{item.displayName}</Text><Text style={styles.agencyChoiceCode}>{item.agencyId}</Text></Pressable>} />
    {loading ? <View style={styles.loading}><ActivityIndicator color={accent} /><Text style={styles.loadingText}>Chargement de l’espace agence…</Text></View> : null}
    {message ? <Text style={styles.message}>{message}</Text> : null}
    {profile && !loading ? <>
      <View style={[styles.previewHero, { borderColor: accent }]}><View style={[styles.accentBar, { backgroundColor: accent }]} /><View style={styles.brandTop}><View style={[styles.logo, { borderColor: accent }]}>{profile.logoUrl ? <Image source={{ uri: profile.logoUrl }} style={styles.logoImage} /> : <MaterialIcons name="business" size={28} color={accent} />}</View><View style={styles.brandCopy}><Text style={styles.previewLabel}>APERÇU DU TABLEAU DE BORD</Text><Text style={styles.brandName}>{profile.displayName}</Text><Text style={styles.brandCode}>{profile.agencyId} · {planLabel(subscription)} {subscription?.status === "trial" ? "· Essai" : ""}</Text></View></View><Text style={styles.previewHint}>Les données affichées restent strictement limitées à cette agence. Aucun secret Meta ou WhatsApp n’est inclus.</Text></View>
      <View style={styles.metricsRow}>{[{ label: "En transit", value: metrics.inTransit, icon: "local-shipping", tone: accent }, { label: "À risque", value: metrics.atRisk, icon: "priority-high", tone: "#CE1126" }, { label: "Livrées", value: metrics.delivered, icon: "task-alt", tone: "#147A46" }].map((item) => <View key={item.label} style={styles.metric}><MaterialIcons name={item.icon as "local-shipping"} size={18} color={item.tone} /><Text style={styles.metricValue}>{item.value}</Text><Text style={styles.metricLabel}>{item.label}</Text></View>)}</View>
      <View style={styles.health}><View><Text style={[styles.healthEyebrow, { color: accent }]}>SANTÉ OPÉRATIONNELLE</Text><Text style={styles.healthTitle}>{metrics.health >= 85 ? "Flux maîtrisé" : metrics.health >= 60 ? "Surveillance renforcée" : "Intervention prioritaire"}</Text></View><Text style={[styles.healthValue, { color: accent }]}>{metrics.health}<Text style={styles.healthTotal}>/100</Text></Text></View><View style={styles.track}><View style={[styles.fill, { backgroundColor: metrics.health < 60 ? "#CE1126" : accent, width: `${metrics.health}%` }]} /></View>
      <View style={styles.scopeNotice}><MaterialIcons name="visibility" size={18} color="#062B5C" /><Text style={styles.scopeText}>Mode éditeur actif : ce tableau est consultable uniquement par le super administrateur et n’ouvre aucun accès aux identifiants de l’agence.</Text></View>
      <Text style={styles.queueTitle}>Aperçu de la file opérationnelle</Text>
    </> : null}
  </>} ListEmptyComponent={!loading && profile ? <View style={styles.empty}><MaterialIcons name="inventory-2" size={25} color={accent} /><Text style={styles.emptyTitle}>Aucune expédition dans cette agence</Text><Text style={styles.emptyText}>Le cadre de marque et la santé opérationnelle sont prêts pour ses premières données.</Text></View> : null} renderItem={({ item }) => <View style={styles.shipment}><View style={[styles.shipmentIcon, { backgroundColor: `${accent}18` }]}><MaterialIcons name={item.mode === "air" ? "flight" : item.mode === "sea" ? "directions-boat" : "local-shipping"} size={19} color={accent} /></View><View style={styles.shipmentCopy}><Text style={styles.shipmentNumber}>{item.trackingNumber}</Text><Text numberOfLines={1} style={styles.shipmentRoute}>{item.origin} → {item.destination}</Text></View><Text style={styles.shipmentProgress}>{item.progress}%</Text></View>} /></ScreenContainer>;
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 34 }, denied: { alignItems: "center", flex: 1, justifyContent: "center", padding: 26 }, deniedTitle: { color: "#062B5C", fontSize: 21, fontWeight: "900", marginTop: 12 }, deniedText: { color: "#65768B", fontSize: 13, lineHeight: 19, marginTop: 6, textAlign: "center" }, back: { alignItems: "center", flexDirection: "row", gap: 6, height: 40 }, backText: { color: "#062B5C", fontWeight: "800" }, eyebrow: { color: "#CE1126", fontSize: 11, fontWeight: "900", letterSpacing: 1.1, marginTop: 14 }, title: { color: "#062B5C", fontSize: 25, fontWeight: "900", marginTop: 5 }, subtitle: { color: "#65768B", fontSize: 13, lineHeight: 19, marginTop: 8 }, sectionLabel: { color: "#65768B", fontSize: 10, fontWeight: "900", letterSpacing: 0.9, marginTop: 22 }, agencyChoices: { gap: 8, paddingBottom: 3, paddingTop: 9 }, agencyChoice: { backgroundColor: "#FFFFFF", borderColor: "#C8DFF5", borderRadius: 12, borderWidth: 1, maxWidth: 180, minWidth: 142, paddingHorizontal: 12, paddingVertical: 10 }, agencyChoiceText: { color: "#062B5C", fontSize: 12, fontWeight: "900" }, agencyChoiceCode: { color: "#65768B", fontSize: 9, fontWeight: "800", marginTop: 4 }, loading: { alignItems: "center", flexDirection: "row", gap: 9, paddingVertical: 28 }, loadingText: { color: "#65768B", fontSize: 12, fontWeight: "700" }, message: { color: "#CE1126", fontSize: 12, lineHeight: 18, marginTop: 16 }, previewHero: { backgroundColor: "#FFFFFF", borderRadius: 18, borderWidth: 1, marginTop: 18, overflow: "hidden", padding: 16 }, accentBar: { height: 4, left: 0, position: "absolute", right: 0, top: 0 }, brandTop: { alignItems: "center", flexDirection: "row", marginTop: 4 }, logo: { alignItems: "center", backgroundColor: "#FFFFFF", borderRadius: 15, borderWidth: 1, height: 58, justifyContent: "center", overflow: "hidden", width: 58 }, logoImage: { height: 52, resizeMode: "contain", width: 52 }, brandCopy: { flex: 1, marginLeft: 12 }, previewLabel: { color: "#65768B", fontSize: 9, fontWeight: "900", letterSpacing: 0.7 }, brandName: { color: "#062B5C", fontSize: 19, fontWeight: "900", marginTop: 4 }, brandCode: { color: "#65768B", fontSize: 10, fontWeight: "800", marginTop: 4 }, previewHint: { color: "#415F80", fontSize: 11, lineHeight: 16, marginTop: 14 }, metricsRow: { flexDirection: "row", gap: 9, marginTop: 14 }, metric: { alignItems: "flex-start", backgroundColor: "#FFFFFF", borderColor: "#D9E2EC", borderRadius: 14, borderWidth: 1, flex: 1, minHeight: 94, padding: 11 }, metricValue: { color: "#062B5C", fontSize: 22, fontWeight: "900", marginTop: 7 }, metricLabel: { color: "#65768B", fontSize: 10, fontWeight: "800", marginTop: 2 }, health: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginTop: 17 }, healthEyebrow: { fontSize: 10, fontWeight: "900", letterSpacing: 0.7 }, healthTitle: { color: "#062B5C", fontSize: 16, fontWeight: "900", marginTop: 4 }, healthValue: { fontSize: 25, fontWeight: "900" }, healthTotal: { color: "#65768B", fontSize: 11 }, track: { backgroundColor: "#D6E8EA", borderRadius: 99, height: 8, marginTop: 11, overflow: "hidden" }, fill: { borderRadius: 99, height: 8 }, scopeNotice: { alignItems: "flex-start", backgroundColor: "#E7F3FF", borderColor: "#B9D9F7", borderRadius: 13, borderWidth: 1, flexDirection: "row", gap: 9, marginTop: 16, padding: 12 }, scopeText: { color: "#415F80", flex: 1, fontSize: 11, lineHeight: 16 }, queueTitle: { color: "#062B5C", fontSize: 17, fontWeight: "900", marginBottom: 10, marginTop: 22 }, empty: { alignItems: "center", backgroundColor: "#FFFFFF", borderColor: "#D9E2EC", borderRadius: 16, borderWidth: 1, padding: 22 }, emptyTitle: { color: "#062B5C", fontSize: 14, fontWeight: "900", marginTop: 10 }, emptyText: { color: "#65768B", fontSize: 12, lineHeight: 17, marginTop: 5, textAlign: "center" }, shipment: { alignItems: "center", backgroundColor: "#FFFFFF", borderColor: "#D9E2EC", borderRadius: 14, borderWidth: 1, flexDirection: "row", marginBottom: 9, padding: 12 }, shipmentIcon: { alignItems: "center", borderRadius: 11, height: 38, justifyContent: "center", width: 38 }, shipmentCopy: { flex: 1, marginLeft: 10 }, shipmentNumber: { color: "#062B5C", fontSize: 12, fontWeight: "900" }, shipmentRoute: { color: "#65768B", fontSize: 10, marginTop: 3 }, shipmentProgress: { color: "#062B5C", fontSize: 12, fontWeight: "900" },
});
