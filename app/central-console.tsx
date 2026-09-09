import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Image, Pressable, StyleSheet, Text, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { exportCentralConsoleCsv, exportCentralConsolePdf, type CentralConsoleExportRow } from "@/lib/central-console-export";
import { useAuth } from "@/lib/auth-context";
import { activateAgencyWhatsAppFromConsole, fetchCentralAnalytics, fetchPreviewAgencies, validateAgencyWhatsAppMetaFromConsole, type AgencyPreviewProfile, type AgencyPreviewSubscription, type AgencyWhatsAppActivity, type AgencyWhatsAppChannelSummary, type CentralAgencyAnalytics, type CentralAnalyticsPeriod } from "@/lib/logistics-api";

type CentralAgency = AgencyPreviewProfile & { subscription: AgencyPreviewSubscription; whatsApp: AgencyWhatsAppChannelSummary; latestWhatsAppActivity: AgencyWhatsAppActivity };
type FeedbackTone = "success" | "error" | "warning" | "neutral";
type AgencyFeedback = Record<string, { tone: FeedbackTone; message: string }>;

const PERIODS: Array<{ id: CentralAnalyticsPeriod; label: string }> = [
  { id: "7d", label: "7 jours" }, { id: "30d", label: "30 jours" }, { id: "90d", label: "90 jours" }, { id: "all", label: "Tout" },
];

function labelPlan(subscription: AgencyPreviewSubscription) {
  if (!subscription) return "Sans abonnement";
  const plan = subscription.planId === "operations" ? "Operations" : subscription.planId === "enterprise" ? "Enterprise" : "Starter";
  return `${plan} · ${subscription.status === "trial" ? "Essai" : subscription.status}`;
}

function whatsAppStatusLabel(status: CentralAgencyAnalytics["whatsApp"]["status"]) {
  return status === "active" ? "Canal actif" : status === "verified" ? "Meta validé" : status === "draft" ? "À valider" : "Non configuré";
}

function periodLabel(period: CentralAnalyticsPeriod) {
  return PERIODS.find((item) => item.id === period)?.label ?? period;
}

function usageTone(level: CentralAgencyAnalytics["usage"]["alert"]["level"]) {
  return level === "reached" ? "#CE1126" : level === "approaching" ? "#B56A00" : level === "healthy" ? "#147A46" : "#415F80";
}

function feedbackBackground(tone: FeedbackTone) {
  return tone === "success" ? "#E7F7EC" : tone === "error" ? "#FDEBEC" : tone === "warning" ? "#FFF5DB" : "#F3F8FC";
}

function feedbackColor(tone: FeedbackTone) {
  return tone === "success" ? "#147A46" : tone === "error" ? "#B4232B" : tone === "warning" ? "#8B5700" : "#415F80";
}

export default function CentralConsoleScreen() {
  const { user } = useAuth();
  const [period, setPeriod] = useState<CentralAnalyticsPeriod>("30d");
  const [agencies, setAgencies] = useState<CentralAgency[]>([]);
  const [analytics, setAnalytics] = useState<CentralAgencyAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<"csv" | "pdf" | null>(null);
  const [activatingAgencyId, setActivatingAgencyId] = useState<string | null>(null);
  const [validatingAgencyId, setValidatingAgencyId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [agencyFeedback, setAgencyFeedback] = useState<AgencyFeedback>({});

  const load = useCallback(async (selectedPeriod: CentralAnalyticsPeriod) => {
    try {
      setLoading(true);
      setMessage("");
      const [agencyResult, analyticsResult] = await Promise.all([fetchPreviewAgencies(), fetchCentralAnalytics(selectedPeriod)]);
      setAgencies(agencyResult.agencies);
      setAnalytics(analyticsResult.agencies);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Console centralisatrice indisponible.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role === "super_admin") void load(period);
  }, [load, period, user?.role]);

  const byAgency = useMemo(() => new Map(analytics.map((entry) => [entry.agencyId, entry])), [analytics]);
  const totals = useMemo(() => analytics.reduce((total, item) => ({
    updates: total.updates + item.operations.periodUpdates,
    active: total.active + item.operations.activeShipments,
    risks: total.risks + item.operations.atRisk,
    exceptions: total.exceptions + item.operations.openExceptions,
    paid: total.paid + item.chariow.paidTransactions,
    capacityAlerts: total.capacityAlerts + (item.usage.alert.level === "approaching" || item.usage.alert.level === "reached" ? 1 : 0),
  }), { updates: 0, active: 0, risks: 0, exceptions: 0, paid: 0, capacityAlerts: 0 }), [analytics]);

  const exportRows = useMemo<CentralConsoleExportRow[]>(() => agencies.flatMap((agency) => {
    const data = byAgency.get(agency.agencyId);
    if (!data) return [];
    return [{
      agencyId: agency.agencyId,
      agencyName: agency.displayName,
      plan: labelPlan(agency.subscription),
      usage: data.usage.shipmentLimit ? `${data.operations.trackedShipments}/${data.usage.shipmentLimit} (${data.usage.alert.percent ?? 0} %)` : "Sans limite définie",
      usageAlert: data.usage.alert.title,
      periodUpdates: data.operations.periodUpdates,
      activeShipments: data.operations.activeShipments,
      atRisk: data.operations.atRisk,
      openExceptions: data.operations.openExceptions,
      chariowStatus: data.chariow.subscriptionStatus ?? "Sans souscription",
      paidTransactions: data.chariow.paidTransactions,
      pendingTransactions: data.chariow.pendingTransactions,
      failedTransactions: data.chariow.failedTransactions,
      whatsAppStatus: whatsAppStatusLabel(data.whatsApp.status),
      whatsAppMessages: data.whatsApp.periodMessages,
      whatsAppFailedMessages: data.whatsApp.failedMessages,
    }];
  }), [agencies, byAgency]);

  const selectPeriod = (nextPeriod: CentralAnalyticsPeriod) => setPeriod(nextPeriod);

  const exportReport = async (format: "csv" | "pdf") => {
    if (!exportRows.length) {
      setMessage("Aucune donnée d’agence à exporter pour la période sélectionnée.");
      return;
    }
    try {
      setExporting(format);
      const title = `GlobalLogix · Console centralisée · ${periodLabel(period)}`;
      if (format === "csv") await exportCentralConsoleCsv(exportRows, title);
      else await exportCentralConsolePdf(exportRows, title, periodLabel(period));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Export du rapport impossible.");
    } finally {
      setExporting(null);
    }
  };

  const activate = (agency: CentralAgency, data: CentralAgencyAnalytics) => {
    const eligibility = data.whatsApp.activation;
    if (!eligibility.canActivate) {
      setAgencyFeedback((current) => ({ ...current, [agency.agencyId]: { tone: eligibility.tone, message: eligibility.message } }));
      return;
    }
    Alert.alert(
      "Activer ce canal WhatsApp ?",
      `Les mises à jour d’expédition de ${agency.displayName} pourront utiliser son canal Meta validé. Aucun secret ne sera affiché.`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Activer", style: "default", onPress: async () => {
            try {
              setActivatingAgencyId(agency.agencyId);
              setAgencyFeedback((current) => ({ ...current, [agency.agencyId]: { tone: "neutral", message: "Activation sécurisée du canal en cours…" } }));
              await activateAgencyWhatsAppFromConsole(agency.agencyId);
              setAgencyFeedback((current) => ({ ...current, [agency.agencyId]: { tone: "success", message: "Canal activé : les mises à jour WhatsApp sont désormais autorisées." } }));
              await load(period);
            } catch (error) {
              const detail = error instanceof Error ? error.message : "La validation Meta a échoué. Vérifiez la configuration et le webhook de l’agence.";
              setAgencyFeedback((current) => ({ ...current, [agency.agencyId]: { tone: "error", message: detail } }));
            } finally {
              setActivatingAgencyId(null);
            }
          },
        },
      ],
    );
  };

  const validateMeta = async (agency: CentralAgency) => {
    try {
      setValidatingAgencyId(agency.agencyId);
      setAgencyFeedback((current) => ({ ...current, [agency.agencyId]: { tone: "neutral", message: "Contrôle sécurisé de la connexion Meta en cours…" } }));
      const result = await validateAgencyWhatsAppMetaFromConsole(agency.agencyId);
      setAgencyFeedback((current) => ({ ...current, [agency.agencyId]: { tone: "success", message: result.validation.message } }));
    } catch (error) {
      const detail = error instanceof Error ? error.message : "La validation Meta a échoué. Vérifiez la configuration et les droits WhatsApp Business.";
      setAgencyFeedback((current) => ({ ...current, [agency.agencyId]: { tone: "error", message: detail } }));
    } finally {
      setValidatingAgencyId(null);
    }
  };

  if (user?.role !== "super_admin") {
    return <ScreenContainer><View style={styles.denied}><MaterialIcons name="lock" size={34} color="#CE1126" /><Text style={styles.deniedTitle}>Accès éditeur requis</Text><Text style={styles.deniedText}>La console centralisatrice est réservée au super administrateur GlobalLogix.</Text></View></ScreenContainer>;
  }

  return <ScreenContainer>
    <FlatList
      data={agencies}
      keyExtractor={(item) => item.agencyId}
      contentContainerStyle={styles.content}
      refreshing={loading}
      onRefresh={() => void load(period)}
      ListHeaderComponent={<View>
        <Pressable onPress={() => router.back()} style={styles.back}><MaterialIcons name="arrow-back" size={20} color="#062B5C" /><Text style={styles.backText}>Réglages</Text></Pressable>
        <Text style={styles.eyebrow}>ÉDITEUR GLOBALLOGIX · WEB</Text>
        <Text style={styles.title}>Console centralisatrice</Text>
        <Text style={styles.subtitle}>Analysez le portefeuille SaaS, repérez les limites de capacité et contrôlez les canaux clients validés par Meta.</Text>
        <View style={styles.periods}>{PERIODS.map((option) => <Pressable key={option.id} onPress={() => selectPeriod(option.id)} style={({ pressed }) => [styles.period, option.id === period && styles.periodActive, pressed && styles.pressed]}><Text style={[styles.periodText, option.id === period && styles.periodTextActive]}>{option.label}</Text></Pressable>)}</View>
        <View style={styles.exportRow}>
          <Pressable disabled={Boolean(exporting) || loading} onPress={() => void exportReport("csv")} style={({ pressed }) => [styles.exportButton, pressed && styles.pressed, (Boolean(exporting) || loading) && styles.disabled]}><MaterialIcons name="download" size={17} color="#003F87" /><Text style={styles.exportText}>{exporting === "csv" ? "Préparation…" : "Exporter CSV"}</Text></Pressable>
          <Pressable disabled={Boolean(exporting) || loading} onPress={() => void exportReport("pdf")} style={({ pressed }) => [styles.exportButton, pressed && styles.pressed, (Boolean(exporting) || loading) && styles.disabled]}><MaterialIcons name="picture-as-pdf" size={17} color="#003F87" /><Text style={styles.exportText}>{exporting === "pdf" ? "Préparation…" : "Exporter PDF"}</Text></Pressable>
        </View>
        {loading ? <View style={styles.loading}><ActivityIndicator color="#007FFF" /><Text style={styles.loadingText}>Mise à jour de la période…</Text></View> : null}
        {message ? <View style={styles.globalMessage}><MaterialIcons name="info-outline" size={17} color="#B4232B" /><Text style={styles.globalMessageText}>{message}</Text></View> : null}
        <View style={styles.metrics}>{[
          { label: "Mises à jour", value: totals.updates, icon: "timeline", tone: "#007FFF" },
          { label: "Actives", value: totals.active, icon: "local-shipping", tone: "#0F766E" },
          { label: "À risque", value: totals.risks, icon: "priority-high", tone: "#CE1126" },
          { label: "Limites", value: totals.capacityAlerts, icon: "warning-amber", tone: "#B56A00" },
          { label: "Paiements", value: totals.paid, icon: "payments", tone: "#936200" },
        ].map((metric) => <View key={metric.label} style={styles.metric}><MaterialIcons name={metric.icon as never} size={18} color={metric.tone} /><Text style={styles.metricValue}>{metric.value}</Text><Text style={styles.metricLabel}>{metric.label}</Text></View>)}</View>
        <View style={styles.scopeNotice}><MaterialIcons name="admin-panel-settings" size={18} color="#062B5C" /><Text style={styles.scopeText}>Les exports reflètent exactement la période sélectionnée. Ils ne contiennent ni secret Meta, ni numéro client complet, ni donnée de paiement sensible.</Text></View>
        <View style={styles.sectionHead}><Text style={styles.sectionTitle}>Portefeuille d’agences</Text><Text style={styles.sectionMeta}>{agencies.length} tenant{agencies.length > 1 ? "s" : ""} · {periodLabel(period)}</Text></View>
      </View>}
      ListEmptyComponent={!loading ? <View style={styles.empty}><MaterialIcons name="domain-add" size={30} color="#007FFF" /><Text style={styles.emptyTitle}>Aucune agence à piloter</Text><Text style={styles.emptyText}>Créez votre première agence SaaS afin de l’ajouter à la console.</Text><Pressable onPress={() => router.push("/agency-directory" as never)} style={styles.emptyButton}><Text style={styles.emptyButtonText}>Créer une agence</Text></Pressable></View> : null}
      renderItem={({ item }) => {
        const color = /^#[0-9A-F]{6}$/i.test(item.primaryColor ?? "") ? item.primaryColor! : "#007FFF";
        const data = byAgency.get(item.agencyId);
        if (!data) return null;
        const feedback = agencyFeedback[item.agencyId] ?? { tone: data.whatsApp.activation.tone, message: data.whatsApp.activation.message };
        const canActivate = data.whatsApp.activation.canActivate;
        const usageColor = usageTone(data.usage.alert.level);
        const activity = item.latestWhatsAppActivity;
        return <View style={[styles.agencyCard, { borderColor: `${color}66` }]}>
          <View style={[styles.colorRail, { backgroundColor: color }]} />
          <Pressable onPress={() => router.push({ pathname: "/agency-preview", params: { agencyId: item.agencyId } } as never)} style={({ pressed }) => [styles.agencyTop, pressed && styles.pressed]}>
            <View style={[styles.logo, { borderColor: color }]}>{item.logoUrl ? <Image source={{ uri: item.logoUrl }} style={styles.logoImage} /> : <MaterialIcons name="business" size={27} color={color} />}</View>
            <View style={styles.agencyCopy}><Text style={styles.agencyName}>{item.displayName}</Text><Text style={styles.agencyCode}>{item.agencyId} · {labelPlan(item.subscription)}</Text></View>
            <MaterialIcons name="arrow-forward" size={20} color={color} />
          </Pressable>
          <View style={styles.opsRow}><Text style={styles.opsText}><Text style={styles.opsStrong}>{data.operations.periodUpdates}</Text> mises à jour</Text><Text style={[styles.opsText, data.operations.atRisk > 0 && styles.riskText]}><Text style={styles.opsStrong}>{data.operations.atRisk}</Text> à risque</Text><Text style={styles.opsText}><Text style={styles.opsStrong}>{data.operations.openExceptions}</Text> exceptions</Text></View>
          <View style={[styles.usage, { borderColor: `${usageColor}55` }]}>
            <View style={styles.usageHead}><View style={styles.usageTitleRow}><MaterialIcons name={data.usage.alert.level === "reached" ? "error-outline" : data.usage.alert.level === "approaching" ? "warning-amber" : "speed"} size={16} color={usageColor} /><Text style={[styles.usageLabel, { color: usageColor }]}>{data.usage.alert.title}</Text></View><Text style={styles.usageValue}>{data.usage.shipmentLimit ? `${data.operations.trackedShipments}/${data.usage.shipmentLimit} expéditions` : "Sans limite"}</Text></View>
            <Text style={[styles.usageMessage, { color: usageColor }]}>{data.usage.alert.message}</Text>
            {data.usage.shipmentUsagePercent !== null ? <View style={styles.progressTrack}><View style={[styles.progressFill, { backgroundColor: usageColor, width: `${data.usage.shipmentUsagePercent}%` }]} /></View> : null}
          </View>
          <View style={styles.chariow}><View style={styles.chariowHead}><MaterialIcons name="payments" size={16} color="#936200" /><Text style={styles.chariowTitle}>Chariow · {data.chariow.productId ?? "Produit à configurer"}</Text></View><Text style={styles.chariowText}>{data.chariow.paidTransactions} paiement{data.chariow.paidTransactions > 1 ? "s" : ""} confirmé{data.chariow.paidTransactions > 1 ? "s" : ""} · {data.chariow.pendingTransactions} en attente · {data.chariow.failedTransactions} échoué{data.chariow.failedTransactions > 1 ? "s" : ""}</Text></View>
          <View style={styles.whatsApp}><View style={styles.whatsAppHead}><MaterialIcons name={data.whatsApp.status === "active" ? "check-circle" : data.whatsApp.status === "verified" ? "verified" : "hourglass-empty"} size={16} color={feedbackColor(feedback.tone)} /><Text style={styles.whatsAppTitle}>WhatsApp · {whatsAppStatusLabel(data.whatsApp.status)}</Text></View><Text style={styles.whatsAppText}>{data.whatsApp.periodMessages} événement{data.whatsApp.periodMessages > 1 ? "s" : ""} sur la période · {data.whatsApp.deliveredMessages} remis/lus · {data.whatsApp.failedMessages} échec{data.whatsApp.failedMessages > 1 ? "s" : ""}</Text>{activity ? <Text numberOfLines={1} style={styles.activityText}>{activity.sanitizedSummary ?? `Événement ${activity.eventType}`}</Text> : null}<View style={[styles.feedback, { backgroundColor: feedbackBackground(feedback.tone) }]}><MaterialIcons name={feedback.tone === "error" ? "error-outline" : feedback.tone === "warning" ? "info-outline" : feedback.tone === "success" ? "check-circle-outline" : "info-outline"} size={15} color={feedbackColor(feedback.tone)} /><Text style={[styles.feedbackText, { color: feedbackColor(feedback.tone) }]}>{feedback.message}</Text></View>{item.whatsApp && data.whatsApp.status !== "active" ? <Pressable disabled={validatingAgencyId === item.agencyId || activatingAgencyId === item.agencyId} onPress={() => void validateMeta(item)} style={({ pressed }) => [styles.validateButton, pressed && styles.pressed, (validatingAgencyId === item.agencyId || activatingAgencyId === item.agencyId) && styles.disabled]}><MaterialIcons name="fact-check" size={16} color="#003F87" /><Text style={styles.validateText}>{validatingAgencyId === item.agencyId ? "Contrôle Meta…" : "Contrôler la connexion Meta"}</Text></Pressable> : null}{canActivate ? <Pressable disabled={activatingAgencyId === item.agencyId || validatingAgencyId === item.agencyId} onPress={() => activate(item, data)} style={({ pressed }) => [styles.activateButton, pressed && styles.pressed, (activatingAgencyId === item.agencyId || validatingAgencyId === item.agencyId) && styles.disabled]}><MaterialIcons name="verified" size={16} color="#FFFFFF" /><Text style={styles.activateText}>{activatingAgencyId === item.agencyId ? "Activation sécurisée…" : "Activer le canal validé"}</Text></Pressable> : null}</View>
        </View>;
      }}
    />
  </ScreenContainer>;
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 34 },
  denied: { alignItems: "center", flex: 1, justifyContent: "center", padding: 26 },
  deniedTitle: { color: "#062B5C", fontSize: 21, fontWeight: "900", marginTop: 12 },
  deniedText: { color: "#65768B", fontSize: 13, lineHeight: 19, marginTop: 6, textAlign: "center" },
  back: { alignItems: "center", flexDirection: "row", gap: 6, height: 40 },
  backText: { color: "#062B5C", fontWeight: "800" },
  eyebrow: { color: "#CE1126", fontSize: 10, fontWeight: "900", letterSpacing: 1.1, marginTop: 14 },
  title: { color: "#062B5C", fontSize: 28, fontWeight: "900", marginTop: 5 },
  subtitle: { color: "#65768B", fontSize: 13, lineHeight: 19, marginTop: 8 },
  periods: { flexDirection: "row", gap: 8, marginTop: 17 },
  period: { backgroundColor: "#FFFFFF", borderColor: "#D9E2EC", borderRadius: 10, borderWidth: 1, paddingHorizontal: 11, paddingVertical: 8 },
  periodActive: { backgroundColor: "#003F87", borderColor: "#003F87" },
  periodText: { color: "#415F80", fontSize: 11, fontWeight: "900" },
  periodTextActive: { color: "#FFFFFF" },
  exportRow: { flexDirection: "row", gap: 9, marginTop: 12 },
  exportButton: { alignItems: "center", backgroundColor: "#FFFFFF", borderColor: "#9FC0DF", borderRadius: 10, borderWidth: 1, flex: 1, flexDirection: "row", gap: 6, justifyContent: "center", paddingVertical: 10 },
  exportText: { color: "#003F87", fontSize: 11, fontWeight: "900" },
  loading: { alignItems: "center", flexDirection: "row", gap: 9, paddingVertical: 18 },
  loadingText: { color: "#65768B", fontSize: 12, fontWeight: "700" },
  globalMessage: { alignItems: "flex-start", backgroundColor: "#FDEBEC", borderRadius: 10, flexDirection: "row", gap: 7, marginTop: 12, padding: 10 },
  globalMessageText: { color: "#B4232B", flex: 1, fontSize: 11, lineHeight: 16 },
  metrics: { flexDirection: "row", flexWrap: "wrap", gap: 9, marginTop: 16 },
  metric: { backgroundColor: "#FFFFFF", borderColor: "#D9E2EC", borderRadius: 15, borderWidth: 1, flexGrow: 1, minWidth: 112, padding: 12 },
  metricValue: { color: "#062B5C", fontSize: 24, fontWeight: "900", marginTop: 7 },
  metricLabel: { color: "#65768B", fontSize: 10, fontWeight: "800", marginTop: 2 },
  scopeNotice: { alignItems: "flex-start", backgroundColor: "#FFFFFF", borderColor: "#D9E2EC", borderRadius: 13, borderWidth: 1, flexDirection: "row", gap: 9, marginTop: 13, padding: 12 },
  scopeText: { color: "#415F80", flex: 1, fontSize: 11, lineHeight: 16 },
  sectionHead: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginBottom: 10, marginTop: 22 },
  sectionTitle: { color: "#062B5C", fontSize: 18, fontWeight: "900" },
  sectionMeta: { color: "#65768B", fontSize: 11, fontWeight: "800" },
  empty: { alignItems: "center", backgroundColor: "#FFFFFF", borderColor: "#D9E2EC", borderRadius: 16, borderWidth: 1, padding: 24 },
  emptyTitle: { color: "#062B5C", fontSize: 15, fontWeight: "900", marginTop: 10 },
  emptyText: { color: "#65768B", fontSize: 12, lineHeight: 17, marginTop: 5, textAlign: "center" },
  emptyButton: { backgroundColor: "#003F87", borderRadius: 10, marginTop: 14, paddingHorizontal: 14, paddingVertical: 10 },
  emptyButtonText: { color: "#FFFFFF", fontSize: 12, fontWeight: "900" },
  agencyCard: { backgroundColor: "#FFFFFF", borderRadius: 17, borderWidth: 1, marginBottom: 10, overflow: "hidden", padding: 14 },
  colorRail: { bottom: 0, left: 0, position: "absolute", top: 0, width: 4 },
  agencyTop: { alignItems: "center", flexDirection: "row" },
  logo: { alignItems: "center", backgroundColor: "#FFFFFF", borderRadius: 13, borderWidth: 1, height: 50, justifyContent: "center", overflow: "hidden", width: 50 },
  logoImage: { height: 44, resizeMode: "contain", width: 44 },
  agencyCopy: { flex: 1, marginLeft: 10 },
  agencyName: { color: "#062B5C", fontSize: 15, fontWeight: "900" },
  agencyCode: { color: "#65768B", fontSize: 10, fontWeight: "700", marginTop: 3 },
  opsRow: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 13 },
  opsText: { color: "#415F80", fontSize: 10, fontWeight: "700" },
  opsStrong: { color: "#062B5C", fontWeight: "900" },
  riskText: { color: "#C43D3D" },
  usage: { backgroundColor: "#FAFCFE", borderRadius: 11, borderWidth: 1, marginTop: 12, padding: 10 },
  usageHead: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  usageTitleRow: { alignItems: "center", flexDirection: "row", gap: 5 },
  usageLabel: { fontSize: 11, fontWeight: "900" },
  usageValue: { color: "#415F80", fontSize: 10, fontWeight: "800" },
  usageMessage: { fontSize: 10, lineHeight: 15, marginTop: 5 },
  progressTrack: { backgroundColor: "#EAF0F5", borderRadius: 99, height: 6, marginTop: 8, overflow: "hidden" },
  progressFill: { borderRadius: 99, height: 6 },
  chariow: { backgroundColor: "#FFF9D8", borderRadius: 10, marginTop: 12, padding: 10 },
  chariowHead: { alignItems: "center", flexDirection: "row", gap: 6 },
  chariowTitle: { color: "#735100", flex: 1, fontSize: 11, fontWeight: "900" },
  chariowText: { color: "#735100", fontSize: 10, lineHeight: 15, marginTop: 5 },
  whatsApp: { backgroundColor: "#F3F8FC", borderRadius: 10, marginTop: 10, padding: 10 },
  whatsAppHead: { alignItems: "center", flexDirection: "row", gap: 6 },
  whatsAppTitle: { color: "#062B5C", fontSize: 11, fontWeight: "900" },
  whatsAppText: { color: "#415F80", fontSize: 10, lineHeight: 15, marginTop: 5 },
  activityText: { color: "#65768B", fontSize: 10, fontStyle: "italic", marginTop: 6 },
  feedback: { alignItems: "flex-start", borderRadius: 8, flexDirection: "row", gap: 6, marginTop: 9, padding: 8 },
  feedbackText: { flex: 1, fontSize: 10, lineHeight: 15 },
  validateButton: { alignItems: "center", backgroundColor: "#FFFFFF", borderColor: "#9FC0DF", borderRadius: 9, borderWidth: 1, flexDirection: "row", gap: 6, justifyContent: "center", marginTop: 10, paddingVertical: 9 },
  validateText: { color: "#003F87", fontSize: 11, fontWeight: "900" },
  activateButton: { alignItems: "center", backgroundColor: "#147A46", borderRadius: 9, flexDirection: "row", gap: 6, justifyContent: "center", marginTop: 10, paddingVertical: 9 },
  activateText: { color: "#FFFFFF", fontSize: 11, fontWeight: "900" },
  pressed: { opacity: 0.78, transform: [{ scale: 0.99 }] },
  disabled: { opacity: 0.6 },
});
