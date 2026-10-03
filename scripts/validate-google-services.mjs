import { chmodSync, copyFileSync, existsSync, readFileSync } from "node:fs";
import { isAbsolute, resolve } from "node:path";

const expectedProjectId = "globallogix-74286";
const expectedPackageName = "com.app.globallogixmobile";
const expectedBundleIdentifier = "com.app.globallogixmobile";
const buildPlatform = process.env.EAS_BUILD_PLATFORM?.trim() || "android";

function absolutePath(configuredPath) {
  return isAbsolute(configuredPath) ? configuredPath : resolve(process.cwd(), configuredPath);
}

function copyProtected(sourcePath, destinationName) {
  const destinationPath = resolve(process.cwd(), destinationName);
  if (sourcePath !== destinationPath) copyFileSync(sourcePath, destinationPath);
  chmodSync(destinationPath, 0o600);
  if (!existsSync(destinationPath)) {
    console.error(`[firebase-native] Impossible de préparer ${destinationName} pour Expo Prebuild.`);
    process.exit(1);
  }
}

function prepareAndroid() {
  const configuredPath = process.env.GOOGLE_SERVICES_JSON?.trim() || "./google-services.json";
  const filePath = absolutePath(configuredPath);

  if (!existsSync(filePath)) {
    console.error(
      "[firebase-android] Fichier absent. Ajoutez GOOGLE_SERVICES_JSON comme variable EAS de type fichier dans l’environnement production.",
    );
    process.exit(1);
  }

  let config;
  try {
    config = JSON.parse(readFileSync(filePath, "utf8"));
  } catch {
    console.error("[firebase-android] Le fichier fourni n’est pas un JSON Firebase valide.");
    process.exit(1);
  }

  const clients = Array.isArray(config.client) ? config.client : [];
  const appClient = clients.find(
    (client) => client?.client_info?.android_client_info?.package_name === expectedPackageName,
  );
  const oauthClients = Array.isArray(appClient?.oauth_client) ? appClient.oauth_client : [];
  const hasAndroidOauthClient = oauthClients.some((client) => client?.client_type === 1);
  const hasWebOauthClient = oauthClients.some((client) => client?.client_type === 3);

  if (config?.project_info?.project_id !== expectedProjectId) {
    console.error("[firebase-android] Le fichier ne correspond pas au projet Firebase GlobalLogix attendu.");
    process.exit(1);
  }
  if (!appClient) {
    console.error("[firebase-android] Le fichier ne contient pas le package Android GlobalLogix attendu.");
    process.exit(1);
  }
  if (!hasAndroidOauthClient || !hasWebOauthClient) {
    console.error(
      "[firebase-android] Clients OAuth incomplets. Ajoutez les empreintes SHA-1/SHA-256 de cette signature dans Firebase, puis téléchargez un nouveau google-services.json.",
    );
    process.exit(1);
  }

  copyProtected(filePath, "google-services.json");
  console.log(`[firebase-android] Configuration OAuth validée et préparée pour ${expectedPackageName}.`);
}

function plistString(source, key) {
  const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = source.match(new RegExp(`<key>\\s*${escapedKey}\\s*<\\/key>\\s*<string>([^<]+)<\\/string>`));
  return match?.[1]?.trim() || null;
}

function prepareIos() {
  const configuredPath = process.env.GOOGLE_SERVICE_INFO_PLIST?.trim() || "./GoogleService-Info.plist";
  const filePath = absolutePath(configuredPath);

  if (!existsSync(filePath)) {
    console.error(
      "[firebase-ios] Fichier absent. Ajoutez GOOGLE_SERVICE_INFO_PLIST comme variable EAS de type fichier dans l’environnement production.",
    );
    process.exit(1);
  }

  const source = readFileSync(filePath, "utf8");
  const projectId = plistString(source, "PROJECT_ID");
  const bundleId = plistString(source, "BUNDLE_ID");
  const clientId = plistString(source, "CLIENT_ID");
  const reversedClientId = plistString(source, "REVERSED_CLIENT_ID");

  if (projectId !== expectedProjectId) {
    console.error("[firebase-ios] Le fichier ne correspond pas au projet Firebase GlobalLogix attendu.");
    process.exit(1);
  }
  if (bundleId !== expectedBundleIdentifier) {
    console.error("[firebase-ios] Le fichier ne contient pas le bundle iOS GlobalLogix attendu.");
    process.exit(1);
  }
  if (!clientId || !reversedClientId) {
    console.error(
      "[firebase-ios] Client OAuth iOS incomplet. Activez Google dans Firebase et téléchargez un nouveau GoogleService-Info.plist.",
    );
    process.exit(1);
  }

  copyProtected(filePath, "GoogleService-Info.plist");
  console.log(`[firebase-ios] Configuration OAuth validée et préparée pour ${expectedBundleIdentifier}.`);
}

if (buildPlatform === "android") {
  prepareAndroid();
} else if (buildPlatform === "ios") {
  prepareIos();
} else {
  console.log(`[firebase-native] Étape ignorée pour la plateforme ${buildPlatform}.`);
}
