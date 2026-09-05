import { Alert, Pressable, Share, StyleSheet, Text, View } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useState } from "react";

import { ClientPhoneLink } from "@/components/client-phone-link";
import type { TrackingShareLink } from "@/components/tracking-share-qr";
import { useAuth } from "@/lib/auth-context";
import { createShareLink, getPublicTrackingUrl } from "@/lib/logistics-api";

type ShareShipmentButtonProps = {
  shipmentId: string;
  trackingNumber: string;
  onLinkReady?: (link: TrackingShareLink) => void;
};

export function ShareShipmentButton({ shipmentId, trackingNumber, onLinkReady }: ShareShipmentButtonProps) {
  const [sharing, setSharing] = useState(false);
  const { user } = useAuth();
  const shareTracking = async () => {
    try {
      setSharing(true);
      const link = await createShareLink(shipmentId);
      const url = getPublicTrackingUrl(link.token);
      onLinkReady?.({ url, expiresAt: link.expiresAt });
      await Share.share({ title: `Suivi GlobalLogix · ${trackingNumber}`, message: `Suivez le colis ${trackingNumber} sur GlobalLogix : ${url}\nLien valable jusqu’au ${new Date(link.expiresAt).toLocaleString("fr-FR")}.`, url });
    } catch (error) {
      Alert.alert("Partage indisponible", error instanceof Error ? error.message : "Le lien de suivi sécurisé n’a pas pu être généré.");
    } finally {
      setSharing(false);
    }
  };
  return <View><Pressable disabled={sharing} onPress={() => void shareTracking()} style={({ pressed }) => [styles.button, pressed && styles.pressed, sharing && styles.disabled]}><MaterialIcons name="ios-share" size={17} color="#062B5C" /><Text style={styles.text}>{sharing ? "Création…" : "Partager le suivi"}</Text></Pressable>{user && user.role !== "viewer" && user.role !== "client" ? <ClientPhoneLink shipmentId={shipmentId} /> : null}</View>;
}

const styles = StyleSheet.create({
  button: { alignItems: "center", alignSelf: "flex-start", backgroundColor: "#FFF6CC", borderColor: "#F7D116", borderRadius: 10, borderWidth: 1, flexDirection: "row", marginTop: 14, paddingHorizontal: 11, paddingVertical: 9 },
  text: { color: "#062B5C", fontSize: 12, fontWeight: "800", marginLeft: 6 },
  pressed: { opacity: 0.78, transform: [{ scale: 0.985 }] },
  disabled: { opacity: 0.6 },
});
