import { createHmac, timingSafeEqual } from "node:crypto";

export type ChariowPulseEvent = "successful.sale" | "abandoned.sale" | "failed.sale" | "license.activated" | "license.expired" | "license.issued" | "license.nearing_expiry" | "license.revoked";

export type ChariowPulsePayload = {
  event?: string;
  sale?: { id?: string; status?: string; amount?: { value?: number; currency?: string } };
  product?: { id?: string };
};

export function verifyChariowPulseSignature(rawBody: Buffer, receivedSignature: string | undefined, pulseSecret: string | undefined) {
  if (!pulseSecret || !receivedSignature?.startsWith("sha256=")) return false;
  const expected = `sha256=${createHmac("sha256", pulseSecret).update(rawBody).digest("hex")}`;
  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(receivedSignature);
  return expectedBuffer.length === receivedBuffer.length && timingSafeEqual(expectedBuffer, receivedBuffer);
}

export function mapChariowPulseStatus(event: string | undefined): "paid" | "failed" | "cancelled" | null {
  if (event === "successful.sale") return "paid";
  if (event === "failed.sale") return "failed";
  if (event === "abandoned.sale") return "cancelled";
  return null;
}

export function amountToMinorUnits(value: number | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? Math.round(value * 100) : null;
}
