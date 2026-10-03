import type { ComponentProps } from "react";
import { StyleSheet, Text } from "react-native";

import type MaterialIcons from "@expo/vector-icons/MaterialIcons";

export type MaterialIconProps = ComponentProps<typeof MaterialIcons>;

const EXACT_SYMBOLS: Record<string, string> = {
  add: "+",
  check: "✓",
  close: "×",
  delete: "×",
  "dark-mode": "◐",
  download: "↓",
  edit: "✎",
  flight: "✈",
  info: "i",
  "light-mode": "☀",
  lock: "◆",
  logout: "↪",
  mail: "@",
  menu: "≡",
  more: "…",
  pause: "Ⅱ",
  phone: "☎",
  play: "▶",
  print: "▣",
  refresh: "↻",
  search: "⌕",
  send: "➤",
  share: "↗",
  sync: "↻",
  upload: "↑",
  warning: "!",
  wifi: "⌁",
  "wifi-off": "×",
};

function resolveSymbol(name: string) {
  if (EXACT_SYMBOLS[name]) return EXACT_SYMBOLS[name];
  if (name.includes("chevron-left") || name.includes("arrow-back")) return "‹";
  if (name.includes("chevron-right") || name.includes("arrow-forward")) return "›";
  if (name.includes("arrow-up") || name.includes("keyboard-arrow-up")) return "↑";
  if (name.includes("arrow-down") || name.includes("keyboard-arrow-down")) return "↓";
  if (name.includes("check") || name.includes("done") || name.includes("verified") || name.includes("task-alt")) return "✓";
  if (name.includes("error") || name.includes("warning") || name.includes("priority-high")) return "!";
  if (name.includes("flight") || name.includes("airplanemode")) return "✈";
  if (name.includes("boat") || name.includes("water")) return "≈";
  if (name.includes("shipping") || name.includes("truck") || name.includes("local-shipping")) return "▰";
  if (name.includes("person") || name.includes("people") || name.includes("group") || name.includes("account")) return "●";
  if (name.includes("notification")) return "◉";
  if (name.includes("visibility")) return "◉";
  if (name.includes("location") || name.includes("place") || name.includes("map")) return "◆";
  if (name.includes("dashboard") || name.includes("analytics") || name.includes("insights") || name.includes("assessment")) return "▦";
  if (name.includes("calendar") || name.includes("date")) return "□";
  if (name.includes("image") || name.includes("camera") || name.includes("photo")) return "▧";
  if (name.includes("settings") || name.includes("build")) return "⚙";
  if (name.includes("security") || name.includes("shield") || name.includes("lock")) return "◆";
  if (name.includes("link") || name.includes("public") || name.includes("language")) return "◇";
  if (name.includes("home") || name.includes("business") || name.includes("store")) return "■";
  if (name.includes("payment") || name.includes("credit") || name.includes("receipt")) return "$";
  if (name.includes("history") || name.includes("schedule") || name.includes("time")) return "◷";
  if (name.includes("play")) return "▶";
  if (name.includes("pause")) return "Ⅱ";
  if (name.includes("add")) return "+";
  if (name.includes("remove") || name.includes("delete")) return "−";
  return "•";
}

export function MaterialIcon({ name, size = 24, color = "currentColor", style, ...props }: MaterialIconProps) {
  return (
    <Text
      {...props}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.icon, { color, fontSize: size, height: size, lineHeight: size, width: size }, style]}
    >
      {resolveSymbol(String(name))}
    </Text>
  );
}

const styles = StyleSheet.create({
  icon: {
    fontFamily: "Arial",
    fontWeight: "800",
    textAlign: "center",
  },
});
