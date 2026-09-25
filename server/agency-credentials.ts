import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const VERSION = "v1";

function getEncryptionKey() {
  const value = process.env.AGENCY_CREDENTIALS_ENCRYPTION_KEY?.trim();
  if (!value || !/^[a-fA-F0-9]{64}$/.test(value)) {
    throw new Error("La clé de chiffrement des identifiants d’agence est absente ou invalide.");
  }
  return Buffer.from(value, "hex");
}

export function encryptAgencyCredential(value: string) {
  const key = getEncryptionKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [VERSION, iv.toString("base64url"), tag.toString("base64url"), encrypted.toString("base64url")].join(".");
}

export function decryptAgencyCredential(ciphertext: string) {
  const [version, ivEncoded, tagEncoded, payloadEncoded] = ciphertext.split(".");
  if (version !== VERSION || !ivEncoded || !tagEncoded || !payloadEncoded) throw new Error("Identifiant d’agence chiffré invalide.");
  const decipher = createDecipheriv("aes-256-gcm", getEncryptionKey(), Buffer.from(ivEncoded, "base64url"));
  decipher.setAuthTag(Buffer.from(tagEncoded, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(payloadEncoded, "base64url")), decipher.final()]).toString("utf8");
}

export function maskLast4(value: string) {
  const compact = value.replace(/\D/g, "");
  return compact.length >= 4 ? compact.slice(-4) : null;
}
