import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApp, getApps, initializeApp } from "firebase/app";
import * as FirebaseAuth from "firebase/auth";
import { getAuth, initializeAuth, type Auth, type User } from "firebase/auth";
import { Platform } from "react-native";

import { resolveCanonicalGoogleAuthUrl } from "@/lib/firebase-auth-origin";
import { clearNativeGoogleSession, getNativeGoogleIdToken } from "@/lib/google-sign-in";

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId && firebaseConfig.appId,
);

const firebaseApp = isFirebaseConfigured
  ? (getApps().length ? getApp() : initializeApp(firebaseConfig))
  : null;

let authInstance: Auth | null = null;
const getReactNativePersistence = (FirebaseAuth as unknown as {
  getReactNativePersistence: (storage: typeof AsyncStorage) => unknown;
}).getReactNativePersistence;

export function getFirebaseAuth() {
  if (!firebaseApp) {
    throw new Error("La configuration Firebase est absente de cette version mobile.");
  }
  if (authInstance) return authInstance;

  if (Platform.OS === "web") {
    authInstance = getAuth(firebaseApp);
    return authInstance;
  }

  try {
    authInstance = initializeAuth(firebaseApp, {
      persistence: getReactNativePersistence(AsyncStorage) as never,
    });
  } catch {
    authInstance = getAuth(firebaseApp);
  }
  return authInstance;
}

export async function getFirebaseIdToken(forceRefresh = false) {
  const user = getFirebaseAuth().currentUser;
  if (!user) return null;
  return user.getIdToken(forceRefresh);
}

export async function signInWithGoogleAccount() {
  if (!isFirebaseConfigured) throw new Error("Firebase n’est pas configuré pour cette version.");
  if (Platform.OS !== "web") {
    const idToken = await getNativeGoogleIdToken();
    const credential = FirebaseAuth.GoogleAuthProvider.credential(idToken);
    await FirebaseAuth.signInWithCredential(getFirebaseAuth(), credential);
    return "signed-in" as const;
  }
  const canonicalUrl = resolveCanonicalGoogleAuthUrl(typeof window !== "undefined" ? window.location : null);
  if (canonicalUrl) {
    window.location.replace(canonicalUrl);
    return "redirected" as const;
  }
  const provider = new FirebaseAuth.GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  await FirebaseAuth.signInWithPopup(getFirebaseAuth(), provider);
  return "signed-in" as const;
}

export async function clearGoogleSession() {
  if (Platform.OS !== "web") await clearNativeGoogleSession();
}

export type FirebaseAuthUser = User;
