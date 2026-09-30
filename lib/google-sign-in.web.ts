export async function getNativeGoogleIdToken(): Promise<string> {
  throw new Error("Le flux Google natif n’est pas utilisé sur le Web.");
}

export async function clearNativeGoogleSession(): Promise<void> {
  // La session Web est fermée directement par Firebase Auth.
}
