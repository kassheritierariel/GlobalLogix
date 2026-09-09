import { and, asc, desc, eq, gt, isNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { agencyProfiles, agencyRegistrationRequests, agencySubscriptions, agencyWhatsAppConfigs, agencyWhatsAppMessageLogs, clientAccounts, clientShipmentLinks, exceptionCases, InsertUser, mobilePushTokens, saasTransactions, shipmentEvents, shipments, shipmentShareLinks, users } from "../drizzle/schema";
import { ENV } from "./_core/env";
import { createExceptionFromEvent } from "./logistics-rules";
import { normalizeWhatsAppNumber } from "../lib/whatsapp-number";
import { getSaaSPlan, type BillingCycle, type SaaSPlanId } from "../lib/saas-plans";
import { encryptAgencyCredential, maskLast4 } from "./agency-credentials";
import { assertAgencyChannelCanActivate, describeAgencyChannelActivation } from "./agency-whatsapp-activation-policy";
import { getAgencyUsageAlert } from "./agency-usage-alert-policy";
import { defaultAgencyPublicSlug, normalizeAgencyPublicSlug } from "./agency-public-link-policy";
import { normalizeAgencyCustomDomain, type AgencyCustomDomainStatus } from "../lib/agency-custom-domain";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function registerPushToken(input: {
  uid: string;
  agencyId: string | null;
  token: string;
  platform: "ios" | "android";
}) {
  const db = await getDb();
  if (!db) throw new Error("Base de données indisponible pour les notifications");

  await db.insert(mobilePushTokens).values({
    firebaseUid: input.uid,
    agencyId: input.agencyId,
    token: input.token,
    platform: input.platform,
  }).onDuplicateKeyUpdate({
    set: { firebaseUid: input.uid, agencyId: input.agencyId, platform: input.platform, updatedAt: new Date() },
  });
}

export async function listPushTokensForAgency(agencyId: string) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select({ token: mobilePushTokens.token }).from(mobilePushTokens).where(eq(mobilePushTokens.agencyId, agencyId));
  return rows.map((row) => row.token);
}

export type ShipmentEventInput = {
  id: string;
  shipmentId: string;
  agencyId: string;
  eventId: string;
  type: "location_update" | "status_changed" | "eta_changed" | "customs_hold" | "delay_detected" | "note";
  severity: "info" | "warning" | "critical";
  source: string;
  confidence: "high" | "medium" | "low";
  sequence: number;
  message: string;
  payload?: string;
  occurredAt: Date;
  shipmentUpdate?: Partial<{
    status: "planned" | "in_transit" | "customs" | "delayed" | "delivered" | "cancelled";
    progress: number;
    distanceRemainingKm: number | null;
    eta: Date | null;
    currentPosition: string | null;
  }>;
};

export async function listShipments(agencyId: string | null) {
  const db = await getDb();
  if (!db) return [];
  const query = db.select().from(shipments).orderBy(desc(shipments.updatedAt));
  return agencyId ? query.where(eq(shipments.agencyId, agencyId)) : query;
}

export async function getShipment(shipmentId: string, agencyId: string | null) {
  const db = await getDb();
  if (!db) return undefined;
  const conditions = agencyId ? and(eq(shipments.id, shipmentId), eq(shipments.agencyId, agencyId)) : eq(shipments.id, shipmentId);
  const rows = await db.select().from(shipments).where(conditions).limit(1);
  return rows[0];
}

export async function upsertClientAccount(input: { firebaseUid: string; phoneNumber: string; displayName?: string | null }) {
  const db = await getDb();
  if (!db) throw new Error("Base de données indisponible pour le portail client");
  const whatsAppNumber = normalizeWhatsAppNumber(input.phoneNumber);
  const samePhone = await db.select().from(clientAccounts).where(eq(clientAccounts.whatsAppNumber, whatsAppNumber)).limit(1);
  if (samePhone[0] && samePhone[0].firebaseUid !== input.firebaseUid) {
    throw new Error("Ce numéro WhatsApp est déjà associé à un compte client.");
  }
  await db.insert(clientAccounts).values({ firebaseUid: input.firebaseUid, whatsAppNumber, displayName: input.displayName ?? null }).onDuplicateKeyUpdate({
    set: { whatsAppNumber, displayName: input.displayName ?? null, updatedAt: new Date() },
  });
  return { firebaseUid: input.firebaseUid, whatsAppNumber, displayName: input.displayName ?? null };
}

export async function listClientShipments(firebaseUid: string, agencyId?: string | null) {
  const db = await getDb();
  if (!db) return [];
  const conditions = agencyId ? and(eq(clientShipmentLinks.firebaseUid, firebaseUid), eq(clientShipmentLinks.agencyId, agencyId)) : eq(clientShipmentLinks.firebaseUid, firebaseUid);
  const rows = await db.select({ shipment: shipments }).from(clientShipmentLinks)
    .innerJoin(shipments, eq(clientShipmentLinks.shipmentId, shipments.id))
    .where(conditions)
    .orderBy(desc(shipments.updatedAt));
  return rows.map((row) => row.shipment);
}

export async function getClientShipment(firebaseUid: string, shipmentId: string, agencyId?: string | null) {
  const db = await getDb();
  if (!db) return undefined;
  const conditions = agencyId
    ? and(eq(clientShipmentLinks.firebaseUid, firebaseUid), eq(clientShipmentLinks.shipmentId, shipmentId), eq(clientShipmentLinks.agencyId, agencyId))
    : and(eq(clientShipmentLinks.firebaseUid, firebaseUid), eq(clientShipmentLinks.shipmentId, shipmentId));
  const rows = await db.select({ shipment: shipments }).from(clientShipmentLinks)
    .innerJoin(shipments, eq(clientShipmentLinks.shipmentId, shipments.id))
    .where(conditions)
    .limit(1);
  return rows[0]?.shipment;
}

export async function registerClientShipment(input: { firebaseUid: string; phoneNumber: string; trackingNumber: string; agencyId?: string | null }) {
  const db = await getDb();
  if (!db) throw new Error("Base de données indisponible pour le portail client");
  const requestedNumber = normalizeWhatsAppNumber(input.phoneNumber);
  const trackingNumber = input.trackingNumber.trim().toUpperCase();
  if (!/^[A-Z0-9][A-Z0-9-]{3,127}$/.test(trackingNumber)) throw new Error("Numéro de suivi invalide.");
  const rows = await db.select().from(shipments).where(eq(shipments.trackingNumber, trackingNumber)).limit(1);
  const shipment = rows[0];
  if (!shipment) throw new Error("Cette référence ne peut pas être enregistrée pour ce compte.");
  if (input.agencyId && shipment.agencyId !== input.agencyId) throw new Error("Cette référence appartient à une autre agence et ne peut pas être ajoutée depuis cet espace.");
  try {
    if (!shipment.customerPhone || normalizeWhatsAppNumber(shipment.customerPhone) !== requestedNumber) throw new Error("mismatch");
  } catch {
    throw new Error("Cette référence doit d’abord être reliée à votre numéro par l’agence GlobalLogix.");
  }
  await db.insert(clientShipmentLinks).values({ id: randomUUID(), firebaseUid: input.firebaseUid, shipmentId: shipment.id, agencyId: shipment.agencyId }).onDuplicateKeyUpdate({ set: { linkedAt: new Date() } });
  return shipment;
}

export type AgencyClientShipmentSummary = {
  id: string; trackingNumber: string; status: string; progress: number; origin: string; destination: string;
  currentPosition: string | null; updatedAt: Date;
};

export type AgencyClientSummary = {
  firebaseUid: string; displayName: string | null; phoneLast4: string | null; shipmentCount: number;
  activeShipments: number; deliveredShipments: number; atRiskShipments: number; lastActivityAt: Date | null;
};

/** Liste limitée au tenant : elle ne retourne jamais le numéro WhatsApp complet. */
export async function listAgencyClients(agencyId: string): Promise<AgencyClientSummary[]> {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select({ account: clientAccounts, shipment: shipments }).from(clientShipmentLinks)
    .innerJoin(clientAccounts, eq(clientShipmentLinks.firebaseUid, clientAccounts.firebaseUid))
    .innerJoin(shipments, eq(clientShipmentLinks.shipmentId, shipments.id))
    .where(eq(clientShipmentLinks.agencyId, agencyId)).orderBy(desc(shipments.updatedAt));
  const byClient = new Map<string, AgencyClientSummary>();
  for (const row of rows) {
    const previous = byClient.get(row.account.firebaseUid) ?? {
      firebaseUid: row.account.firebaseUid, displayName: row.account.displayName, phoneLast4: maskLast4(row.account.whatsAppNumber), shipmentCount: 0,
      activeShipments: 0, deliveredShipments: 0, atRiskShipments: 0, lastActivityAt: row.shipment.updatedAt,
    };
    previous.shipmentCount += 1;
    if (row.shipment.status === "delivered") previous.deliveredShipments += 1;
    else if (row.shipment.status !== "cancelled") previous.activeShipments += 1;
    if (row.shipment.status === "delayed") previous.atRiskShipments += 1;
    if (!previous.lastActivityAt || row.shipment.updatedAt > previous.lastActivityAt) previous.lastActivityAt = row.shipment.updatedAt;
    byClient.set(row.account.firebaseUid, previous);
  }
  return [...byClient.values()].sort((left, right) => (right.lastActivityAt?.getTime() ?? 0) - (left.lastActivityAt?.getTime() ?? 0));
}

/** Détail limité au client réellement rattaché à l’agence demandée. */
export async function getAgencyClientDetail(agencyId: string, firebaseUid: string) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select({ account: clientAccounts, shipment: shipments }).from(clientShipmentLinks)
    .innerJoin(clientAccounts, eq(clientShipmentLinks.firebaseUid, clientAccounts.firebaseUid))
    .innerJoin(shipments, eq(clientShipmentLinks.shipmentId, shipments.id))
    .where(and(eq(clientShipmentLinks.agencyId, agencyId), eq(clientShipmentLinks.firebaseUid, firebaseUid))).orderBy(desc(shipments.updatedAt));
  if (!rows.length) return undefined;
  const client = { firebaseUid: rows[0].account.firebaseUid, displayName: rows[0].account.displayName, phoneLast4: maskLast4(rows[0].account.whatsAppNumber) };
  const shipmentsForClient: AgencyClientShipmentSummary[] = rows.map(({ shipment }) => ({ id: shipment.id, trackingNumber: shipment.trackingNumber, status: shipment.status, progress: shipment.progress, origin: shipment.origin, destination: shipment.destination, currentPosition: shipment.currentPosition, updatedAt: shipment.updatedAt }));
  return { client, shipments: shipmentsForClient };
}

export async function updateShipmentCustomerPhone(input: { shipmentId: string; agencyId: string | null; phoneNumber: string }) {
  const db = await getDb();
  if (!db) throw new Error("Base de données indisponible pour le portail client");
  const customerPhone = normalizeWhatsAppNumber(input.phoneNumber);
  const conditions = input.agencyId ? and(eq(shipments.id, input.shipmentId), eq(shipments.agencyId, input.agencyId)) : eq(shipments.id, input.shipmentId);
  const shipment = await db.select({ id: shipments.id }).from(shipments).where(conditions).limit(1);
  if (!shipment[0]) throw new Error("Expédition introuvable ou hors périmètre");
  await db.update(shipments).set({ customerPhone }).where(conditions);
  return customerPhone;
}

export async function listShipmentEvents(shipmentId: string, agencyId: string | null) {
  const db = await getDb();
  if (!db) return [];
  const conditions = agencyId ? and(eq(shipmentEvents.shipmentId, shipmentId), eq(shipmentEvents.agencyId, agencyId)) : eq(shipmentEvents.shipmentId, shipmentId);
  return db.select().from(shipmentEvents).where(conditions).orderBy(desc(shipmentEvents.sequence));
}

export async function recordShipmentEvent(input: ShipmentEventInput) {
  const db = await getDb();
  if (!db) throw new Error("Base de données indisponible pour la télémétrie");
  const shipment = await getShipment(input.shipmentId, input.agencyId);
  if (!shipment) throw new Error("Expédition introuvable ou hors périmètre");
  if (input.sequence <= shipment.sequence) return { accepted: false as const, reason: "stale_sequence" as const };

  await db.transaction(async (tx) => {
    await tx.insert(shipmentEvents).values({
      id: input.id,
      shipmentId: input.shipmentId,
      agencyId: input.agencyId,
      eventId: input.eventId,
      type: input.type,
      severity: input.severity,
      source: input.source,
      confidence: input.confidence,
      sequence: input.sequence,
      message: input.message,
      payload: input.payload ?? null,
      occurredAt: input.occurredAt,
    });
    await tx.update(shipments).set({
      sequence: input.sequence,
      lastTelemetryAt: input.occurredAt,
      source: input.source,
      confidence: input.confidence,
      ...(input.shipmentUpdate ?? {}),
    }).where(eq(shipments.id, input.shipmentId));
    const exception = createExceptionFromEvent(input);
    if (exception) await tx.insert(exceptionCases).values(exception);
  });
  return { accepted: true as const, reason: null };
}

export async function listExceptions(agencyId: string | null) {
  const db = await getDb();
  if (!db) return [];
  const query = db.select({ exception: exceptionCases, shipment: shipments })
    .from(exceptionCases)
    .innerJoin(shipments, eq(exceptionCases.shipmentId, shipments.id))
    .orderBy(desc(exceptionCases.createdAt));
  return agencyId ? query.where(eq(exceptionCases.agencyId, agencyId)) : query;
}

export async function transitionException(input: { id: string; agencyId: string | null; status: "acknowledged" | "resolved"; assignedTo?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Base de données indisponible pour les exceptions");
  const conditions = input.agencyId ? and(eq(exceptionCases.id, input.id), eq(exceptionCases.agencyId, input.agencyId)) : eq(exceptionCases.id, input.id);
  await db.update(exceptionCases).set({
    status: input.status,
    assignedTo: input.assignedTo,
    resolvedAt: input.status === "resolved" ? new Date() : null,
  }).where(conditions);
}

export async function createShipmentShareLink(input: { id: string; shipmentId: string; agencyId: string; createdBy: string; expiresAt: Date }) {
  const db = await getDb();
  if (!db) throw new Error("Base de données indisponible pour les liens de partage");
  const rawToken = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(rawToken).digest("hex");
  await db.insert(shipmentShareLinks).values({
    id: input.id,
    shipmentId: input.shipmentId,
    agencyId: input.agencyId,
    tokenHash,
    expiresAt: input.expiresAt,
    createdBy: input.createdBy,
  });
  return rawToken;
}

export async function getSharedShipment(rawToken: string) {
  const db = await getDb();
  if (!db) return undefined;
  const tokenHash = createHash("sha256").update(rawToken).digest("hex");
  const links = await db.select().from(shipmentShareLinks).where(and(
    eq(shipmentShareLinks.tokenHash, tokenHash),
    gt(shipmentShareLinks.expiresAt, new Date()),
    isNull(shipmentShareLinks.revokedAt),
  )).limit(1);
  const link = links[0];
  if (!link) return undefined;
  const shipment = await getShipment(link.shipmentId, link.agencyId);
  if (!shipment) return undefined;
  const events = await listShipmentEvents(shipment.id, shipment.agencyId);
  await db.update(shipmentShareLinks).set({ lastViewedAt: new Date() }).where(eq(shipmentShareLinks.id, link.id));
  return { shipment, events, link };
}

export type AgencySubscriptionStatus = "trial" | "pending_payment" | "active" | "past_due" | "cancelled" | "expired";
export type SaaSTransactionStatus = "created" | "awaiting_payment" | "paid" | "failed" | "cancelled" | "refunded";

function nextSubscriptionEnd(date: Date, billingCycle: BillingCycle) {
  const end = new Date(date);
  if (billingCycle === "annual") end.setFullYear(end.getFullYear() + 1);
  else end.setMonth(end.getMonth() + 1);
  return end;
}

export async function getAgencySubscription(agencyId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(agencySubscriptions).where(eq(agencySubscriptions.agencyId, agencyId)).limit(1);
  return rows[0];
}

export type AgencyProfileInput = {
  agencyId: string;
  publicSlug?: string | null;
  displayName: string;
  legalName?: string | null;
  publicEmail?: string | null;
  publicPhone?: string | null;
  website?: string | null;
  customDomain?: string | null;
  logoUrl?: string | null;
  primaryColor?: string | null;
  timeZone?: string | null;
  supportHours?: string | null;
};

export async function getAgencyProfile(agencyId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(agencyProfiles).where(eq(agencyProfiles.agencyId, agencyId)).limit(1);
  return rows[0];
}

/** Profil public d’agence résolu par lien ; aucune clé Meta ni donnée client. */
export async function getAgencyProfileByPublicSlug(publicSlug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const slug = normalizeAgencyPublicSlug(publicSlug);
  const rows = await db.select().from(agencyProfiles).where(eq(agencyProfiles.publicSlug, slug)).limit(1);
  return rows[0];
}

/** Liste sans secrets des agences vendues par l’éditeur GlobalLogix. */
export async function listAgencyProfiles() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(agencyProfiles).orderBy(asc(agencyProfiles.displayName));
}

export async function upsertAgencyProfile(input: AgencyProfileInput) {
  const db = await getDb();
  if (!db) throw new Error("Base de données indisponible pour le profil d’agence");
  const current = await getAgencyProfile(input.agencyId);
  const publicSlug = input.publicSlug?.trim() ? normalizeAgencyPublicSlug(input.publicSlug) : current?.publicSlug ?? defaultAgencyPublicSlug(input.agencyId);
  const customDomain = input.customDomain === undefined ? current?.customDomain ?? null : normalizeAgencyCustomDomain(input.customDomain);
  const customDomainChanged = customDomain !== (current?.customDomain ?? null);
  const customDomainStatus: AgencyCustomDomainStatus = !customDomain
    ? "not_configured"
    : customDomainChanged ? "pending_dns" : (current?.customDomainStatus ?? "pending_dns");
  const values = {
    agencyId: input.agencyId,
    publicSlug,
    displayName: input.displayName.trim(),
    legalName: input.legalName?.trim() || null,
    publicEmail: input.publicEmail?.trim().toLowerCase() || null,
    publicPhone: input.publicPhone?.trim() || null,
    website: input.website?.trim() || null,
    customDomain,
    customDomainStatus,
    customDomainRequestedAt: customDomain && customDomainChanged ? new Date() : current?.customDomainRequestedAt ?? null,
    logoUrl: input.logoUrl?.trim() || null,
    primaryColor: input.primaryColor?.trim().toUpperCase() || null,
    timeZone: input.timeZone?.trim() || "Africa/Kinshasa",
    supportHours: input.supportHours?.trim() || null,
  };
  await db.insert(agencyProfiles).values(values).onDuplicateKeyUpdate({ set: { ...values, updatedAt: new Date() } });
  return getAgencyProfile(input.agencyId);
}

export type AgencyRegistrationRequestStatus = "pending" | "approved" | "rejected";
export type AgencyRegistrationRequestInput = {
  requesterFirebaseUid: string;
  requesterEmail: string;
  requesterDisplayName?: string | null;
  agencyName: string;
  publicEmail: string;
  city: string;
};

export async function createAgencyRegistrationRequest(input: AgencyRegistrationRequestInput) {
  const db = await getDb();
  if (!db) throw new Error("Base de données indisponible pour la demande d’agence");
  const existing = await db.select().from(agencyRegistrationRequests).where(and(
    eq(agencyRegistrationRequests.requesterFirebaseUid, input.requesterFirebaseUid),
    eq(agencyRegistrationRequests.status, "pending"),
  )).orderBy(desc(agencyRegistrationRequests.createdAt)).limit(1);
  if (existing[0]) return { request: existing[0], deduplicated: true };
  const request = {
    id: randomUUID(), requesterFirebaseUid: input.requesterFirebaseUid,
    requesterEmail: input.requesterEmail.trim().toLowerCase(), requesterDisplayName: input.requesterDisplayName?.trim() || null,
    agencyName: input.agencyName.trim(), publicEmail: input.publicEmail.trim().toLowerCase(), city: input.city.trim(), status: "pending" as const,
  };
  await db.insert(agencyRegistrationRequests).values(request);
  return { request: { ...request, createdAt: new Date(), reviewedByFirebaseUid: null, reviewerNote: null, reviewedAt: null }, deduplicated: false };
}

export async function listAgencyRegistrationRequests(status?: AgencyRegistrationRequestStatus) {
  const db = await getDb();
  if (!db) return [];
  const query = db.select().from(agencyRegistrationRequests).orderBy(desc(agencyRegistrationRequests.createdAt));
  return status ? query.where(eq(agencyRegistrationRequests.status, status)) : query;
}

export async function getAgencyRegistrationRequest(id: string) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(agencyRegistrationRequests).where(eq(agencyRegistrationRequests.id, id)).limit(1);
  return rows[0];
}

export async function decideAgencyRegistrationRequest(input: { id: string; status: "approved" | "rejected"; reviewerFirebaseUid: string; reviewerNote?: string | null }) {
  const db = await getDb();
  if (!db) throw new Error("Base de données indisponible pour la décision d’agence");
  const request = await getAgencyRegistrationRequest(input.id);
  if (!request) throw new Error("Demande d’agence introuvable.");
  if (request.status !== "pending") throw new Error("Cette demande a déjà été traitée.");
  await db.update(agencyRegistrationRequests).set({ status: input.status, reviewedByFirebaseUid: input.reviewerFirebaseUid, reviewerNote: input.reviewerNote?.trim().slice(0, 512) || null, reviewedAt: new Date() }).where(and(eq(agencyRegistrationRequests.id, input.id), eq(agencyRegistrationRequests.status, "pending")));
  return getAgencyRegistrationRequest(input.id);
}

export type AgencyWhatsAppConfigInput = {
  agencyId: string;
  metaAppId?: string | null;
  businessAccountId?: string | null;
  phoneNumberId?: string | null;
  senderPhone?: string | null;
  utilityTemplateName?: string | null;
  accessToken?: string | null;
  appSecret?: string | null;
  verifyToken?: string | null;
  status?: "draft" | "verified" | "active" | "disabled";
};

export async function getAgencyWhatsAppConfig(agencyId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(agencyWhatsAppConfigs).where(eq(agencyWhatsAppConfigs.agencyId, agencyId)).limit(1);
  return rows[0];
}

export async function getAgencyWhatsAppConfigSummary(agencyId: string) {
  const config = await getAgencyWhatsAppConfig(agencyId);
  if (!config) return null;
  return {
    agencyId: config.agencyId, metaAppId: config.metaAppId, businessAccountId: config.businessAccountId, phoneNumberId: config.phoneNumberId,
    senderPhoneLast4: config.senderPhoneLast4, utilityTemplateName: config.utilityTemplateName, status: config.status, lastValidatedAt: config.lastValidatedAt,
    configured: Boolean(config.accessTokenCiphertext && config.appSecretCiphertext && config.verifyTokenCiphertext && config.phoneNumberId && config.utilityTemplateName),
    connectionConfigured: Boolean(config.accessTokenCiphertext && config.phoneNumberId && config.utilityTemplateName),
    webhookConfigured: Boolean(config.appSecretCiphertext && config.verifyTokenCiphertext),
  };
}

export async function upsertAgencyWhatsAppConfig(input: AgencyWhatsAppConfigInput) {
  const db = await getDb();
  if (!db) throw new Error("Base de données indisponible pour WhatsApp Business");
  const current = await getAgencyWhatsAppConfig(input.agencyId);
  const values = {
    agencyId: input.agencyId,
    metaAppId: input.metaAppId?.trim() || current?.metaAppId || null,
    businessAccountId: input.businessAccountId?.trim() || current?.businessAccountId || null,
    phoneNumberId: input.phoneNumberId?.trim() || current?.phoneNumberId || null,
    senderPhoneLast4: input.senderPhone ? maskLast4(input.senderPhone) : current?.senderPhoneLast4 || null,
    utilityTemplateName: input.utilityTemplateName?.trim() || current?.utilityTemplateName || null,
    accessTokenCiphertext: input.accessToken ? encryptAgencyCredential(input.accessToken.trim()) : current?.accessTokenCiphertext || null,
    appSecretCiphertext: input.appSecret ? encryptAgencyCredential(input.appSecret.trim()) : current?.appSecretCiphertext || null,
    verifyTokenCiphertext: input.verifyToken ? encryptAgencyCredential(input.verifyToken.trim()) : current?.verifyTokenCiphertext || null,
    status: input.status ?? current?.status ?? "draft" as const,
    lastValidatedAt: input.status === "draft" ? null : current?.lastValidatedAt ?? null,
  };
  await db.insert(agencyWhatsAppConfigs).values(values).onDuplicateKeyUpdate({ set: { ...values, updatedAt: new Date() } });
  return getAgencyWhatsAppConfigSummary(input.agencyId);
}

/** Enregistré uniquement après la vérification réelle du challenge webhook de Meta. */
export async function markAgencyWhatsAppMetaValidated(agencyId: string) {
  const db = await getDb();
  if (!db) throw new Error("Base de données indisponible pour WhatsApp Business");
  const config = await getAgencyWhatsAppConfig(agencyId);
  if (!config) throw new Error("Connexion Meta introuvable pour cette agence.");
  const isConfigured = Boolean(config.accessTokenCiphertext && config.appSecretCiphertext && config.verifyTokenCiphertext && config.phoneNumberId && config.utilityTemplateName);
  if (!isConfigured) throw new Error("La connexion Meta de l’agence est incomplète.");
  await db.update(agencyWhatsAppConfigs).set({ status: config.status === "active" ? "active" : "verified", lastValidatedAt: new Date() }).where(eq(agencyWhatsAppConfigs.agencyId, agencyId));
  return getAgencyWhatsAppConfigSummary(agencyId);
}

/** Activation explicite de l’éditeur, sans lire ni retourner les secrets chiffrés. */
export async function activateAgencyWhatsAppChannel(agencyId: string) {
  const db = await getDb();
  if (!db) throw new Error("Base de données indisponible pour WhatsApp Business");
  const summary = await getAgencyWhatsAppConfigSummary(agencyId);
  assertAgencyChannelCanActivate(summary);
  if (summary?.status !== "active") {
    await db.update(agencyWhatsAppConfigs).set({ status: "active" }).where(eq(agencyWhatsAppConfigs.agencyId, agencyId));
    await createAgencyWhatsAppLog({ agencyId, direction: "outbound", eventType: "channel_activated", status: "queued", sanitizedSummary: "Canal WhatsApp activé après validation Meta" });
  }
  return getAgencyWhatsAppConfigSummary(agencyId);
}

export type CentralAnalyticsPeriod = "7d" | "30d" | "90d" | "all";
export type AgencyAnalyticsPeriod = CentralAnalyticsPeriod | "custom";
export type AgencyAnalyticsDateRange = { start: Date; end: Date };

function centralPeriodStart(period: CentralAnalyticsPeriod) {
  if (period === "all") return null;
  const days = period === "7d" ? 7 : period === "30d" ? 30 : 90;
  const start = new Date();
  start.setDate(start.getDate() - days);
  return start;
}

function isWithinCentralPeriod(date: Date | null, start: Date | null) {
  return !start || (date !== null && date >= start);
}

/**
 * Agrégats éditeur par agence : aucune expédition, donnée client, secret ou
 * montant inventé ne quitte cette couche. Les montants Chariow restent séparés
 * par devise et sont retournés seulement lorsqu’un paiement est confirmé.
 */
export async function getCentralConsoleAnalytics(period: CentralAnalyticsPeriod) {
  const [profiles, allShipments, allExceptions] = await Promise.all([listAgencyProfiles(), listShipments(null), listExceptions(null)]);
  const start = centralPeriodStart(period);
  const agencies = await Promise.all(profiles.map(async (profile) => {
    const [subscription, transactions, logs, channel] = await Promise.all([
      getAgencySubscription(profile.agencyId), listAgencySaasTransactions(profile.agencyId), listAgencyWhatsAppLogs(profile.agencyId, 100), getAgencyWhatsAppConfigSummary(profile.agencyId),
    ]);
    const currentShipments = allShipments.filter((shipment) => shipment.agencyId === profile.agencyId);
    const periodShipments = currentShipments.filter((shipment) => isWithinCentralPeriod(shipment.updatedAt, start));
    const periodExceptions = allExceptions.filter(({ exception }) => exception.agencyId === profile.agencyId && isWithinCentralPeriod(exception.createdAt, start));
    const periodTransactions = transactions.filter((transaction) => isWithinCentralPeriod(transaction.createdAt, start));
    const periodLogs = logs.filter((log) => isWithinCentralPeriod(log.createdAt, start));
    const paidAmountMinorByCurrency = periodTransactions.filter((transaction) => transaction.status === "paid" && transaction.amountMinor !== null && transaction.currency)
      .reduce<Record<string, number>>((amounts, transaction) => ({ ...amounts, [transaction.currency!]: (amounts[transaction.currency!] ?? 0) + transaction.amountMinor! }), {});
    return {
      agencyId: profile.agencyId,
      operations: {
        trackedShipments: currentShipments.length,
        periodUpdates: periodShipments.length,
        activeShipments: currentShipments.filter((shipment) => !["delivered", "cancelled"].includes(shipment.status)).length,
        atRisk: currentShipments.filter((shipment) => ["delayed", "customs"].includes(shipment.status)).length,
        openExceptions: periodExceptions.filter(({ exception }) => exception.status !== "resolved").length,
      },
      usage: {
        shipmentLimit: subscription?.shipmentLimit ?? null,
        shipmentUsagePercent: subscription?.shipmentLimit && subscription.shipmentLimit > 0 ? Math.min(100, Math.round((currentShipments.length / subscription.shipmentLimit) * 100)) : null,
        alert: getAgencyUsageAlert(currentShipments.length, subscription?.shipmentLimit ?? null),
      },
      chariow: {
        productId: subscription?.chariowProductId ?? null,
        subscriptionStatus: subscription?.status ?? null,
        periodTransactions: periodTransactions.length,
        paidTransactions: periodTransactions.filter((transaction) => transaction.status === "paid").length,
        pendingTransactions: periodTransactions.filter((transaction) => ["created", "awaiting_payment"].includes(transaction.status)).length,
        failedTransactions: periodTransactions.filter((transaction) => transaction.status === "failed").length,
        paidAmountMinorByCurrency,
      },
      whatsApp: {
        status: channel?.status ?? "disabled",
        validatedAt: channel?.lastValidatedAt ?? null,
        periodMessages: periodLogs.length,
        deliveredMessages: periodLogs.filter((log) => ["delivered", "read"].includes(log.status)).length,
        failedMessages: periodLogs.filter((log) => log.status === "failed").length,
        activation: describeAgencyChannelActivation(channel),
      },
    };
  }));
  return { period, start: start?.toISOString() ?? null, agencies };
}

/** Analytique opérationnelle et d’engagement strictement limitée à une agence. */
export async function getAgencyAnalytics(agencyId: string, period: AgencyAnalyticsPeriod, customRange?: AgencyAnalyticsDateRange) {
  if (period === "custom" && !customRange) throw new Error("Une plage de dates est requise pour la période personnalisée.");
  const start = period === "custom" ? customRange!.start : centralPeriodStart(period);
  const end = period === "custom" ? customRange!.end : null;
  const withinRange = (date: Date | null) => isWithinCentralPeriod(date, start) && (!end || (date !== null && date <= end));
  const [agencyShipments, agencyExceptions, logs, channel] = await Promise.all([
    listShipments(agencyId), listExceptions(agencyId), listAgencyWhatsAppLogs(agencyId, 100), getAgencyWhatsAppConfigSummary(agencyId),
  ]);
  const periodShipments = agencyShipments.filter((shipment) => withinRange(shipment.updatedAt));
  const periodExceptions = agencyExceptions.filter(({ exception }) => withinRange(exception.createdAt));
  const periodLogs = logs.filter((log) => withinRange(log.createdAt));
  const outgoing = periodLogs.filter((log) => log.direction === "outbound");
  const attempted = outgoing.filter((log) => log.eventType === "shipment_update");
  const delivered = attempted.filter((log) => ["delivered", "read"].includes(log.status));
  const read = attempted.filter((log) => log.status === "read");
  const failed = attempted.filter((log) => log.status === "failed");
  const skipped = outgoing.filter((log) => log.eventType === "shipment_update_skipped");
  const statusCounts = periodShipments.reduce<Record<string, number>>((counts, shipment) => ({ ...counts, [shipment.status]: (counts[shipment.status] ?? 0) + 1 }), {});
  return {
    agencyId, period, start: start?.toISOString() ?? null, end: end?.toISOString() ?? null,
    operations: {
      periodShipments: periodShipments.length, totalShipments: agencyShipments.length,
      activeShipments: agencyShipments.filter((shipment) => !["delivered", "cancelled"].includes(shipment.status)).length,
      atRiskShipments: agencyShipments.filter((shipment) => ["delayed", "customs"].includes(shipment.status)).length,
      openExceptions: periodExceptions.filter(({ exception }) => exception.status !== "resolved").length, statusCounts,
    },
    whatsApp: {
      channelStatus: channel?.status ?? "disabled", periodLogEntries: periodLogs.length, attempted: attempted.length,
      delivered: delivered.length, read: read.length, failed: failed.length, skipped: skipped.length,
      deliveryRate: attempted.length ? Math.round((delivered.length / attempted.length) * 100) : null,
      readRate: delivered.length ? Math.round((read.length / delivered.length) * 100) : null,
    },
  };
}

export async function listAgencyWhatsAppLogs(agencyId: string, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(agencyWhatsAppMessageLogs).where(eq(agencyWhatsAppMessageLogs.agencyId, agencyId)).orderBy(desc(agencyWhatsAppMessageLogs.createdAt)).limit(Math.min(Math.max(limit, 1), 100));
}

/** Dernière activité sûre à afficher dans la supervision éditeur ; aucun secret ni numéro complet. */
export async function getLatestAgencyWhatsAppActivity(agencyId: string) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select({
    direction: agencyWhatsAppMessageLogs.direction,
    eventType: agencyWhatsAppMessageLogs.eventType,
    status: agencyWhatsAppMessageLogs.status,
    sanitizedSummary: agencyWhatsAppMessageLogs.sanitizedSummary,
    createdAt: agencyWhatsAppMessageLogs.createdAt,
  }).from(agencyWhatsAppMessageLogs).where(eq(agencyWhatsAppMessageLogs.agencyId, agencyId)).orderBy(desc(agencyWhatsAppMessageLogs.createdAt)).limit(1);
  return rows[0] ?? null;
}

export async function createAgencyWhatsAppLog(input: {
  agencyId: string; shipmentId?: string | null; clientFirebaseUid?: string | null; recipientPhone?: string | null;
  direction: "outbound" | "inbound"; eventType: string; templateName?: string | null; providerMessageId?: string | null;
  status: "queued" | "sent" | "delivered" | "read" | "failed" | "received"; sanitizedSummary?: string | null; errorCode?: string | null;
}) {
  const db = await getDb();
  if (!db) throw new Error("Base de données indisponible pour le journal WhatsApp");
  await db.insert(agencyWhatsAppMessageLogs).values({
    id: randomUUID(), agencyId: input.agencyId, shipmentId: input.shipmentId ?? null, clientFirebaseUid: input.clientFirebaseUid ?? null,
    recipientLast4: input.recipientPhone ? maskLast4(input.recipientPhone) : null, direction: input.direction, eventType: input.eventType,
    templateName: input.templateName ?? null, providerMessageId: input.providerMessageId ?? null, status: input.status,
    sanitizedSummary: input.sanitizedSummary?.slice(0, 512) ?? null, errorCode: input.errorCode ?? null,
  });
}

export async function updateAgencyWhatsAppLogStatus(input: { providerMessageId: string; status: "sent" | "delivered" | "read" | "failed"; errorCode?: string | null }) {
  const db = await getDb();
  if (!db) return;
  const now = new Date();
  await db.update(agencyWhatsAppMessageLogs).set({ status: input.status, errorCode: input.errorCode ?? null, deliveredAt: input.status === "delivered" || input.status === "read" ? now : undefined, readAt: input.status === "read" ? now : undefined }).where(eq(agencyWhatsAppMessageLogs.providerMessageId, input.providerMessageId));
}

export async function listAgencySaasTransactions(agencyId: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(saasTransactions).where(eq(saasTransactions.agencyId, agencyId)).orderBy(desc(saasTransactions.createdAt));
}

export async function createSaasCheckoutIntent(input: {
  agencyId: string;
  planId: SaaSPlanId;
  billingCycle: BillingCycle;
  chariowProductId: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Base de données indisponible pour la souscription");
  const plan = getSaaSPlan(input.planId);
  if (!plan) throw new Error("Plan SaaS invalide");
  const current = await getAgencySubscription(input.agencyId);
  const subscriptionId = current?.id ?? randomUUID();
  const transactionId = randomUUID();

  await db.transaction(async (tx) => {
    if (!current) {
      await tx.insert(agencySubscriptions).values({
        id: subscriptionId,
        agencyId: input.agencyId,
        planId: input.planId,
        billingCycle: input.billingCycle,
        status: "pending_payment",
        chariowProductId: input.chariowProductId,
        shipmentLimit: plan.shipmentLimit,
        teamMemberLimit: plan.teamMemberLimit,
      });
    }
    await tx.insert(saasTransactions).values({
      id: transactionId,
      agencyId: input.agencyId,
      subscriptionId,
      planId: input.planId,
      billingCycle: input.billingCycle,
      productId: input.chariowProductId,
      status: "created",
    });
  });

  return { transactionId, subscriptionId, plan };
}

export async function markSaasCheckoutAwaitingPayment(input: { transactionId: string; agencyId: string; saleId: string; transactionProviderId: string | null }) {
  const db = await getDb();
  if (!db) throw new Error("Base de données indisponible pour le paiement");
  await db.update(saasTransactions).set({
    providerSaleId: input.saleId,
    providerTransactionId: input.transactionProviderId,
    status: "awaiting_payment",
  }).where(and(eq(saasTransactions.id, input.transactionId), eq(saasTransactions.agencyId, input.agencyId)));
}

export async function applySaasPaymentEvent(input: {
  providerEventId: string;
  saleId: string;
  transactionProviderId?: string | null;
  status: SaaSTransactionStatus;
  currency?: string | null;
  amountMinor?: number | null;
  errorCode?: string | null;
}) {
  const db = await getDb();
  if (!db) throw new Error("Base de données indisponible pour le paiement");
  const existingEvent = await db.select({ id: saasTransactions.id }).from(saasTransactions).where(eq(saasTransactions.providerEventId, input.providerEventId)).limit(1);
  if (existingEvent[0]) return { applied: false as const, reason: "duplicate_event" as const };
  const rows = await db.select().from(saasTransactions).where(eq(saasTransactions.providerSaleId, input.saleId)).limit(1);
  const transaction = rows[0];
  if (!transaction) return { applied: false as const, reason: "unknown_sale" as const };

  await db.transaction(async (tx) => {
    await tx.update(saasTransactions).set({
      providerEventId: input.providerEventId,
      providerTransactionId: input.transactionProviderId ?? transaction.providerTransactionId,
      status: input.status,
      currency: input.currency ?? transaction.currency,
      amountMinor: input.amountMinor ?? transaction.amountMinor,
      errorCode: input.errorCode ?? null,
    }).where(eq(saasTransactions.id, transaction.id));

    if (input.status !== "paid") return;
    const plan = getSaaSPlan(transaction.planId);
    if (!plan) throw new Error("Plan associé à la transaction introuvable");
    const startsAt = new Date();
    const endsAt = nextSubscriptionEnd(startsAt, transaction.billingCycle);
    await tx.update(agencySubscriptions).set({
      planId: transaction.planId,
      billingCycle: transaction.billingCycle,
      status: "active",
      chariowProductId: transaction.productId,
      chariowSaleId: input.saleId,
      shipmentLimit: plan.shipmentLimit,
      teamMemberLimit: plan.teamMemberLimit,
      startsAt,
      endsAt,
      renewsAt: endsAt,
    }).where(eq(agencySubscriptions.id, transaction.subscriptionId));
  });
  return { applied: true as const, reason: null };
}
