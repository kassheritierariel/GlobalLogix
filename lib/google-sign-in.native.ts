import {
  GoogleOneTapSignIn,
  isCancelledResponse,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
} from "react-native-nitro-google-signin";

let isConfigured = false;

function ensureConfigured() {
  if (isConfigured) return;
  GoogleOneTapSignIn.configure({
    webClientId: "autoDetect",
    offlineAccess: false,
    autoSelectOnSignIn: false,
  });
  isConfigured = true;
}

function nativeGoogleError(error: unknown): Error {
  if (!isErrorWithCode(error)) {
    return error instanceof Error
      ? error
      : new Error("Connexion Google mobile impossible. Réessayez dans quelques instants.");
  }

  switch (error.code) {
    case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
      return new Error("Google Play Services est absent ou doit être mis à jour sur cet appareil.");
    case statusCodes.DEVELOPER_ERROR:
      return new Error(
        "La signature de cette version Android n’est pas encore autorisée dans Firebase. Ajoutez son empreinte SHA-1/SHA-256 puis réessayez.",
      );
    case statusCodes.IN_PROGRESS:
      return new Error("Une connexion Google est déjà en cours. Patientez quelques secondes.");
    case statusCodes.SIGN_IN_CANCELLED:
      return new Error("La connexion Google a été annulée avant sa validation.");
    case statusCodes.SIGN_IN_REQUIRED:
      return new Error("Sélectionnez un compte Google pour continuer.");
    default:
      return new Error("Google n’a pas pu démarrer la connexion native. Vérifiez la configuration OAuth de cette version.");
  }
}

export async function getNativeGoogleIdToken() {
  try {
    ensureConfigured();
    await GoogleOneTapSignIn.checkPlayServices(true);
    const response = await GoogleOneTapSignIn.presentExplicitSignIn();

    if (isCancelledResponse(response)) {
      throw new Error("La connexion Google a été annulée avant sa validation.");
    }
    if (!isSuccessResponse(response) || !response.data.idToken) {
      throw new Error("Google n’a retourné aucun jeton d’identité valide.");
    }

    return response.data.idToken;
  } catch (error) {
    throw nativeGoogleError(error);
  }
}

export async function clearNativeGoogleSession() {
  try {
    ensureConfigured();
    await GoogleOneTapSignIn.signOut();
  } catch {
    // Firebase reste la source de session. L’échec d’effacement du sélecteur
    // Google ne doit jamais empêcher l’utilisateur de se déconnecter.
  }
}
