import { getAuth, signInWithPhoneNumber } from "@react-native-firebase/auth";

type PhoneConfirmation = { confirm: (code: string) => Promise<unknown> };

let confirmation: PhoneConfirmation | null = null;

export async function sendClientSms(phoneNumber: string) {
  confirmation = await signInWithPhoneNumber(getAuth(), phoneNumber);
}

export async function confirmClientSms(code: string) {
  if (!confirmation) throw new Error("Demandez d’abord un nouveau code SMS.");
  await confirmation.confirm(code.trim());
  const user = getAuth().currentUser;
  if (!user?.phoneNumber) throw new Error("Firebase n’a pas confirmé le numéro de téléphone.");
  return { uid: user.uid, phoneNumber: user.phoneNumber };
}

export async function getClientFirebaseIdToken(forceRefresh = false) {
  return getAuth().currentUser?.getIdToken(forceRefresh) ?? null;
}

export async function getClientPhoneSession() {
  const user = getAuth().currentUser;
  if (!user?.phoneNumber) return null;
  return { uid: user.uid, phoneNumber: user.phoneNumber };
}

export async function signOutClient() {
  await getAuth().signOut();
  confirmation = null;
}

export const isNativeClientSmsAvailable = true;
