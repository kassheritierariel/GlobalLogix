import { MaterialIcon } from "@/components/material-icon";
import { AnimatedPressable } from "@/components/animated-pressable";
import { useThemeContext } from "@/lib/theme-provider";
import { StyleSheet, type StyleProp, type ViewStyle } from "react-native";

export function ThemeToggleButton({ style }: { style?: StyleProp<ViewStyle> }) {
  const { colorScheme, setColorScheme } = useThemeContext();
  const dark = colorScheme === "dark";

  return (
    <AnimatedPressable
      accessibilityLabel={dark ? "Activer le mode clair" : "Activer le mode sombre"}
      accessibilityRole="button"
      hapticFeedback="selection"
      onPress={() => setColorScheme(dark ? "light" : "dark")}
      style={[styles.button, dark && styles.buttonDark, style]}
    >
      <MaterialIcon name={dark ? "light-mode" : "dark-mode"} size={20} color={dark ? "#F7D116" : "#062B5C"} />
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  button: { alignItems: "center", backgroundColor: "#F7D116", borderColor: "#E2BC00", borderRadius: 20, borderWidth: 1, elevation: 5, height: 40, justifyContent: "center", shadowColor: "#001D3D", shadowOffset: { height: 4, width: 0 }, shadowOpacity: 0.18, shadowRadius: 8, width: 40 },
  buttonDark: { backgroundColor: "#173858", borderColor: "#5982A6" },
});
