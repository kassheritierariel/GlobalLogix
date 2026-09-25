import { Image, StyleSheet, View } from "react-native";

type BrandLogoSize = "login" | "client" | "dashboard";

const dimensions: Record<BrandLogoSize, { width: number; height: number }> = {
  login: { width: 188, height: 126 },
  client: { width: 146, height: 98 },
  dashboard: { width: 116, height: 78 },
};

export function GlobalLogixBrandLogo({ size = "login" }: { size?: BrandLogoSize }) {
  const dimension = dimensions[size];
  return (
    <View accessibilityRole="image" accessibilityLabel="Logo GlobalLogix" style={[styles.wrap, dimension]}>
      <Image source={require("../assets/images/globallogix-logo.png")} resizeMode="contain" style={styles.image} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", justifyContent: "center" },
  image: { height: "100%", width: "100%" },
});
