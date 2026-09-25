import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import type { ComponentProps } from "react";

export type MaterialIconProps = ComponentProps<typeof MaterialIcons>;

export function MaterialIcon(props: MaterialIconProps) {
  return <MaterialIcons {...props} />;
}
