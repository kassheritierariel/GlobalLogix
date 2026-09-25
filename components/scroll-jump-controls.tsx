import { MaterialIcon } from "@/components/material-icon";
import { StyleSheet, Text, View } from "react-native";

import { AnimatedPressable } from "@/components/animated-pressable";

export function ScrollJumpControls({ onTop, onBottom, dark = false }: { onTop: () => void; onBottom: () => void; dark?: boolean }) {
  return <View pointerEvents="box-none" style={styles.wrap}>
    <AnimatedPressable accessibilityRole="button" accessibilityLabel="Revenir en haut de la page" hapticFeedback="selection" onPress={onTop} style={[styles.button, dark && styles.buttonDark]}><MaterialIcon name="keyboard-arrow-up" size={22} color={dark ? "#FFFFFF" : "#062B5C"} /><Text style={[styles.label, dark && styles.labelDark]}>Haut</Text></AnimatedPressable>
    <AnimatedPressable accessibilityRole="button" accessibilityLabel="Aller en bas de la page" hapticFeedback="selection" onPress={onBottom} style={[styles.button, dark && styles.buttonDark]}><Text style={[styles.label, dark && styles.labelDark]}>Bas</Text><MaterialIcon name="keyboard-arrow-down" size={22} color={dark ? "#FFFFFF" : "#062B5C"} /></AnimatedPressable>
  </View>;
}

const styles = StyleSheet.create({ wrap: { bottom: 14, flexDirection: "row", gap: 7, position: "absolute", right: 14 }, button: { alignItems: "center", backgroundColor: "#FFFFFF", borderColor: "#B9D9F7", borderRadius: 18, borderWidth: 1, elevation: 4, flexDirection: "row", gap: 1, height: 36, justifyContent: "center", paddingHorizontal: 10 }, buttonDark: { backgroundColor: "#173858", borderColor: "#5982A6" }, label: { color: "#062B5C", fontSize: 10, fontWeight: "900" }, labelDark: { color: "#FFFFFF" } });
