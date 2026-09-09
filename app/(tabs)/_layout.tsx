import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Redirect, Tabs } from "expo-router";
import { ActivityIndicator, Platform, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/lib/auth-context";

export default function TabLayout() {
  const { user, isRestoring } = useAuth();
  const insets = useSafeAreaInsets();
  const bottomPadding = Platform.OS === "web" ? 10 : Math.max(insets.bottom, 10);

  if (isRestoring) {
    return <View style={styles.loading}><ActivityIndicator color="#FF6B35" size="large" /></View>;
  }
  if (!user) {
    return <Redirect href={"/login" as never} />;
  }
  if (user.role === "client") {
    return <Redirect href={"/client" as never} />;
  }

  return (
    <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: "#003F87", tabBarInactiveTintColor: "#58708A", tabBarHideOnKeyboard: true, tabBarItemStyle: styles.tabItem, tabBarStyle: [styles.tabBar, { height: 58 + bottomPadding, paddingBottom: bottomPadding }], tabBarLabelStyle: styles.tabLabel }}>
      <Tabs.Screen name="index" options={{ title: "Accueil", tabBarIcon: ({ color, size }) => <MaterialIcons name="space-dashboard" size={size} color={color} /> }} />
      <Tabs.Screen name="shipments" options={{ title: "Expéditions", tabBarIcon: ({ color, size }) => <MaterialIcons name="inventory-2" size={size} color={color} /> }} />
      <Tabs.Screen name="tracking" options={{ title: "Suivi", tabBarIcon: ({ color, size }) => <MaterialIcons name="my-location" size={size} color={color} /> }} />
      <Tabs.Screen name="exceptions" options={{ title: "Alertes", tabBarIcon: ({ color, size }) => <MaterialIcons name="warning-amber" size={size} color={color} /> }} />
      <Tabs.Screen name="settings" options={{ title: "Réglages", tabBarIcon: ({ color, size }) => <MaterialIcons name="settings" size={size} color={color} /> }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  loading: { alignItems: "center", backgroundColor: "#E8F0F8", flex: 1, justifyContent: "center" },
  tabBar: { backgroundColor: "#FFFFFF", borderTopColor: "#B9D9F7", borderTopWidth: 1, elevation: 12, paddingTop: 6 },
  tabItem: { minWidth: 58, paddingHorizontal: 1 },
  tabLabel: { fontSize: 10, fontWeight: "800", lineHeight: 13 },
});
