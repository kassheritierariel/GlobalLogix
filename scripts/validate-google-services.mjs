import { chmodSync, copyFileSync, existsSync, readFileSync } from "node:fs";
import { isAbsolute, resolve } from "node:path";

const expectedProjectId = "globallogix-74286";
const expectedPackageName = "com.app.globallogixmobile";

if (process.env.EAS_BUILD_PLATFORM && process.env.EAS_BUILD_PLATFORM !== "android") {
  console.log("[firebase-android] Étape ignorée : la build EAS ne cible pas Android.");
  process.exit(0);
}

const configuredPath = process.env.GOOGLE_SERVICES_JSON?.trim() || "./google-services.json";
const filePath = isAbsolute(configuredPath) ? configuredPath : resolve(process.cwd(), configuredPath);
const destinationPath = resolve(process.cwd(), "google-services.json");

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

const packageNames = Array.isArray(config.client)
  ? config.client.map((client) => client?.client_info?.android_client_info?.package_name).filter(Boolean)
  : [];

if (config?.project_info?.project_id !== expectedProjectId) {
  console.error("[firebase-android] Le fichier ne correspond pas au projet Firebase GlobalLogix attendu.");
  process.exit(1);
}

if (!packageNames.includes(expectedPackageName)) {
  console.error("[firebase-android] Le fichier ne contient pas le package Android GlobalLogix attendu.");
  process.exit(1);
}

if (filePath !== destinationPath) {
  copyFileSync(filePath, destinationPath);
}
chmodSync(destinationPath, 0o600);

if (!existsSync(destinationPath)) {
  console.error("[firebase-android] Impossible de préparer google-services.json pour Expo Prebuild.");
  process.exit(1);
}

console.log(`[firebase-android] Configuration validée et préparée pour ${expectedPackageName}.`);
