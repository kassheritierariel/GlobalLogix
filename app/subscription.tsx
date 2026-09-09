import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as Linking from "expo-linking";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { GlobalLogixBrandLogo } from "@/components/globallogix-brand-logo";
import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/lib/auth-context";
import { BillingCycles, SAAS_PLANS, type BillingCycle, type SaaSPlanId } from "@/lib/saas-plans";
import { fetchAgencySubscription, fetchSaasTransactions, startSaasCheckout, type AgencySubscription, type SaaSTransaction } from "@/lib/saas-api";

const statusLabel: Record<NonNullable<AgencySubscription>["status"], string> = {
  trial: "Essai", pending_payment: "Paiement en attente", active: "Actif", past_due: "À régulariser", cancelled: "Annulé", expired: "Expiré",
};

export default function SubscriptionScreen() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<AgencySubscription | null>(null);
  const [transactions, setTransactions] = useState<SaaSTransaction[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<SaaSPlanId>("operations");
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [countryCode, setCountryCode] = useState("CD");
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [message, setMessage] = useState("");

  const selectedPlan = useMemo(() => SAAS_PLANS.find((plan) => plan.id === selectedPlanId) ?? SAAS_PLANS[1], [selectedPlanId]);
  const isBillingAdmin = user?.role === "agency_admin" || user?.role === "super_admin";

  const refresh = async () => {
    const [subscriptionResult, transactionsResult] = await Promise.all([fetchAgencySubscription(), fetchSaasTransactions()]);
    setSubscription(subscriptionResult.subscription);
    setTransactions(transactionsResult.transactions);
    if (subscriptionResult.subscription?.planId) setSelectedPlanId(subscriptionResult.subscription.planId);
  };

  useEffect(() => {
    if (!isBillingAdmin) return;
    void refresh().catch((error) => setMessage(error instanceof Error ? error.message : "Souscription indisponible.")).finally(() => setLoading(false));
  }, [isBillingAdmin]);

  const openCheckout = async () => {
    try {
      setPaying(true);
      setMessage("");
      const phone = phoneNumber.replace(/\D/g, "");
      const result = await startSaasCheckout({ planId: selectedPlanId, billingCycle, phoneNumber: phone, countryCode: countryCode.trim().toUpperCase() });
      await Linking.openURL(result.checkoutUrl);
      setMessage("La page de paiement Chariow est ouverte. Votre accès sera activé seulement après confirmation sécurisée du paiement.");
      await refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Ouverture du paiement impossible.");
    } finally {
      setPaying(false);
    }
  };

  if (!isBillingAdmin) {
    return <ScreenContainer className="bg-background"><View style={styles.denied}><MaterialIcons name="lock" size={34} color="#CE1126" /><Text style={styles.deniedTitle}>Gestion réservée</Text><Text style={styles.deniedText}>Seuls les administrateurs d’agence et le super administrateur peuvent gérer une souscription.</Text><Pressable onPress={() => router.back()} style={styles.outlineButton}><Text style={styles.outlineButtonText}>Retour</Text></Pressable></View></ScreenContainer>;
  }

  return <ScreenContainer className="bg-background"><ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.back, pressed && styles.pressed]}><MaterialIcons name="arrow-back" size={20} color="#062B5C" /><Text style={styles.backText}>Réglages</Text></Pressable>
    <View style={styles.hero}><GlobalLogixBrandLogo size="dashboard" /><View><Text style={styles.eyebrow}>GLOBALLOGIX SaaS</Text><Text style={styles.title}>Plan de votre agence</Text><Text style={styles.subtitle}>Choisissez une licence adaptée à vos opérations. Aucun accès n’est modifié avant le paiement confirmé.</Text></View></View>
    {loading ? <ActivityIndicator color="#007FFF" style={styles.loader} /> : <View style={styles.current}><View><Text style={styles.currentLabel}>STATUT ACTUEL</Text><Text style={styles.currentValue}>{subscription ? statusLabel[subscription.status] : "Aucun abonnement actif"}</Text></View><View style={styles.statusPill}><Text style={styles.statusPillText}>{subscription?.planId ? subscription.planId.toUpperCase() : "À CONFIGURER"}</Text></View>{subscription?.endsAt ? <Text style={styles.currentMeta}>Échéance : {new Date(subscription.endsAt).toLocaleDateString("fr-FR")}</Text> : null}</View>}
    <Text style={styles.sectionTitle}>CHOISIR UNE LICENCE</Text>
    {SAAS_PLANS.map((plan) => <Pressable key={plan.id} disabled={paying} onPress={() => setSelectedPlanId(plan.id)} style={({ pressed }) => [styles.plan, selectedPlanId === plan.id && styles.planActive, pressed && styles.pressed]}><View style={styles.planTop}><View style={[styles.planIcon, selectedPlanId === plan.id && styles.planIconActive]}><MaterialIcons name={plan.id === "starter" ? "rocket-launch" : plan.id === "operations" ? "hub" : "business"} size={20} color={selectedPlanId === plan.id ? "#FFFFFF" : "#007FFF"} /></View><View style={styles.planCopy}><Text style={styles.planName}>{plan.name}</Text><Text style={styles.planDescription}>{plan.description}</Text></View>{selectedPlanId === plan.id ? <MaterialIcons name="check-circle" size={22} color="#007FFF" /> : null}</View><Text style={styles.planLimits}>{plan.shipmentLimit === null ? "Expéditions illimitées" : `${plan.shipmentLimit.toLocaleString("fr-FR")} expéditions`} · {plan.teamMemberLimit === null ? "équipe illimitée" : `${plan.teamMemberLimit} membres`}</Text></Pressable>)}
    <Text style={styles.fieldLabel}>PÉRIODICITÉ</Text><View style={styles.chips}>{BillingCycles.map((cycle) => <Pressable key={cycle} onPress={() => setBillingCycle(cycle)} style={({ pressed }) => [styles.chip, billingCycle === cycle && styles.chipActive, pressed && styles.pressed]}><Text style={[styles.chipText, billingCycle === cycle && styles.chipTextActive]}>{cycle === "monthly" ? "Mensuelle" : "Annuelle"}</Text></Pressable>)}</View>
    <Text style={styles.fieldLabel}>CONTACT DE FACTURATION</Text><View style={styles.contactRow}><TextInput value={countryCode} onChangeText={setCountryCode} autoCapitalize="characters" maxLength={2} placeholder="CD" style={[styles.input, styles.country]} /><TextInput value={phoneNumber} onChangeText={setPhoneNumber} keyboardType="phone-pad" placeholder="Numéro sans + ni espaces" style={[styles.input, styles.phone]} /></View>
    <Pressable disabled={paying || loading} onPress={() => void openCheckout()} style={({ pressed }) => [styles.payButton, (paying || loading) && styles.disabled, pressed && styles.pressed]}>{paying ? <ActivityIndicator color="#062B5C" /> : <><MaterialIcons name="payments" size={20} color="#062B5C" /><Text style={styles.payButtonText}>Continuer vers le paiement Chariow</Text></>}</Pressable>
    {message ? <Text style={styles.message}>{message}</Text> : null}
    <Text style={styles.sectionTitle}>HISTORIQUE DES TRANSACTIONS</Text>{transactions.length ? transactions.map((transaction) => <View key={transaction.id} style={styles.transaction}><View><Text style={styles.transactionTitle}>{transaction.planId.toUpperCase()} · {transaction.billingCycle === "monthly" ? "Mensuel" : "Annuel"}</Text><Text style={styles.transactionDate}>{new Date(transaction.createdAt).toLocaleDateString("fr-FR")}</Text></View><Text style={styles.transactionStatus}>{transaction.status.replace(/_/g, " ")}</Text></View>) : <Text style={styles.empty}>Les demandes de paiement et confirmations Chariow apparaîtront ici.</Text>}
  </ScrollView></ScreenContainer>;
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 42 }, back: { alignItems: "center", alignSelf: "flex-start", flexDirection: "row", gap: 6, minHeight: 40 }, backText: { color: "#062B5C", fontSize: 14, fontWeight: "800" }, hero: { alignItems: "center", flexDirection: "row", gap: 14, marginBottom: 20, marginTop: 10 }, eyebrow: { color: "#CE1126", fontSize: 10, fontWeight: "900", letterSpacing: 1 }, title: { color: "#062B5C", fontSize: 27, fontWeight: "900", marginTop: 4 }, subtitle: { color: "#5B6D84", fontSize: 12, lineHeight: 18, marginTop: 5, maxWidth: 230 }, loader: { marginVertical: 28 }, current: { backgroundColor: "#E7F3FF", borderRadius: 18, marginBottom: 24, padding: 16 }, currentLabel: { color: "#003F87", fontSize: 10, fontWeight: "900", letterSpacing: 1 }, currentValue: { color: "#062B5C", fontSize: 18, fontWeight: "900", marginTop: 5 }, currentMeta: { color: "#5B6D84", fontSize: 12, marginTop: 8 }, statusPill: { alignSelf: "flex-start", backgroundColor: "#F7D116", borderRadius: 20, marginTop: 10, paddingHorizontal: 9, paddingVertical: 5 }, statusPillText: { color: "#062B5C", fontSize: 10, fontWeight: "900" }, sectionTitle: { color: "#CE1126", fontSize: 11, fontWeight: "900", letterSpacing: 1.1, marginBottom: 10, marginTop: 18 }, plan: { backgroundColor: "#FFFFFF", borderColor: "#C7DBF3", borderRadius: 18, borderWidth: 1, marginBottom: 10, padding: 15 }, planActive: { borderColor: "#007FFF", borderWidth: 2 }, planTop: { alignItems: "flex-start", flexDirection: "row" }, planIcon: { alignItems: "center", backgroundColor: "#E7F3FF", borderRadius: 13, height: 42, justifyContent: "center", marginRight: 11, width: 42 }, planIconActive: { backgroundColor: "#007FFF" }, planCopy: { flex: 1 }, planName: { color: "#062B5C", fontSize: 16, fontWeight: "900" }, planDescription: { color: "#5B6D84", fontSize: 11, lineHeight: 16, marginTop: 3 }, planLimits: { color: "#003F87", fontSize: 11, fontWeight: "700", marginLeft: 53, marginTop: 9 }, fieldLabel: { color: "#062B5C", fontSize: 12, fontWeight: "900", marginBottom: 8, marginTop: 16 }, chips: { flexDirection: "row", gap: 9 }, chip: { alignItems: "center", borderColor: "#B9D9F7", borderRadius: 12, borderWidth: 1, flex: 1, height: 43, justifyContent: "center" }, chipActive: { backgroundColor: "#007FFF", borderColor: "#007FFF" }, chipText: { color: "#062B5C", fontSize: 12, fontWeight: "800" }, chipTextActive: { color: "#FFFFFF" }, contactRow: { flexDirection: "row", gap: 9 }, input: { borderColor: "#B9D9F7", borderRadius: 12, borderWidth: 1, color: "#062B5C", fontSize: 14, height: 48, paddingHorizontal: 12 }, country: { width: 62 }, phone: { flex: 1 }, payButton: { alignItems: "center", backgroundColor: "#F7D116", borderRadius: 14, flexDirection: "row", gap: 8, height: 54, justifyContent: "center", marginTop: 16 }, payButtonText: { color: "#062B5C", fontSize: 14, fontWeight: "900" }, message: { color: "#147A46", fontSize: 12, lineHeight: 18, marginTop: 12, textAlign: "center" }, transaction: { alignItems: "center", backgroundColor: "#FFFFFF", borderColor: "#D9EAFB", borderRadius: 14, borderWidth: 1, flexDirection: "row", justifyContent: "space-between", marginBottom: 8, padding: 13 }, transactionTitle: { color: "#062B5C", fontSize: 12, fontWeight: "900" }, transactionDate: { color: "#718496", fontSize: 11, marginTop: 4 }, transactionStatus: { color: "#003F87", fontSize: 10, fontWeight: "900", textTransform: "uppercase" }, empty: { color: "#718496", fontSize: 12, lineHeight: 18, textAlign: "center" }, denied: { alignItems: "center", flex: 1, justifyContent: "center", padding: 28 }, deniedTitle: { color: "#062B5C", fontSize: 21, fontWeight: "900", marginTop: 14 }, deniedText: { color: "#5B6D84", fontSize: 14, lineHeight: 21, marginTop: 8, textAlign: "center" }, outlineButton: { alignItems: "center", borderColor: "#007FFF", borderRadius: 12, borderWidth: 1, height: 46, justifyContent: "center", marginTop: 18, paddingHorizontal: 25 }, outlineButtonText: { color: "#007FFF", fontSize: 13, fontWeight: "900" }, pressed: { opacity: 0.78, transform: [{ scale: 0.985 }] }, disabled: { opacity: 0.58 },
});
