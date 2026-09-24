import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";

const SECTIONS = [
  {
    title: "1. Responsable et portée",
    body: "GlobalLogix est une plateforme SaaS de gestion logistique multi-agence éditée pour les agences clientes. Chaque agence gère ses opérations dans un périmètre isolé. Pour toute question relative aux données personnelles, contactez info@telgroups.org.",
  },
  {
    title: "2. Données traitées",
    body: "Selon votre rôle, nous pouvons traiter votre identité Firebase, adresse e-mail, numéro de téléphone vérifié, rôle et agence, informations d’agence, références de colis, coordonnées de livraison, positions et événements de transit, images de colis, jetons de notification et journaux techniques. Les secrets de connexion Meta sont chiffrés côté serveur et ne sont jamais affichés aux utilisateurs.",
  },
  {
    title: "3. Finalités",
    body: "Ces données servent à authentifier les utilisateurs, isoler les agences, gérer les expéditions, fournir le suivi en temps réel, prévenir les incidents, envoyer les notifications autorisées, produire des rapports et assurer la sécurité du service. Elles ne sont pas vendues.",
  },
  {
    title: "4. Prestataires",
    body: "GlobalLogix utilise Google Firebase pour l’authentification et les notifications, Expo pour les builds et notifications mobiles, et l’infrastructure d’hébergement de l’application. Meta WhatsApp Business et Chariow ne traitent des données que lorsqu’une agence ou l’éditeur active réellement ces services. Les canaux non configurés restent inactifs.",
  },
  {
    title: "5. Sécurité et isolation",
    body: "Les échanges utilisent HTTPS. Les autorisations reposent sur des rôles Firebase et un identifiant d’agence. Les requêtes sensibles sont vérifiées côté serveur. Les secrets de canaux sont chiffrés et les numéros clients ne sont pas exposés dans les tableaux de bord globaux.",
  },
  {
    title: "6. Conservation et suppression",
    body: "Les données sont conservées pendant la durée nécessaire à la fourniture du service, au suivi des opérations et aux obligations légales applicables. Un utilisateur peut demander la suppression depuis Réglages > Confidentialité et suppression. Les comptes clients et utilisateurs non administrateurs peuvent être supprimés immédiatement après confirmation. Les comptes administrateurs font l’objet d’une revue afin de préserver les obligations contractuelles et les données de l’agence.",
  },
  {
    title: "7. Vos droits",
    body: "Vous pouvez demander l’accès, la rectification ou la suppression de vos données. Vous pouvez aussi retirer une autorisation de notification dans les réglages de votre appareil. Envoyez toute demande à info@telgroups.org en précisant l’adresse ou le numéro associé au compte, sans transmettre votre mot de passe ni un code SMS.",
  },
  {
    title: "8. Mise à jour",
    body: "Cette politique est applicable à compter du 24 septembre 2026. Toute modification importante sera publiée dans l’application et sur cette page.",
  },
] as const;

export default function PrivacyScreen() {
  return (
    <ScreenContainer className="bg-background">
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable onPress={() => router.canGoBack() ? router.back() : router.replace("/login" as never)} style={({ pressed }) => [styles.back, pressed && styles.pressed]}>
          <Text style={styles.backText}>‹ Retour</Text>
        </Pressable>
        <Text style={styles.eyebrow}>GLOBALLOGIX</Text>
        <Text style={styles.title}>Politique de confidentialité</Text>
        <Text style={styles.lead}>Cette politique explique comment GlobalLogix traite les données des agences, équipes et clients qui utilisent la plateforme Web, Android ou iOS.</Text>
        {SECTIONS.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.body}>{section.body}</Text>
          </View>
        ))}
        <Pressable onPress={() => router.push("/account-deletion" as never)} style={({ pressed }) => [styles.action, pressed && styles.pressed]}>
          <Text style={styles.actionText}>Demander la suppression de mon compte</Text>
        </Pressable>
        <Text style={styles.contact}>Contact confidentialité : info@telgroups.org</Text>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { alignSelf: "center", maxWidth: 820, padding: 22, paddingBottom: 48, width: "100%" },
  back: { alignSelf: "flex-start", minHeight: 40, justifyContent: "center", marginBottom: 18 },
  backText: { color: "#235B9D", fontSize: 15, fontWeight: "800" },
  eyebrow: { color: "#CE1126", fontSize: 11, fontWeight: "900", letterSpacing: 1.2 },
  title: { color: "#062B5C", fontSize: 30, fontWeight: "900", lineHeight: 37, marginTop: 6 },
  lead: { color: "#4F6578", fontSize: 15, lineHeight: 23, marginBottom: 8, marginTop: 12 },
  section: { backgroundColor: "#FFFFFF", borderColor: "#D9E2EC", borderRadius: 16, borderWidth: 1, marginTop: 12, padding: 16 },
  sectionTitle: { color: "#062B5C", fontSize: 15, fontWeight: "900" },
  body: { color: "#4F6578", fontSize: 13, lineHeight: 21, marginTop: 7 },
  action: { alignItems: "center", backgroundColor: "#CE1126", borderRadius: 14, justifyContent: "center", marginTop: 20, minHeight: 52, paddingHorizontal: 18 },
  actionText: { color: "#FFFFFF", fontSize: 14, fontWeight: "900", textAlign: "center" },
  contact: { color: "#5B6D84", fontSize: 12, marginTop: 18, textAlign: "center" },
  pressed: { opacity: 0.8, transform: [{ scale: 0.985 }] },
});
