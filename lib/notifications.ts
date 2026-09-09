import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { getApiBaseUrl } from "@/lib/api-base-url";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function requestExpoPushToken() {
  if (!Device.isDevice) {
    throw new Error("Les notifications push nécessitent un appareil physique.");
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("shipment_updates", {
      name: "Mises à jour d’expédition",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 220, 180, 220],
      lightColor: "#FF6B35",
    });
  }

  const permission = await Notifications.getPermissionsAsync();
  let status = permission.status;
  if (status !== "granted") {
    const requested = await Notifications.requestPermissionsAsync();
    status = requested.status;
  }
  if (status !== "granted") {
    throw new Error("Les notifications n’ont pas été autorisées.");
  }

  const projectId = Constants.easConfig?.projectId ?? Constants.expoConfig?.extra?.eas?.projectId;
  if (!projectId) {
    throw new Error("Identifiant de projet Expo manquant pour générer le token push.");
  }
  return (await Notifications.getExpoPushTokenAsync({ projectId })).data;
}

export async function registerPushTokenWithApi(token: string, firebaseToken: string) {
  const baseUrl = getApiBaseUrl();
  if (!baseUrl) throw new Error("URL de l’API mobile absente.");

  const response = await fetch(`${baseUrl}/api/push-tokens`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${firebaseToken}`,
    },
    body: JSON.stringify({ token, platform: Platform.OS }),
  });
  if (!response.ok) {
    throw new Error("Impossible d’enregistrer ce terminal pour les alertes.");
  }
}
