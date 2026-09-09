import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Pressable, StyleSheet, Text, View } from "react-native";

export function ScrollJumpControls({ onTop, onBottom, dark = false }: { onTop: () => void; onBottom: () => void; dark?: boolean }) {
  return <View pointerEvents="box-none" style={styles.wrap}>
    <Pressable accessibilityRole="button" accessibilityLabel="Revenir en haut de la page" onPress={onTop} style={({ pressed }) => [styles.button, dark && styles.buttonDark, pressed && styles.pressed]}><MaterialIcons name="keyboard-arrow-up" size={22} color={dark ? "#FFFFFF" : "#062B5C"} /><Text style={[styles.label, dark && styles.labelDark]}>Haut</Text></Pressable>
    <Pressable accessibilityRole="button" accessibilityLabel="Aller en bas de la page" onPress={onBottom} style={({ pressed }) => [styles.button, dark && styles.buttonDark, pressed && styles.pressed]}><Text style={[styles.label, dark && styles.labelDark]}>Bas</Text><MaterialIcons name="keyboard-arrow-down" size={22} color={dark ? "#FFFFFF" : "#062B5C"} /></Pressable>
  </View>;
}

const styles = StyleSheet.create({ wrap: { bottom: 14, flexDirection: "row", gap: 7, position: "absolute", right: 14 }, button: { alignItems: "center", backgroundColor: "#FFFFFF", borderColor: "#B9D9F7", borderRadius: 18, borderWidth: 1, elevation: 4, flexDirection: "row", gap: 1, height: 36, justifyContent: "center", paddingHorizontal: 10 }, buttonDark: { backgroundColor: "#173858", borderColor: "#5982A6" }, label: { color: "#062B5C", fontSize: 10, fontWeight: "900" }, labelDark: { color: "#FFFFFF" }, pressed: { opacity: 0.8, transform: [{ scale: 0.97 }] } });
