export async function sendClientSms(_phoneNumber: string) {
  throw new Error("La vérification SMS Firebase est disponible dans l’application Android ou iOS installée.");
}

export async function confirmClientSms(_code: string) {
  throw new Error("La vérification SMS Firebase est disponible dans l’application Android ou iOS installée.");
}

export async function getClientFirebaseIdToken(_forceRefresh = false) {
  return null;
}

export async function getClientPhoneSession() {
  return null;
}

export async function signOutClient() {
  return undefined;
}

export const isNativeClientSmsAvailable = false;
