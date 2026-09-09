import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { isTemporaryPasswordStrong } from "./password-policy";

export type GlobalLogixRole = "super_admin" | "agency_admin" | "staff" | "viewer" | "client";
export type AgencyMemberRole = "staff" | "viewer";

export type FirebasePrincipal = {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: GlobalLogixRole;
  agencyId: string | null;
  phoneNumber?: string | null;
  disabled: boolean;
};

export type FirebaseIdentity = {
  uid: string;
  email: string | null;
  displayName: string | null;
  disabled: boolean;
};

const roles: GlobalLogixRole[] = ["super_admin", "agency_admin", "staff", "viewer", "client"];

export function normalizeFirebasePrivateKey(value: string): string {
  return value
    .replace(/\\n/g, "\n")
    .replace("-----BEGINPRIVATEKEY-----", "-----BEGIN PRIVATE KEY-----")
    .replace("-----ENDPRIVATEKEY-----", "-----END PRIVATE KEY-----");
}

export function normalizeAgencyId(value: string): string {
  const agencyId = value.trim();
  if (!/^[A-Za-z0-9][A-Za-z0-9_-]{2,63}$/.test(agencyId)) {
    throw new Error("Code agence invalide : utilisez 3 à 64 caractères alphanumériques, tirets ou soulignés");
  }
  return agencyId;
}

function getAdminAuth() {
  if (!getApps().length) {
    const raw = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON;
    if (!raw) throw new Error("FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON manquant");
    const serviceAccount = JSON.parse(raw) as { project_id: string; client_email: string; private_key: string };
    const credential = {
      projectId: serviceAccount.project_id,
      clientEmail: serviceAccount.client_email,
      privateKey: normalizeFirebasePrivateKey(serviceAccount.private_key),
    };
    initializeApp({ credential: cert(credential as Parameters<typeof cert>[0]) });
  }
  return getAuth();
}

function addFirebaseWebApiKey(actionLink: string) {
  const apiKey = process.env.EXPO_PUBLIC_FIREBASE_API_KEY;
  if (!apiKey) throw new Error("EXPO_PUBLIC_FIREBASE_API_KEY manquant pour le lien de mot de passe");
  const url = new URL(actionLink);
  url.searchParams.set("apiKey", apiKey);
  return url.toString();
}

export async function setGlobalLogixClaims(input: {
  uid: string;
  role: GlobalLogixRole;
  agencyId: string | null;
  disabled?: boolean;
}) {
  if (input.role !== "super_admin" && input.role !== "client" && !input.agencyId) {
    throw new Error("agencyId est obligatoire pour un rôle non global");
  }
  const auth = getAdminAuth();
  const user = await auth.getUser(input.uid);
  const existing = user.customClaims ?? {};
  const nextClaims: Record<string, unknown> = {
    ...existing,
    role: input.role,
    disabled: input.disabled === true,
  };
  if (input.role === "super_admin" || input.role === "client") {
    delete nextClaims.agencyId;
  } else {
    nextClaims.agencyId = input.agencyId;
  }
  await auth.setCustomUserClaims(input.uid, nextClaims);
  return {
    role: input.role,
    agencyId: input.role === "super_admin" || input.role === "client" ? null : input.agencyId,
    disabled: input.disabled === true,
  };
}

export async function setClientClaims(uid: string) {
  return setGlobalLogixClaims({ uid, role: "client", agencyId: null, disabled: false });
}

export async function createInitialSuperAdmin(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    throw new Error("Adresse e-mail invalide");
  }
  const auth = getAdminAuth();
  let user;
  let created = false;
  try {
    user = await auth.getUserByEmail(normalizedEmail);
  } catch (error) {
    const code = typeof error === "object" && error && "code" in error ? (error as { code?: string }).code : undefined;
    if (code !== "auth/user-not-found") throw error;
    user = await auth.createUser({ email: normalizedEmail, emailVerified: false, disabled: false });
    created = true;
  }
  const claims = await setGlobalLogixClaims({ uid: user.uid, role: "super_admin", agencyId: null, disabled: false });
  const passwordResetLink = addFirebaseWebApiKey(await auth.generatePasswordResetLink(normalizedEmail));
  return { uid: user.uid, email: normalizedEmail, created, claims, passwordResetLink };
}

export async function createInitialAgencyAdmin(input: { email: string; agencyId: string }) {
  const normalizedEmail = input.email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    throw new Error("Adresse e-mail invalide");
  }
  const agencyId = normalizeAgencyId(input.agencyId);
  const auth = getAdminAuth();
  let user;
  let created = false;

  try {
    user = await auth.getUserByEmail(normalizedEmail);
  } catch (error) {
    const code = typeof error === "object" && error && "code" in error ? (error as { code?: string }).code : undefined;
    if (code !== "auth/user-not-found") throw error;
    user = await auth.createUser({
      email: normalizedEmail,
      displayName: `Administrateur ${agencyId}`,
      emailVerified: false,
      disabled: false,
    });
    created = true;
  }

  if (user.customClaims?.role === "super_admin") {
    throw new Error("Refus de remplacer un super_admin existant par un administrateur d’agence");
  }
  if (user.customClaims?.role === "agency_admin" && user.customClaims?.agencyId !== agencyId) {
    throw new Error("Ce compte admin appartient déjà à une autre agence");
  }

  const claims = await setGlobalLogixClaims({ uid: user.uid, role: "agency_admin", agencyId, disabled: false });
  return { uid: user.uid, email: normalizedEmail, agencyId, created, claims };
}

function normalizeEmail(value: string) {
  const email = value.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Adresse e-mail invalide");
  return email;
}

export async function listAgencyMembers(agencyIdInput: string) {
  const agencyId = normalizeAgencyId(agencyIdInput);
  const auth = getAdminAuth();
  const members: Array<{ uid: string; email: string | null; displayName: string | null; role: AgencyMemberRole; agencyId: string; disabled: boolean }> = [];
  let pageToken: string | undefined;
  do {
    const page = await auth.listUsers(1000, pageToken);
    for (const user of page.users) {
      const role = user.customClaims?.role;
      const memberAgencyId = user.customClaims?.agencyId;
      if ((role === "staff" || role === "viewer") && memberAgencyId === agencyId) {
        members.push({ uid: user.uid, email: user.email ?? null, displayName: user.displayName ?? null, role, agencyId, disabled: user.disabled || user.customClaims?.disabled === true });
      }
    }
    pageToken = page.pageToken;
  } while (pageToken);
  return members.sort((left, right) => (left.email ?? "").localeCompare(right.email ?? ""));
}

export async function createAgencyMember(input: { email: string; agencyId: string; role: AgencyMemberRole }) {
  const email = normalizeEmail(input.email);
  const agencyId = normalizeAgencyId(input.agencyId);
  if (input.role !== "staff" && input.role !== "viewer") throw new Error("Rôle d’agence invalide");
  const auth = getAdminAuth();
  let user;
  let created = false;
  try {
    user = await auth.getUserByEmail(email);
  } catch (error) {
    const code = typeof error === "object" && error && "code" in error ? (error as { code?: string }).code : undefined;
    if (code !== "auth/user-not-found") throw error;
    user = await auth.createUser({
      email,
      displayName: input.role === "staff" ? `Opérateur ${agencyId}` : `Lecteur ${agencyId}`,
      emailVerified: false,
      disabled: false,
    });
    created = true;
  }
  const existingRole = user.customClaims?.role;
  const existingAgencyId = user.customClaims?.agencyId;
  if (existingRole === "super_admin" || existingRole === "agency_admin") {
    throw new Error("Ce compte possède déjà un rôle administratif et ne peut pas être converti par l’agence");
  }
  if (typeof existingAgencyId === "string" && existingAgencyId !== agencyId) {
    throw new Error("Ce compte appartient déjà à une autre agence");
  }
  const claims = await setGlobalLogixClaims({ uid: user.uid, role: input.role, agencyId, disabled: false });
  return { uid: user.uid, email, agencyId, role: input.role, created, claims };
}

export async function getAgencyMemberByEmail(emailInput: string) {
  const email = normalizeEmail(emailInput);
  const user = await getAdminAuth().getUserByEmail(email);
  const role = user.customClaims?.role;
  const agencyId = user.customClaims?.agencyId;
  if ((role !== "staff" && role !== "viewer") || typeof agencyId !== "string") {
    throw new Error("Ce compte ne possède pas de rôle d’agence exploitable");
  }
  return { uid: user.uid, email, role, agencyId, disabled: user.disabled || user.customClaims?.disabled === true };
}

export async function setAgencyMemberDisabled(input: { uid: string; agencyId: string; disabled: boolean }) {
  const agencyId = normalizeAgencyId(input.agencyId);
  const auth = getAdminAuth();
  const user = await auth.getUser(input.uid);
  const role = user.customClaims?.role;
  if ((role !== "staff" && role !== "viewer") || user.customClaims?.agencyId !== agencyId) {
    throw new Error("Utilisateur non gérable dans cette agence");
  }
  await auth.updateUser(input.uid, { disabled: input.disabled });
  const claims = await setGlobalLogixClaims({ uid: input.uid, role, agencyId, disabled: input.disabled });
  return { uid: input.uid, disabled: input.disabled, claims };
}

export async function updateAgencyMemberRole(input: { uid: string; agencyId: string; role: AgencyMemberRole }) {
  const agencyId = normalizeAgencyId(input.agencyId);
  if (input.role !== "staff" && input.role !== "viewer") throw new Error("Rôle d’agence invalide");
  const auth = getAdminAuth();
  const user = await auth.getUser(input.uid);
  const currentRole = user.customClaims?.role;
  if ((currentRole !== "staff" && currentRole !== "viewer") || user.customClaims?.agencyId !== agencyId) {
    throw new Error("Utilisateur non gérable dans cette agence");
  }
  const disabled = user.disabled || user.customClaims?.disabled === true;
  const claims = await setGlobalLogixClaims({ uid: input.uid, role: input.role, agencyId, disabled });
  return { uid: input.uid, role: input.role, disabled, claims };
}

export async function requestFirebasePasswordReset(emailInput: string) {
  const email = normalizeEmail(emailInput);
  const apiKey = process.env.EXPO_PUBLIC_FIREBASE_API_KEY;
  if (!apiKey) throw new Error("EXPO_PUBLIC_FIREBASE_API_KEY manquant");
  const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${encodeURIComponent(apiKey)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ requestType: "PASSWORD_RESET", email }),
  });
  if (!response.ok) throw new Error("Firebase a refusé l’invitation de définition du mot de passe");
  return { email, requested: true };
}

export async function requestFirebasePasswordResetForUid(uid: string) {
  const user = await getAdminAuth().getUser(uid);
  if (!user.email) throw new Error("Cet utilisateur ne possède pas d’adresse e-mail");
  return requestFirebasePasswordReset(user.email);
}

export async function setFirebaseUserPassword(input: { email: string; password: string }) {
  const normalizedEmail = input.email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    throw new Error("Adresse e-mail invalide");
  }
  if (!isTemporaryPasswordStrong(input.password)) {
    throw new Error("Le mot de passe temporaire ne respecte pas la politique de sécurité");
  }

  const auth = getAdminAuth();
  const user = await auth.getUserByEmail(normalizedEmail);
  await auth.updateUser(user.uid, { password: input.password });
  await auth.revokeRefreshTokens(user.uid);

  return { uid: user.uid, email: normalizedEmail, passwordUpdated: true };
}

export async function verifyFirebaseAuthorization(value: string | undefined): Promise<FirebasePrincipal> {
  if (!value?.startsWith("Bearer ")) throw new Error("Jeton Firebase manquant");
  const token = value.slice("Bearer ".length).trim();
  const decoded = await getAdminAuth().verifyIdToken(token, true);
  const rawRole = decoded.role;
  const phoneNumber = typeof decoded.phone_number === "string" ? decoded.phone_number : null;
  const role = typeof rawRole === "string" && roles.includes(rawRole as GlobalLogixRole)
    ? rawRole as GlobalLogixRole
    : phoneNumber ? "client" : "viewer";
  const agencyId = typeof decoded.agencyId === "string" ? decoded.agencyId : null;
  const disabled = decoded.disabled === true;
  if (disabled) throw new Error("Compte désactivé");
  if (role === "client" && !phoneNumber) throw new Error("Numéro SMS Firebase manquant");
  if (role !== "super_admin" && role !== "client" && !agencyId) throw new Error("Claim agencyId manquant");

  return {
    uid: decoded.uid,
    email: decoded.email ?? null,
    displayName: decoded.name ?? null,
    role,
    agencyId,
    phoneNumber,
    disabled,
  };
}

export async function verifyFirebaseIdentity(value: string | undefined): Promise<FirebaseIdentity> {
  if (!value?.startsWith("Bearer ")) throw new Error("Jeton Firebase manquant");
  const token = value.slice("Bearer ".length).trim();
  const decoded = await getAdminAuth().verifyIdToken(token, true);
  if (decoded.disabled === true) throw new Error("Compte désactivé");
  return { uid: decoded.uid, email: decoded.email ?? null, displayName: decoded.name ?? null, disabled: false };
}

export function canManageAgency(principal: FirebasePrincipal, agencyId: string) {
  return principal.role === "super_admin" ||
    ((principal.role === "agency_admin" || principal.role === "staff") && principal.agencyId === agencyId);
}
