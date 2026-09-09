import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { updateShipmentClientPhone } from "@/lib/logistics-api";
import { maskWhatsAppNumber, normalizeWhatsAppNumber } from "@/lib/whatsapp-number";

export function ClientPhoneLink({ shipmentId }: { shipmentId: string }) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    try {
      setSaving(true);
      setError("");
      const normalized = normalizeWhatsAppNumber(phoneNumber);
      await updateShipmentClientPhone(shipmentId, normalized);
      setPhoneNumber("");
      setNotice(`Numéro client associé : ${maskWhatsAppNumber(normalized)}.`);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Association impossible.");
    } finally {
      setSaving(false);
    }
  };

  return <View style={styles.card}><View style={styles.head}><View style={styles.icon}><MaterialIcons name="phone-android" size={18} color="#007FFF" /></View><View style={styles.copy}><Text style={styles.title}>Rattacher le client SMS</Text><Text style={styles.subtitle}>Le client pourra enregistrer ce colis après vérification du même numéro WhatsApp.</Text></View></View><TextInput value={phoneNumber} onChangeText={setPhoneNumber} placeholder="+243 812 345 678" keyboardType="phone-pad" style={styles.input} returnKeyType="done" onSubmitEditing={() => void save()} /><Pressable disabled={saving} onPress={() => void save()} style={({ pressed }) => [styles.button, saving && styles.disabled, pressed && styles.pressed]}>{saving ? <ActivityIndicator color="#062B5C" /> : <Text style={styles.buttonText}>Associer ce numéro</Text>}</Pressable>{notice ? <Text style={styles.notice}>{notice}</Text> : null}{error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}</View>;
}

const styles = StyleSheet.create({
  card: { backgroundColor: "#FFFFFF", borderColor: "#B9D9F7", borderRadius: 14, borderWidth: 1, marginTop: 14, padding: 13 },
  head: { flexDirection: "row" },
  icon: { alignItems: "center", backgroundColor: "#E7F3FF", borderRadius: 10, height: 34, justifyContent: "center", marginRight: 9, width: 34 },
  copy: { flex: 1 },
  title: { color: "#062B5C", fontSize: 13, fontWeight: "800" },
  subtitle: { color: "#5B6D84", fontSize: 10, lineHeight: 15, marginTop: 3 },
  input: { borderColor: "#C7DBF3", borderRadius: 10, borderWidth: 1, color: "#062B5C", fontSize: 14, height: 44, marginTop: 11, paddingHorizontal: 11 },
  button: { alignItems: "center", backgroundColor: "#F7D116", borderRadius: 10, height: 42, justifyContent: "center", marginTop: 8 },
  buttonText: { color: "#062B5C", fontSize: 12, fontWeight: "800" },
  notice: { color: "#147A46", fontSize: 10, fontWeight: "700", marginTop: 8 },
  error: { color: "#CE1126", fontSize: 10, fontWeight: "700", lineHeight: 14, marginTop: 8 },
  disabled: { opacity: 0.55 },
  pressed: { opacity: 0.82 },
});
