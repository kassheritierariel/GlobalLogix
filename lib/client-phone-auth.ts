// Façade TypeScript : Metro sélectionne automatiquement .native ou .web au runtime.
export { confirmClientSms, getClientFirebaseIdToken, getClientPhoneSession, isNativeClientSmsAvailable, sendClientSms, signOutClient } from "./client-phone-auth.native";
