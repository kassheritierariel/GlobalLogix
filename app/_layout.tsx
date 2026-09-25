import { router, Stack } from "expo-router";
import * as Notifications from "expo-notifications";
import { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { Platform } from "react-native";

import { AuthProvider } from "@/lib/auth-context";
import { TrackingProvider } from "@/lib/tracking-context";
import { ThemeProvider, useThemeContext } from "@/lib/theme-provider";
import { NetworkStatusBanner } from "@/components/network-status-banner";

function ThemedRootContent() {
  const { colorScheme } = useThemeContext();
  return <AuthProvider><TrackingProvider><StatusBar style={colorScheme === "dark" ? "light" : "dark"} /><Stack screenOptions={{ animation: Platform.OS === "web" ? "fade" : "slide_from_right", animationDuration: 220, headerShown: false }}><Stack.Screen name="login" options={{ animation: "fade" }} /><Stack.Screen name="client" /><Stack.Screen name="client-shipment/[id]" /><Stack.Screen name="privacy" /><Stack.Screen name="account-deletion" /><Stack.Screen name="(tabs)" options={{ animation: "fade" }} /><Stack.Screen name="profile" /><Stack.Screen name="team" /><Stack.Screen name="shipment/[id]" /><Stack.Screen name="agency/[slug]" /><Stack.Screen name="agency-directory" /><Stack.Screen name="agency-signup" /><Stack.Screen name="agency-registration-requests" /><Stack.Screen name="agency-settings" /><Stack.Screen name="agency-clients" /><Stack.Screen name="agency-client/[id]" /><Stack.Screen name="agency-analytics" /><Stack.Screen name="firebase-sms-test" /><Stack.Screen name="agency-preview" /><Stack.Screen name="central-console" /><Stack.Screen name="subscription" /></Stack><NetworkStatusBanner /></TrackingProvider></AuthProvider>;
}

export default function RootLayout() {
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const target = response.notification.request.content.data?.url;
      if (target === "/tracking") router.push("/tracking" as never);
    });
    return () => subscription.remove();
  }, []);

  return (
    <ThemeProvider>
      <ThemedRootContent />
    </ThemeProvider>
  );
}
