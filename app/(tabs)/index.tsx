import { useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useEffect, useRef } from "react";
import { router } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { ScreenContainer } from "@/components/screen-container";
import { GlobalLogixBrandLogo } from "@/components/globallogix-brand-logo";
import { RdcFlagAccent } from "@/components/rdc-flag-accent";
import { ScrollJumpControls } from "@/components/scroll-jump-controls";
import { StatusBadge } from "@/components/status-badge";
import { useAuth } from "@/lib/auth-context";
import { haptic } from "@/lib/haptics";
import { exportShipmentsCsv, exportShipmentsPdf } from "@/lib/shipment-export";
import { GPS_SIMULATION_SPEEDS, type GpsSimulationSpeed } from "@/lib/gps-simulator";
import { useTracking } from "@/lib/tracking-context";
import type { Shipment } from "@/lib/types";

type OperationalPriority = "critical" | "watch" | "flow";
type TransportFilter = "all" | Shipment["mode"];
type SimulationMode = Shipment["mode"];

const transportFilters: Array<{ id: TransportFilter; label: string; icon: "apps" | "flight" | "directions-boat" | "local-shipping" }> = [
  { id: "all", label: "Tous", icon: "apps" },
  { id: "air", label: "Aérien", icon: "flight" },
  { id: "sea", label: "Maritime", icon: "directions-boat" },
  { id: "land", label: "Terrestre", icon: "local-shipping" },
];

const simulationModes: Array<{ id: SimulationMode; label: string; icon: "flight" | "directions-boat" | "local-shipping" }> = [
  { id: "air", label: "Air", icon: "flight" },
  { id: "sea", label: "Mer", icon: "directions-boat" },
  { id: "land", label: "Route", icon: "local-shipping" },
];

function priorityOf(shipment: Shipment): OperationalPriority {
  if (shipment.status === "delayed" || shipment.status === "customs") return "critical";
  if (shipment.progress < 35 || shipment.distanceRemainingKm > 2_000) return "watch";
  return "flow";
}

export default function DashboardScreen() {
  const { user } = useAuth();
  const { shipments, lastEventAt, connectionState, selectShipment, simulateGpsUpdate } = useTracking();
  const [transportFilter, setTransportFilter] = useState<TransportFilter>("all");
  const [exporting, setExporting] = useState<"csv" | "pdf" | null>(null);
  const [simulationMode, setSimulationMode] = useState<SimulationMode>("air");
  const [simulationSpeed, setSimulationSpeed] = useState<GpsSimulationSpeed>("standard");
  const [simulationProgress, setSimulationProgress] = useState(0);
  const [simulationRunning, setSimulationRunning] = useState(false);
  const simulationTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const listRef = useRef<FlatList<Shipment>>(null);

  const filteredShipments = useMemo(
    () => transportFilter === "all" ? shipments : shipments.filter((shipment) => shipment.mode === transportFilter),
    [shipments, transportFilter],
  );

  const operational = useMemo(() => {
    const inTransit = filteredShipments.filter((shipment) => shipment.status === "in-transit").length;
    const atRisk = filteredShipments.filter((shipment) => shipment.status === "delayed" || shipment.status === "customs").length;
    const delivered = filteredShipments.filter((shipment) => shipment.status === "delivered").length;
    const ranked = [...filteredShipments].sort((left, right) => {
      const rank: Record<OperationalPriority, number> = { critical: 0, watch: 1, flow: 2 };
      return rank[priorityOf(left)] - rank[priorityOf(right)] || left.progress - right.progress;
    });
    const active = Math.max(filteredShipments.length - delivered, 0);
    const healthScore = active === 0 ? 100 : Math.max(0, Math.round(((active - atRisk) / active) * 100));
    return { inTransit, atRisk, delivered, active, healthScore, priority: ranked[0], watchlist: ranked.slice(0, 4) };
  }, [filteredShipments]);

  const metrics = [
    { label: "En transit", value: operational.inTransit, tone: "blue" as const, icon: "local-shipping" as const },
    { label: "À risque", value: operational.atRisk, tone: "red" as const, icon: "priority-high" as const },
    { label: "Livrées", value: operational.delivered, tone: "green" as const, icon: "task-alt" as const },
  ];

  const openTracking = (shipment: Shipment) => {
    haptic.light();
    selectShipment(shipment.id);
    router.push("/tracking" as never);
  };

  const greeting = user?.displayName?.split(" ")[0] || "équipe";
  const agencyLabel = user?.agencyId ?? "Périmètre global";
  const filterLabel = transportFilters.find((filter) => filter.id === transportFilter)?.label ?? "Tous";
  const selectedSimulationMode = simulationModes.find((mode) => mode.id === simulationMode) ?? simulationModes[0];
  const selectedSimulationSpeed = GPS_SIMULATION_SPEEDS.find((speed) => speed.id === simulationSpeed) ?? GPS_SIMULATION_SPEEDS[1];
  const runExport = async (format: "csv" | "pdf") => {
    try {
      setExporting(format);
      const title = `Rapport GlobalLogix · ${filterLabel}`;
      if (format === "csv") await exportShipmentsCsv(filteredShipments, title);
      else await exportShipmentsPdf(filteredShipments, title);
    } finally {
      setExporting(null);
    }
  };
  const runGpsSimulation = () => {
    if (simulationRunning) return;
    const target = operational.priority ?? shipments.find((shipment) => shipment.mode === simulationMode) ?? shipments[0];
    if (!target) return;
    haptic.selection();
    setSimulationProgress(0);
    setSimulationRunning(true);
    const baseDurationMs: Record<SimulationMode, number> = { air: 1800, sea: 3200, land: 2400 };
    const speedFactor: Record<GpsSimulationSpeed, number> = { slow: 1.35, standard: 1, fast: 0.65 };
    const duration = Math.round(baseDurationMs[simulationMode] * speedFactor[simulationSpeed]);
    const startedAt = Date.now();
    simulationTimerRef.current = setInterval(() => {
      const completed = Math.min(100, Math.round(((Date.now() - startedAt) / duration) * 100));
      setSimulationProgress(completed);
      if (completed < 100) return;
      if (simulationTimerRef.current) clearInterval(simulationTimerRef.current);
      simulationTimerRef.current = null;
      simulateGpsUpdate(target.id, { mode: simulationMode, speed: simulationSpeed });
      setSimulationRunning(false);
    }, 90);
  };

  useEffect(() => () => {
    if (simulationTimerRef.current) clearInterval(simulationTimerRef.current);
  }, []);

  return (
    <ScreenContainer className="bg-background"><View style={styles.dashboardShell}>
      <FlatList
        ref={listRef}
        data={operational.watchlist}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.content, styles.contentWithScrollControls]}
        ListHeaderComponent={
          <View>
            <View style={styles.brandRow}><GlobalLogixBrandLogo size="dashboard" /><RdcFlagAccent compact /></View>
            <View style={styles.topLine}>
              <View style={styles.titleArea}>
                <Text style={styles.eyebrow}>TOUR DE CONTRÔLE · {agencyLabel}</Text>
                <Text style={styles.heading}>Bonjour, {greeting}</Text>
                <Text style={styles.subheading}>Voici les priorités qui demandent votre attention aujourd’hui.</Text>
              </View>
              <View style={[styles.liveBadge, connectionState !== "connected" && styles.liveBadgePaused]}>
                <View style={[styles.liveDot, connectionState !== "connected" && styles.pausedDot]} />
                <Text style={[styles.liveText, connectionState !== "connected" && styles.liveTextPaused]}>{connectionState === "connected" ? "Temps réel" : "Synchronisation"}</Text>
              </View>
            </View>

            <View style={styles.metricsGrid}>
              {metrics.map((metric) => <View key={metric.label} style={styles.metricCard}>
                <View style={[styles.metricIcon, metric.tone === "red" ? styles.metricIconRed : metric.tone === "green" ? styles.metricIconGreen : styles.metricIconBlue]}><MaterialIcons name={metric.icon} size={18} color={metric.tone === "red" ? "#C43D3D" : metric.tone === "green" ? "#147A46" : "#235B9D"} /></View>
                <Text style={styles.metricValue}>{metric.value}</Text>
                <Text style={styles.metricLabel}>{metric.label}</Text>
              </View>)}
            </View>

            <View style={styles.healthPanel}>
              <View style={styles.healthHeader}><View><Text style={styles.healthEyebrow}>SANTÉ OPÉRATIONNELLE</Text><Text style={styles.healthTitle}>{operational.healthScore >= 85 ? "Flux maîtrisé" : operational.healthScore >= 60 ? "Surveillance renforcée" : "Intervention prioritaire"}</Text></View><View style={[styles.healthScore, operational.healthScore < 60 && styles.healthScoreCritical]}><Text style={styles.healthScoreText}>{operational.healthScore}</Text><Text style={styles.healthScoreSuffix}>/100</Text></View></View>
              <View style={styles.healthTrack}><View style={[styles.healthFill, operational.healthScore < 60 && styles.healthFillCritical, { width: `${operational.healthScore}%` }]} /></View>
              <Text style={styles.healthCaption}>{operational.active} expédition{operational.active > 1 ? "s" : ""} active{operational.active > 1 ? "s" : ""} · {operational.atRisk} nécessitent une action.</Text>
            </View>

            <View style={transportStyles.block}>
              <Text style={transportStyles.title}>FILTRER PAR TRANSPORT</Text>
              <View style={transportStyles.row}>
                {transportFilters.map((filter) => <Pressable key={filter.id} onPress={() => { haptic.selection(); setTransportFilter(filter.id); }} style={({ pressed }) => [transportStyles.chip, transportFilter === filter.id && transportStyles.chipActive, pressed && styles.pressed]}><MaterialIcons name={filter.icon} size={15} color={transportFilter === filter.id ? "#FFFFFF" : "#235B9D"} /><Text style={[transportStyles.text, transportFilter === filter.id && transportStyles.textActive]}>{filter.label}</Text></Pressable>)}
              </View>
            </View>

            <View style={simulationStyles.panel}>
              <View style={simulationStyles.panelHeading}><MaterialIcons name="my-location" size={17} color="#007FFF" /><View style={simulationStyles.panelCopy}><Text style={simulationStyles.panelTitle}>SIMULATION GPS LOCALE</Text><Text style={simulationStyles.panelSubtitle}>Aucune donnée n’est envoyée au transporteur ni au serveur.</Text></View></View>
              <Text style={simulationStyles.fieldLabel}>Type de transport simulé</Text>
              <View style={simulationStyles.chips}>{simulationModes.map((mode) => <Pressable key={mode.id} disabled={simulationRunning} onPress={() => { haptic.selection(); setSimulationMode(mode.id); }} style={({ pressed }) => [simulationStyles.chip, simulationMode === mode.id && simulationStyles.chipActive, simulationRunning && simulationStyles.controlDisabled, pressed && styles.pressed]}><MaterialIcons name={mode.icon} size={14} color={simulationMode === mode.id ? "#FFFFFF" : "#062B5C"} /><Text style={[simulationStyles.chipText, simulationMode === mode.id && simulationStyles.chipTextActive]}>{mode.label}</Text></Pressable>)}</View>
              <Text style={simulationStyles.fieldLabel}>Vitesse de déplacement</Text>
              <View style={simulationStyles.chips}>{GPS_SIMULATION_SPEEDS.map((speed) => <Pressable key={speed.id} disabled={simulationRunning} onPress={() => { haptic.selection(); setSimulationSpeed(speed.id); }} style={({ pressed }) => [simulationStyles.chip, simulationSpeed === speed.id && simulationStyles.speedActive, simulationRunning && simulationStyles.controlDisabled, pressed && styles.pressed]}><Text style={[simulationStyles.chipText, simulationSpeed === speed.id && simulationStyles.chipTextActive]}>{speed.label}</Text></Pressable>)}</View>
              <View style={simulationStyles.progressBlock}><View style={simulationStyles.progressMeta}><Text style={simulationStyles.progressLabel}>{simulationRunning ? `${selectedSimulationMode.label} · vitesse ${selectedSimulationSpeed.label.toLowerCase()}` : "Prêt pour une simulation locale"}</Text><Text style={simulationStyles.progressValue}>{simulationRunning ? `${simulationProgress}%` : "0%"}</Text></View><View style={simulationStyles.progressTrack}><View style={[simulationStyles.progressFill, { width: `${simulationProgress}%` }]} />{simulationRunning ? <View style={[simulationStyles.vehicle, { left: `${Math.min(88, simulationProgress * 0.88)}%` }]}><MaterialIcons name={selectedSimulationMode.icon} size={16} color="#062B5C" /></View> : null}</View></View>
            </View>

            <View style={exportStyles.row}><Text style={exportStyles.label}>{filteredShipments.length} colis filtré{filteredShipments.length > 1 ? "s" : ""}</Text><View style={exportStyles.actions}><Pressable disabled={exporting !== null} onPress={() => void runExport("csv")} style={({ pressed }) => [exportStyles.button, pressed && styles.pressed, exporting !== null && exportStyles.disabled]}><MaterialIcons name="table-chart" size={15} color="#235B9D" /><Text style={exportStyles.csvText}>{exporting === "csv" ? "Export…" : "CSV"}</Text></Pressable><Pressable disabled={exporting !== null} onPress={() => void runExport("pdf")} style={({ pressed }) => [exportStyles.button, pressed && styles.pressed, exporting !== null && exportStyles.disabled]}><MaterialIcons name="picture-as-pdf" size={15} color="#C43D3D" /><Text style={exportStyles.pdfText}>{exporting === "pdf" ? "Export…" : "PDF"}</Text></Pressable></View></View>

            <View style={styles.quickActions}>
              <Pressable onPress={() => router.push("/shipments" as never)} style={({ pressed }) => [styles.quickAction, pressed && styles.pressed]}><MaterialIcons name="search" size={19} color="#0A2540" /><Text style={styles.quickActionText}>Rechercher</Text></Pressable>
              <Pressable onPress={() => router.push("/exceptions" as never)} style={({ pressed }) => [styles.quickAction, styles.quickActionAlert, pressed && styles.pressed]}><MaterialIcons name="warning-amber" size={19} color="#C43D3D" /><Text style={[styles.quickActionText, styles.quickActionAlertText]}>Exceptions</Text></Pressable>
              <Pressable disabled={simulationRunning} onPress={runGpsSimulation} style={({ pressed }) => [styles.quickAction, simulationStyles.quickAction, simulationRunning && simulationStyles.controlDisabled, pressed && styles.pressed]}><MaterialIcons name="my-location" size={19} color="#007FFF" /><Text style={styles.quickActionText}>{simulationRunning ? "Simulation…" : "Lancer GPS"}</Text></Pressable>
            </View>

            {operational.priority ? <Pressable onPress={() => openTracking(operational.priority!)} style={({ pressed }) => [styles.priorityCard, pressed && styles.pressed]}>
              <View style={styles.priorityHeading}><View style={styles.priorityLabel}><MaterialIcons name={priorityOf(operational.priority) === "critical" ? "priority-high" : "radar"} size={16} color="#FFB39A" /><Text style={styles.priorityEyebrow}>{priorityOf(operational.priority) === "critical" ? "INTERVENTION PRIORITAIRE" : "EXPÉDITION À SUIVRE"}</Text></View><MaterialIcons name="arrow-forward" size={22} color="#FFFFFF" /></View>
              <Text style={styles.priorityTitle}>{operational.priority.trackingNumber}</Text>
              <View style={styles.routeRow}><Text numberOfLines={1} style={styles.routeText}>{operational.priority.origin}</Text><MaterialIcons name="trending-flat" size={18} color="#FF6B35" /><Text numberOfLines={1} style={styles.routeText}>{operational.priority.destination}</Text></View>
              <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${Math.max(0, Math.min(100, operational.priority.progress))}%` }]} /></View>
              <View style={styles.priorityFooter}><View><Text style={styles.priorityMetric}>{operational.priority.progress}%</Text><Text style={styles.priorityCaption}>parcours réalisé</Text></View><View style={styles.priorityRight}><Text style={styles.priorityMetric}>{operational.priority.distanceRemainingKm.toLocaleString("fr-FR")} km</Text><Text style={styles.priorityCaption}>restants · ETA {operational.priority.eta}</Text></View></View>
            </Pressable> : <View style={styles.emptyHero}><View style={styles.emptyHeroIcon}><MaterialIcons name="inventory-2" size={26} color="#235B9D" /></View><Text style={styles.emptyHeroTitle}>Aucune expédition active</Text><Text style={styles.emptyHeroText}>Les nouvelles expéditions et mises à jour en temps réel apparaîtront ici.</Text><Pressable onPress={() => router.push("/shipments" as never)} style={({ pressed }) => [styles.emptyHeroButton, pressed && styles.pressed]}><Text style={styles.emptyHeroButtonText}>Voir le portefeuille</Text></Pressable></View>}

            <View style={styles.sectionHeader}><View><Text style={styles.sectionTitle}>File opérationnelle</Text><Text style={styles.sectionSubtitle}>{operational.atRisk > 0 ? `${operational.atRisk} dossier(s) nécessitent un suivi renforcé` : "Flux surveillé automatiquement"}</Text></View><Text style={styles.eventText}>Dernier signal · {lastEventAt}</Text></View>
          </View>
        }
        ListEmptyComponent={operational.priority ? <View style={styles.emptyList}><Text style={styles.emptyListText}>Aucune autre expédition à afficher.</Text></View> : null}
        renderItem={({ item }) => {
          const priority = priorityOf(item);
          return <Pressable onPress={() => openTracking(item)} style={({ pressed }) => [styles.shipmentRow, priority === "critical" && styles.shipmentCritical, pressed && styles.rowPressed]}>
            <View style={[styles.shipmentIcon, priority === "critical" && styles.shipmentIconCritical]}><MaterialIcons name={item.mode === "air" ? "flight" : item.mode === "sea" ? "directions-boat" : "local-shipping"} size={20} color={priority === "critical" ? "#C43D3D" : "#0A2540"} /></View>
            <View style={styles.shipmentText}><View style={styles.shipmentLine}><Text style={styles.shipmentId}>{item.trackingNumber}</Text>{priority === "critical" ? <View style={styles.riskMarker}><Text style={styles.riskMarkerText}>À RISQUE</Text></View> : null}</View><Text numberOfLines={1} style={styles.shipmentRoute}>{item.origin} → {item.destination}</Text></View>
            <View style={styles.shipmentStatus}><StatusBadge status={item.status} /><Text style={styles.shipmentProgress}>{item.progress}% · {item.eta}</Text></View>
          </Pressable>;
        }}
      /><ScrollJumpControls onTop={() => listRef.current?.scrollToOffset({ offset: 0, animated: true })} onBottom={() => listRef.current?.scrollToEnd({ animated: true })} />
    </View></ScreenContainer>
  );
}

const styles = StyleSheet.create({
  dashboardShell: { flex: 1 },
  brandRow: { alignItems: "center", flexDirection: "row", gap: 10, marginBottom: 8 }, content: { padding: 20, paddingBottom: 30 }, contentWithScrollControls: { paddingBottom: 88 }, topLine: { alignItems: "flex-start", flexDirection: "row", justifyContent: "space-between" }, titleArea: { flex: 1, paddingRight: 12 }, eyebrow: { color: "#FF6B35", fontSize: 10, fontWeight: "800", letterSpacing: 0.9 }, heading: { color: "#0A2540", fontSize: 27, fontWeight: "800", marginTop: 5 }, subheading: { color: "#5A6B7B", fontSize: 13, lineHeight: 19, marginTop: 7 },
  liveBadge: { alignItems: "center", backgroundColor: "#E7F5EC", borderRadius: 99, flexDirection: "row", marginTop: 3, paddingHorizontal: 9, paddingVertical: 7 }, liveBadgePaused: { backgroundColor: "#FFF3DA" }, liveDot: { backgroundColor: "#14804A", borderRadius: 5, height: 7, marginRight: 5, width: 7 }, pausedDot: { backgroundColor: "#C5851D" }, liveText: { color: "#147A46", fontSize: 10, fontWeight: "800" }, liveTextPaused: { color: "#936200" },
  metricsGrid: { flexDirection: "row", gap: 9, marginTop: 20 }, metricCard: { backgroundColor: "#FFFFFF", borderColor: "#D9E2EC", borderRadius: 16, borderWidth: 1, flex: 1, minHeight: 102, padding: 12 }, metricIcon: { alignItems: "center", borderRadius: 10, height: 30, justifyContent: "center", width: 30 }, metricIconBlue: { backgroundColor: "#E8F0F8" }, metricIconRed: { backgroundColor: "#FBE8E8" }, metricIconGreen: { backgroundColor: "#E9F5ED" }, metricValue: { color: "#0A2540", fontSize: 24, fontWeight: "800", marginTop: 8 }, metricLabel: { color: "#607386", fontSize: 11, fontWeight: "700", marginTop: 2 },
  healthPanel: { backgroundColor: "#E7F3FF", borderColor: "#B9D9F7", borderRadius: 17, borderWidth: 1, marginTop: 13, padding: 14 }, healthHeader: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" }, healthEyebrow: { color: "#003F87", fontSize: 10, fontWeight: "900", letterSpacing: 0.8 }, healthTitle: { color: "#062B5C", fontSize: 16, fontWeight: "900", marginTop: 3 }, healthScore: { alignItems: "baseline", backgroundColor: "#FFFFFF", borderRadius: 12, flexDirection: "row", paddingHorizontal: 10, paddingVertical: 7 }, healthScoreCritical: { backgroundColor: "#FBE8E8" }, healthScoreText: { color: "#003F87", fontSize: 20, fontWeight: "900" }, healthScoreSuffix: { color: "#65768B", fontSize: 10, fontWeight: "800" }, healthTrack: { backgroundColor: "#C7E0F7", borderRadius: 99, height: 8, marginTop: 12, overflow: "hidden" }, healthFill: { backgroundColor: "#007FFF", borderRadius: 99, height: 8 }, healthFillCritical: { backgroundColor: "#CE1126" }, healthCaption: { color: "#415F80", fontSize: 11, marginTop: 8 },
  quickActions: { flexDirection: "row", gap: 9, marginTop: 14 }, quickAction: { alignItems: "center", backgroundColor: "#FFFFFF", borderColor: "#D9E2EC", borderRadius: 12, borderWidth: 1, flex: 1, height: 46, justifyContent: "center" }, quickActionAlert: { backgroundColor: "#FFF8F6", borderColor: "#F7C6B7" }, quickActionText: { color: "#0A2540", fontSize: 10, fontWeight: "800", marginTop: 2 }, quickActionAlertText: { color: "#C43D3D" },
  priorityCard: { backgroundColor: "#0A2540", borderRadius: 20, marginTop: 20, padding: 18 }, priorityHeading: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" }, priorityLabel: { alignItems: "center", flexDirection: "row" }, priorityEyebrow: { color: "#FFB39A", fontSize: 10, fontWeight: "800", letterSpacing: 0.6, marginLeft: 5 }, priorityTitle: { color: "#FFFFFF", fontSize: 21, fontWeight: "800", marginTop: 13 }, routeRow: { alignItems: "center", flexDirection: "row", gap: 7, marginTop: 13 }, routeText: { color: "#D6E3F1", flex: 1, fontSize: 12, fontWeight: "700" }, progressTrack: { backgroundColor: "#34516E", borderRadius: 99, height: 8, marginTop: 18, overflow: "hidden" }, progressFill: { backgroundColor: "#FF6B35", borderRadius: 99, height: 8 }, priorityFooter: { flexDirection: "row", justifyContent: "space-between", marginTop: 11 }, priorityRight: { alignItems: "flex-end", flex: 1 }, priorityMetric: { color: "#FFFFFF", fontSize: 13, fontWeight: "800" }, priorityCaption: { color: "#B8C9DA", fontSize: 10, marginTop: 2 },
  sectionHeader: { alignItems: "flex-end", flexDirection: "row", justifyContent: "space-between", marginBottom: 10, marginTop: 25 }, sectionTitle: { color: "#0A2540", fontSize: 18, fontWeight: "800" }, sectionSubtitle: { color: "#718496", fontSize: 11, marginTop: 3 }, eventText: { color: "#607386", fontFamily: "monospace", fontSize: 9, marginBottom: 2, textAlign: "right" }, shipmentRow: { alignItems: "center", backgroundColor: "#FFFFFF", borderColor: "#D9E2EC", borderRadius: 16, borderWidth: 1, flexDirection: "row", marginBottom: 10, padding: 13 }, shipmentCritical: { borderColor: "#F2B7B7" }, shipmentIcon: { alignItems: "center", backgroundColor: "#E8F0F8", borderRadius: 12, height: 40, justifyContent: "center", marginRight: 11, width: 40 }, shipmentIconCritical: { backgroundColor: "#FBE8E8" }, shipmentText: { flex: 1 }, shipmentLine: { alignItems: "center", flexDirection: "row", gap: 6 }, shipmentId: { color: "#0A2540", fontSize: 13, fontWeight: "800" }, riskMarker: { backgroundColor: "#FBE8E8", borderRadius: 5, paddingHorizontal: 5, paddingVertical: 3 }, riskMarkerText: { color: "#C43D3D", fontSize: 8, fontWeight: "800" }, shipmentRoute: { color: "#66788A", fontSize: 11, marginTop: 4 }, shipmentStatus: { alignItems: "flex-end", maxWidth: 96 }, shipmentProgress: { color: "#607386", fontSize: 9, fontWeight: "700", marginTop: 6, textAlign: "right" },
  emptyHero: { alignItems: "center", backgroundColor: "#FFFFFF", borderColor: "#D9E2EC", borderRadius: 20, borderWidth: 1, marginTop: 20, padding: 24 }, emptyHeroIcon: { alignItems: "center", backgroundColor: "#E8F0F8", borderRadius: 20, height: 40, justifyContent: "center", width: 40 }, emptyHeroTitle: { color: "#0A2540", fontSize: 16, fontWeight: "800", marginTop: 10 }, emptyHeroText: { color: "#718496", fontSize: 12, lineHeight: 18, marginTop: 5, textAlign: "center" }, emptyHeroButton: { backgroundColor: "#0A2540", borderRadius: 10, marginTop: 15, paddingHorizontal: 15, paddingVertical: 10 }, emptyHeroButtonText: { color: "#FFFFFF", fontSize: 12, fontWeight: "800" }, emptyList: { alignItems: "center", backgroundColor: "#FFFFFF", borderColor: "#D9E2EC", borderRadius: 14, borderWidth: 1, padding: 18 }, emptyListText: { color: "#718496", fontSize: 12 }, pressed: { opacity: 0.84, transform: [{ scale: 0.985 }] }, rowPressed: { opacity: 0.72 },
});

const transportStyles = StyleSheet.create({
  block: { marginTop: 16 },
  title: { color: "#718496", fontSize: 10, fontWeight: "800", letterSpacing: 0.8, marginBottom: 8 },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { alignItems: "center", backgroundColor: "#FFFFFF", borderColor: "#D9E2EC", borderRadius: 99, borderWidth: 1, flexDirection: "row", height: 34, paddingHorizontal: 10 },
  chipActive: { backgroundColor: "#0A2540", borderColor: "#0A2540" },
  text: { color: "#0A2540", fontSize: 11, fontWeight: "800", marginLeft: 4 },
  textActive: { color: "#FFFFFF" },
});

const exportStyles = StyleSheet.create({
  row: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginTop: 13 },
  label: { color: "#718496", fontSize: 11, fontWeight: "700" },
  actions: { flexDirection: "row", gap: 7 },
  button: { alignItems: "center", backgroundColor: "#FFFFFF", borderColor: "#D9E2EC", borderRadius: 9, borderWidth: 1, flexDirection: "row", paddingHorizontal: 9, paddingVertical: 7 },
  disabled: { opacity: 0.55 },
  csvText: { color: "#235B9D", fontSize: 10, fontWeight: "800", marginLeft: 4 },
  pdfText: { color: "#C43D3D", fontSize: 10, fontWeight: "800", marginLeft: 4 },
});

const simulationStyles = StyleSheet.create({
  panel: { backgroundColor: "#F4F9FF", borderColor: "#B9D9F7", borderRadius: 16, borderWidth: 1, marginTop: 14, padding: 13 },
  panelHeading: { alignItems: "center", flexDirection: "row" },
  panelCopy: { flex: 1, marginLeft: 7 },
  panelTitle: { color: "#062B5C", fontSize: 11, fontWeight: "800", letterSpacing: 0.5 },
  panelSubtitle: { color: "#5B6D84", fontSize: 10, lineHeight: 15, marginTop: 2 },
  fieldLabel: { color: "#5B6D84", fontSize: 10, fontWeight: "800", marginTop: 12 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 7, marginTop: 7 },
  chip: { alignItems: "center", backgroundColor: "#FFFFFF", borderColor: "#B9D9F7", borderRadius: 99, borderWidth: 1, flexDirection: "row", minHeight: 32, paddingHorizontal: 10 },
  chipActive: { backgroundColor: "#007FFF", borderColor: "#007FFF" },
  speedActive: { backgroundColor: "#CE1126", borderColor: "#CE1126" },
  chipText: { color: "#062B5C", fontSize: 11, fontWeight: "800", marginLeft: 4 },
  chipTextActive: { color: "#FFFFFF" },
  controlDisabled: { opacity: 0.55 },
  progressBlock: { backgroundColor: "#FFFFFF", borderColor: "#D7E4F0", borderRadius: 10, borderWidth: 1, marginTop: 13, padding: 10 },
  progressMeta: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  progressLabel: { color: "#5B6D84", fontSize: 10, fontWeight: "700" },
  progressValue: { color: "#062B5C", fontFamily: "monospace", fontSize: 11, fontWeight: "800" },
  progressTrack: { backgroundColor: "#D8EAFB", borderRadius: 99, height: 8, marginTop: 8, overflow: "visible" },
  progressFill: { backgroundColor: "#F7D116", borderRadius: 99, height: 8 },
  vehicle: { alignItems: "center", backgroundColor: "#FFFFFF", borderColor: "#007FFF", borderRadius: 12, borderWidth: 1, bottom: -8, height: 24, justifyContent: "center", position: "absolute", width: 24 },
  quickAction: { backgroundColor: "#E7F3FF", borderColor: "#B9D9F7" },
});
