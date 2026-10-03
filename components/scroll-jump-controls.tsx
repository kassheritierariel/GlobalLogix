import { MaterialIcon } from "@/components/material-icon";
import { StyleSheet, Text, View } from "react-native";

import { AnimatedPressable } from "@/components/animated-pressable";
import { ThemeToggleButton } from "@/components/theme-toggle-button";
import { useThemeContext } from "@/lib/theme-provider";

export function ScrollJumpControls({ onTop, onBottom, dark }: { onTop: () => void; onBottom: () => void; dark?: boolean }) {
  const { colorScheme } = useThemeContext();
  const isDark = dark ?? colorScheme === "dark";

  return <View pointerEvents="box-none" style={styles.wrap}>
    <ThemeToggleButton />
    <AnimatedPressable accessibilityRole="button" accessibilityLabel="Revenir en haut de la page" hapticFeedback="selection" onPress={onTop} style={[styles.button, isDark && styles.buttonDark]}><MaterialIcon name="keyboard-arrow-up" size={22} color={isDark ? "#FFFFFF" : "#062B5C"} /><Text style={[styles.label, isDark && styles.labelDark]}>Haut</Text></AnimatedPressable>
    <AnimatedPressable accessibilityRole="button" accessibilityLabel="Aller en bas de la page" hapticFeedback="selection" onPress={onBottom} style={[styles.button, isDark && styles.buttonDark]}><Text style={[styles.label, isDark && styles.labelDark]}>Bas</Text><MaterialIcon name="keyboard-arrow-down" size={22} color={isDark ? "#FFFFFF" : "#062B5C"} /></AnimatedPressable>
  </View>;
}

const styles = StyleSheet.create({ wrap: { alignItems: "center", bottom: 14, flexDirection: "row", gap: 7, position: "absolute", right: 14, zIndex: 40 }, button: { alignItems: "center", backgroundColor: "#FFFFFF", borderColor: "#B9D9F7", borderRadius: 18, borderWidth: 1, elevation: 4, flexDirection: "row", gap: 1, height: 36, justifyContent: "center", paddingHorizontal: 10 }, buttonDark: { backgroundColor: "#173858", borderColor: "#5982A6" }, label: { color: "#062B5C", fontSize: 10, fontWeight: "900" }, labelDark: { color: "#FFFFFF" } });
