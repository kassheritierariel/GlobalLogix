import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Image, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { RdcFlagAccent } from "@/components/rdc-flag-accent";
import { GlobalLogixBrandLogo } from "@/components/globallogix-brand-logo";
import { createClientAccount, fetchClientShipments, fetchPublicAgency, registerClientShipment, type PublicAgency } from "@/lib/client-portal-api";
import { confirmClientSms, getClientPhoneSession, isNativeClientSmsAvailable, sendClientSms, signOutClient } from "@/lib/client-phone-auth";
import type { Shipment } from "@/lib/types";
import { maskWhatsAppNumber, normalizeWhatsAppNumber } from "@/lib/whatsapp-number";

type Stage = "phone" | "code" | "profile" | "portal";

const modeIcon: Record<Shipment["mode"], "flight" | "directions-boat" | "local-shipping"> = { air: "flight", sea: "directions-boat", land: "local-shipping" };

export default function ClientPortalScreen() {
  const { agency: requestedAgency } = useLocalSearchParams<{ agency?: string }>();
  const agencySlug = typeof requestedAgency === "string" ? requestedAgency : undefined;
  const [stage, setStage] = useState<Stage>("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [agency, setAgency] = useState<PublicAgency | null>(null);

  const loadShipments = async () => {
    const items = await fetchClientShipments(agencySlug);
    setShipments(items);
  };

  useEffect(() => {
    if (!agencySlug) return;
    void fetchPublicAgency(agencySlug).then(setAgency).catch((caughtError) => setError(caughtError instanceof Error ? caughtError.message : "Espace d’agence indisponible."));
  }, [agencySlug]);

  useEffect(() => {
    if (!isNativeClientSmsAvailable) return;
    void getClientPhoneSession().then((session) => {
      if (!session) return;
      setPhoneNumber(session.phoneNumber);
      setStage("portal");
    }).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (stage !== "portal") return;
    void loadShipments().catch((caughtError) => setError(caughtError instanceof Error ? caughtError.message : "Vos colis sont indisponibles."));
  }, [stage, agencySlug]);

  const run = async (operation: () => Promise<void>) => {
    try {
      setBusy(true);
      setError("");
      setNotice("");
      await operation();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Une erreur est survenue.");
    } finally {
      setBusy(false);
    }
  };

  const requestCode = () => run(async () => {
    const normalized = normalizeWhatsAppNumber(phoneNumber);
    await sendClientSms(normalized);
    setPhoneNumber(normalized);
    setStage("code");
    setNotice(`Un code SMS a été envoyé au ${maskWhatsAppNumber(normalized)}.`);
  });

  const verifyCode = () => run(async () => {
    if (!/^\d{6}$/.test(otpCode.trim())) throw new Error("Saisissez les 6 chiffres du code SMS.");
    const identity = await confirmClientSms(otpCode);
    setPhoneNumber(identity.phoneNumber);
    setStage("profile");
  });

  const completeProfile = () => run(async () => {
    await createClientAccount(displayName.trim());
    setStage("portal");
    setNotice("Votre compte client est prêt. Ajoutez votre première référence de colis.");
  });

  const addShipment = () => run(async () => {
    const shipment = await registerClientShipment(trackingNumber, agencySlug);
    setShipments((current) => current.some((item) => item.id === shipment.id) ? current : [shipment, ...current]);
    setTrackingNumber("");
    setNotice(`Le colis ${shipment.trackingNumber} est maintenant associé à votre compte.`);
  });

  const logout = () => run(async () => {
    await signOutClient();
    setStage("phone");
    setOtpCode("");
    setDisplayName("");
    setShipments([]);
    setNotice("");
  });

  const brandName = agency?.displayName ?? "GlobalLogix Client";
  const brandColor = /^#[0-9A-F]{6}$/i.test(agency?.primaryColor ?? "") ? agency!.primaryColor! : "#007FFF";
  const renderPortal = () => <FlatList data={shipments} keyExtractor={(item) => item.id} contentContainerStyle={styles.portalContent} ListHeaderComponent={<View><View style={styles.portalHead}><View><Text style={[styles.eyebrow, { color: brandColor }]}>ESPACE CLIENT · {brandName.toUpperCase()}</Text><Text style={styles.portalTitle}>Mes expéditions</Text><Text style={styles.portalSubtitle}>Connecté avec {maskWhatsAppNumber(phoneNumber)}</Text></View><Pressable onPress={() => void logout()} style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}><MaterialIcons name="logout" size={19} color="#CE1126" /></Pressable></View><View style={styles.addCard}><Text style={styles.addTitle}>Enregistrer un colis</Text><Text style={styles.addCopy}>La référence doit être préalablement reliée à ce numéro par {agency?.displayName ?? "GlobalLogix"}.</Text><TextInput value={trackingNumber} onChangeText={setTrackingNumber} placeholder="Ex. GLX-243-0001" autoCapitalize="characters" style={styles.input} returnKeyType="done" onSubmitEditing={() => void addShipment()} /><Pressable disabled={busy} onPress={() => void addShipment()} style={({ pressed }) => [styles.yellowButton, busy && styles.disabled, pressed && styles.pressed]}>{busy ? <ActivityIndicator color="#062B5C" /> : <Text style={styles.yellowButtonText}>Ajouter à mon suivi</Text>}</Pressable></View>{notice ? <Text style={styles.notice}>{notice}</Text> : null}{error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}<Text style={styles.sectionTitle}>COLIS ASSOCIÉS À CETTE AGENCE</Text></View>} ListEmptyComponent={<View style={styles.empty}><MaterialIcons name="inventory-2" size={30} color={brandColor} /><Text style={styles.emptyTitle}>Aucun colis associé</Text><Text style={styles.emptyText}>Ajoutez une référence reliée à votre numéro WhatsApp par cette agence.</Text></View>} renderItem={({ item }) => <Pressable onPress={() => router.push({ pathname: "/client-shipment/[id]" as never, params: { id: item.id, agency: agencySlug } })} style={({ pressed }) => [styles.shipmentCard, pressed && styles.pressed]}><View style={styles.shipmentIcon}><MaterialIcons name={modeIcon[item.mode]} size={21} color={brandColor} /></View><View style={styles.shipmentCopy}><Text style={styles.tracking}>{item.trackingNumber}</Text><Text numberOfLines={1} style={styles.route}>{item.origin} → {item.destination}</Text><Text style={[styles.position, { color: brandColor }]}>{item.currentPosition}</Text></View><View style={styles.shipmentStatus}><Text style={styles.progress}>{item.progress}%</Text><Text style={styles.eta}>{item.eta}</Text><MaterialIcons name="chevron-right" size={20} color="#718496" /></View></Pressable>} />;

  if (!isNativeClientSmsAvailable) {
    return <View style={styles.webFallback}>{agency?.logoUrl ? <Image source={{ uri: agency.logoUrl }} style={styles.portalLogo} /> : <GlobalLogixBrandLogo size="client" />}<RdcFlagAccent compact /><MaterialIcons name="phone-android" size={38} color={brandColor} /><Text style={styles.webTitle}>{brandName}</Text><Text style={styles.webCopy}>La vérification du numéro WhatsApp par SMS Firebase requiert l’application GlobalLogix installée sur Android ou iOS. Vos colis resteront limités à cet espace d’agence.</Text><Pressable onPress={() => router.back()} style={({ pressed }) => [styles.yellowButton, pressed && styles.pressed]}><Text style={styles.yellowButtonText}>Retour</Text></Pressable></View>;
  }

  if (stage === "portal") return <View style={styles.portal}>{renderPortal()}</View>;

  const form = stage === "phone" ? <><Text style={styles.title}>Suivre mes colis</Text><Text style={styles.subtitle}>Créez un seul compte client avec votre numéro WhatsApp. Un code SMS vérifiera que ce numéro vous appartient.</Text><Text style={styles.label}>Numéro WhatsApp</Text><TextInput value={phoneNumber} onChangeText={setPhoneNumber} placeholder="+243 812 345 678" keyboardType="phone-pad" autoComplete="tel" style={styles.input} returnKeyType="done" onSubmitEditing={() => void requestCode()} /><Pressable disabled={busy} onPress={() => void requestCode()} style={({ pressed }) => [styles.yellowButton, busy && styles.disabled, pressed && styles.pressed]}>{busy ? <ActivityIndicator color="#062B5C" /> : <Text style={styles.yellowButtonText}>Recevoir le code SMS</Text>}</Pressable></> : stage === "code" ? <><Text style={styles.title}>Vérifier le code</Text><Text style={styles.subtitle}>{notice || "Saisissez le code reçu par SMS."}</Text><TextInput value={otpCode} onChangeText={setOtpCode} placeholder="000000" keyboardType="number-pad" autoComplete="sms-otp" maxLength={6} style={[styles.input, styles.codeInput]} returnKeyType="done" onSubmitEditing={() => void verifyCode()} /><Pressable disabled={busy} onPress={() => void verifyCode()} style={({ pressed }) => [styles.yellowButton, busy && styles.disabled, pressed && styles.pressed]}>{busy ? <ActivityIndicator color="#062B5C" /> : <Text style={styles.yellowButtonText}>Vérifier mon numéro</Text>}</Pressable><Pressable disabled={busy} onPress={() => setStage("phone")} style={styles.linkButton}><Text style={styles.linkText}>Modifier le numéro</Text></Pressable></> : <><Text style={styles.title}>Créer mon compte</Text><Text style={styles.subtitle}>Votre numéro est vérifié. Ajoutez votre nom pour personnaliser le suivi.</Text><Text style={styles.label}>Nom affiché</Text><TextInput value={displayName} onChangeText={setDisplayName} placeholder="Votre nom" autoComplete="name" style={styles.input} returnKeyType="done" onSubmitEditing={() => void completeProfile()} /><Pressable disabled={busy} onPress={() => void completeProfile()} style={({ pressed }) => [styles.yellowButton, busy && styles.disabled, pressed && styles.pressed]}>{busy ? <ActivityIndicator color="#062B5C" /> : <Text style={styles.yellowButtonText}>Ouvrir mon espace client</Text>}</Pressable></>;

  return <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={[styles.container, { backgroundColor: brandColor }]}><View style={styles.brand}>{agency?.logoUrl ? <Image source={{ uri: agency.logoUrl }} style={styles.portalLogo} /> : <GlobalLogixBrandLogo size="client" />}<RdcFlagAccent compact /><Text style={styles.brandTitle}>{brandName}</Text><Text style={styles.brandCopy}>{agency ? "Vos mises à jour colis, dans l’espace sécurisé de votre agence." : "Vos mises à jour colis, sur un espace personnel."}</Text></View><View style={styles.card}>{form}{error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}<View style={styles.security}><MaterialIcons name="verified-user" size={17} color={brandColor} /><Text style={styles.securityText}>Un numéro WhatsApp ne peut appartenir qu’à un seul compte client. Les colis des autres agences restent invisibles.</Text></View><Pressable onPress={() => router.back()} style={styles.backLink}><Text style={styles.backText}>Accès agence</Text></Pressable></View></KeyboardAvoidingView>;
}

const styles = StyleSheet.create({
  container: { backgroundColor: "#007FFF", flex: 1, justifyContent: "center", padding: 22 },
  brand: { alignItems: "center", marginBottom: 24 },
  brandTitle: { color: "#FFFFFF", fontSize: 27, fontWeight: "800", marginTop: 12 },
  brandCopy: { color: "#FFF6CC", fontSize: 13, marginTop: 6, textAlign: "center" },
  card: { backgroundColor: "#FFFFFF", borderRadius: 22, padding: 20 },
  title: { color: "#062B5C", fontSize: 23, fontWeight: "800" },
  subtitle: { color: "#5B6D84", fontSize: 13, lineHeight: 19, marginBottom: 20, marginTop: 8 },
  label: { color: "#062B5C", fontSize: 13, fontWeight: "800", marginBottom: 7 },
  input: { borderColor: "#B9D9F7", borderRadius: 12, borderWidth: 1, color: "#062B5C", fontSize: 16, height: 50, paddingHorizontal: 13 },
  codeInput: { fontFamily: "monospace", letterSpacing: 8, textAlign: "center" },
  yellowButton: { alignItems: "center", backgroundColor: "#F7D116", borderRadius: 12, height: 50, justifyContent: "center", marginTop: 12 },
  yellowButtonText: { color: "#062B5C", fontSize: 14, fontWeight: "800" },
  security: { alignItems: "flex-start", backgroundColor: "#E7F3FF", borderRadius: 12, flexDirection: "row", marginTop: 16, padding: 11 },
  securityText: { color: "#5B6D84", flex: 1, fontSize: 10, lineHeight: 15, marginLeft: 7 },
  error: { color: "#CE1126", fontSize: 12, fontWeight: "700", lineHeight: 17, marginTop: 11 },
  linkButton: { alignItems: "center", marginTop: 14 },
  linkText: { color: "#007FFF", fontSize: 12, fontWeight: "800" },
  backLink: { alignItems: "center", marginTop: 16 },
  backText: { color: "#5B6D84", fontSize: 12, fontWeight: "800" },
  disabled: { opacity: 0.55 },
  pressed: { opacity: 0.82, transform: [{ scale: 0.985 }] },
  portal: { backgroundColor: "#F4F9FF", flex: 1 },
  portalContent: { padding: 18, paddingBottom: 32 },
  portalHead: { alignItems: "flex-start", flexDirection: "row", justifyContent: "space-between" },
  eyebrow: { color: "#CE1126", fontSize: 10, fontWeight: "800", letterSpacing: 0.8 },
  portalTitle: { color: "#062B5C", fontSize: 27, fontWeight: "800", marginTop: 4 },
  portalSubtitle: { color: "#5B6D84", fontSize: 11, marginTop: 5 },
  iconButton: { alignItems: "center", backgroundColor: "#FFFFFF", borderColor: "#F0BAC2", borderRadius: 18, borderWidth: 1, height: 36, justifyContent: "center", width: 36 },
  addCard: { backgroundColor: "#FFFFFF", borderColor: "#B9D9F7", borderRadius: 16, borderWidth: 1, marginTop: 20, padding: 14 },
  addTitle: { color: "#062B5C", fontSize: 15, fontWeight: "800" },
  addCopy: { color: "#5B6D84", fontSize: 11, lineHeight: 16, marginTop: 4 },
  notice: { color: "#147A46", fontSize: 11, fontWeight: "700", lineHeight: 16, marginTop: 11 },
  sectionTitle: { color: "#5B6D84", fontSize: 10, fontWeight: "800", letterSpacing: 0.8, marginBottom: 9, marginTop: 20 },
  empty: { alignItems: "center", backgroundColor: "#FFFFFF", borderColor: "#D7E4F0", borderRadius: 16, borderWidth: 1, padding: 25 },
  emptyTitle: { color: "#062B5C", fontSize: 15, fontWeight: "800", marginTop: 8 },
  emptyText: { color: "#5B6D84", fontSize: 11, lineHeight: 16, marginTop: 5, textAlign: "center" },
  shipmentCard: { alignItems: "center", backgroundColor: "#FFFFFF", borderColor: "#D7E4F0", borderRadius: 15, borderWidth: 1, flexDirection: "row", marginTop: 9, padding: 12 },
  shipmentIcon: { alignItems: "center", backgroundColor: "#E7F3FF", borderRadius: 12, height: 40, justifyContent: "center", marginRight: 10, width: 40 },
  shipmentCopy: { flex: 1 },
  tracking: { color: "#062B5C", fontSize: 13, fontWeight: "800" },
  route: { color: "#5B6D84", fontSize: 10, marginTop: 3 },
  position: { color: "#007FFF", fontSize: 10, fontWeight: "700", marginTop: 4 },
  shipmentStatus: { alignItems: "flex-end" },
  progress: { color: "#062B5C", fontSize: 14, fontWeight: "800" },
  eta: { color: "#5B6D84", fontSize: 9, marginTop: 3 },
  webFallback: { alignItems: "center", backgroundColor: "#F4F9FF", flex: 1, justifyContent: "center", padding: 28 },
  webTitle: { color: "#062B5C", fontSize: 22, fontWeight: "800", marginTop: 14 },
  webCopy: { color: "#5B6D84", fontSize: 13, lineHeight: 19, marginTop: 8, textAlign: "center" },
  portalLogo: { height: 74, resizeMode: "contain", width: 74 },
});
