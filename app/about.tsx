import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { GlobalLogixBrandLogo } from "@/components/globallogix-brand-logo";
import { RdcFlagAccent } from "@/components/rdc-flag-accent";
import { ScreenContainer } from "@/components/screen-container";

const pillars = [
  { icon: "flight", title: "Visibilité multimodale", text: "Pilotez les expéditions aériennes, maritimes et terrestres dans une même tour de contrôle." },
  { icon: "verified-user", title: "Accès maîtrisés", text: "Les rôles Firebase et les périmètres d’agence protègent les opérations et les données clients." },
  { icon: "forum", title: "Suivi client simple", text: "Les liens sécurisés, QR codes et le portail client rapprochent chaque mise à jour du destinataire." },
];

export default function AboutScreen() {
  return (
    <ScreenContainer className="bg-background">
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.back, pressed && styles.pressed]} accessibilityRole="button" accessibilityLabel="Retour aux réglages">
          <MaterialIcons name="arrow-back" size={20} color="#062B5C" />
          <Text style={styles.backText}>Réglages</Text>
        </Pressable>

        <View style={styles.hero}>
          <GlobalLogixBrandLogo size="login" />
          <RdcFlagAccent compact />
          <Text style={styles.eyebrow}>GLOBALLOGIX MOBILE</Text>
          <Text style={styles.title}>La maîtrise de chaque mouvement.</Text>
          <Text style={styles.lead}>Une tour de contrôle logistique pensée pour suivre, partager et sécuriser les expéditions, où que vous soyez.</Text>
        </View>

        <View style={styles.statement}>
          <Text style={styles.statementTitle}>Une identité tournée vers le mouvement</Text>
          <Text style={styles.statementText}>Le bleu, le jaune et le rouge inspirés du drapeau de la RDC accompagnent une interface claire : le bleu pour piloter, le jaune pour agir et le rouge pour signaler les priorités.</Text>
        </View>

        <Text style={styles.sectionLabel}>NOS FONDATIONS</Text>
        {pillars.map((pillar) => (
          <View key={pillar.title} style={styles.pillar}>
            <View style={styles.pillarIcon}><MaterialIcons name={pillar.icon as never} size={22} color="#007FFF" /></View>
            <View style={styles.pillarCopy}><Text style={styles.pillarTitle}>{pillar.title}</Text><Text style={styles.pillarText}>{pillar.text}</Text></View>
          </View>
        ))}

        <View style={styles.footer}>
          <Text style={styles.footerBrand}>GLOBALLOGIX</Text>
          <Text style={styles.footerText}>Mobile · Android · iOS · Web</Text>
          <Text style={styles.footerText}>Version 1.0.0</Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 40 },
  back: { alignItems: "center", alignSelf: "flex-start", flexDirection: "row", gap: 6, minHeight: 40 },
  backText: { color: "#062B5C", fontSize: 14, fontWeight: "800" },
  hero: { alignItems: "center", marginTop: 12 },
  eyebrow: { color: "#CE1126", fontSize: 11, fontWeight: "800", letterSpacing: 1.2, marginTop: 18 },
  title: { color: "#062B5C", fontSize: 31, fontWeight: "900", letterSpacing: -0.7, marginTop: 8, textAlign: "center" },
  lead: { color: "#5B6D84", fontSize: 15, lineHeight: 23, marginTop: 12, maxWidth: 390, textAlign: "center" },
  statement: { backgroundColor: "#E7F3FF", borderRadius: 20, marginTop: 28, padding: 20 },
  statementTitle: { color: "#003F87", fontSize: 17, fontWeight: "900" },
  statementText: { color: "#36516F", fontSize: 13, lineHeight: 20, marginTop: 8 },
  sectionLabel: { color: "#CE1126", fontSize: 11, fontWeight: "900", letterSpacing: 1.2, marginBottom: 10, marginTop: 28 },
  pillar: { alignItems: "flex-start", backgroundColor: "#FFFFFF", borderColor: "#C7DBF3", borderRadius: 18, borderWidth: 1, flexDirection: "row", marginBottom: 10, padding: 16 },
  pillarIcon: { alignItems: "center", backgroundColor: "#E7F3FF", borderRadius: 14, height: 46, justifyContent: "center", marginRight: 13, width: 46 },
  pillarCopy: { flex: 1 },
  pillarTitle: { color: "#062B5C", fontSize: 15, fontWeight: "900" },
  pillarText: { color: "#5B6D84", fontSize: 12, lineHeight: 18, marginTop: 5 },
  footer: { alignItems: "center", marginTop: 22 },
  footerBrand: { color: "#062B5C", fontSize: 15, fontWeight: "900", letterSpacing: 1.6 },
  footerText: { color: "#718496", fontSize: 11, marginTop: 5 },
  pressed: { opacity: 0.75, transform: [{ scale: 0.98 }] },
});
