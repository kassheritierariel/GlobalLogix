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

async function ensureNotificationPermission() {
  if (Platform.OS === "web") {
    throw new Error("Le test de notification est disponible dans l’application Android ou iOS, pas sur le Web.");
  }
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("shipment_updates", {
      name: "Mises à jour d’expédition",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 220, 180, 220],
      lightColor: "#007FFF",
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
}

export async function triggerLocalNotificationTest() {
  await ensureNotificationPermission();
  return Notifications.scheduleNotificationAsync({
    content: {
      title: "Test GlobalLogix réussi",
      body: "Les notifications locales sont autorisées sur ce terminal.",
      sound: "default",
      data: { type: "local_notification_test" },
    },
    trigger: null,
  });
}

export async function requestExpoPushToken() {
  if (!Device.isDevice) {
    throw new Error("Les notifications push distantes nécessitent un appareil physique.");
  }

  await ensureNotificationPermission();

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
