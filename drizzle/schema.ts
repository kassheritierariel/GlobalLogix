import { bigint, index, int, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const mobilePushTokens = mysqlTable("mobilePushTokens", {
  id: int("id").autoincrement().primaryKey(),
  firebaseUid: varchar("firebaseUid", { length: 128 }).notNull(),
  agencyId: varchar("agencyId", { length: 128 }),
  token: varchar("token", { length: 255 }).notNull(),
  platform: mysqlEnum("platform", ["ios", "android"]).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  uniqueIndex("mobilePushTokens_token_unique").on(table.token),
  index("mobilePushTokens_agency_idx").on(table.agencyId),
  index("mobilePushTokens_uid_idx").on(table.firebaseUid),
]);

/** Un compte client Firebase est identifié par un unique numéro WhatsApp vérifié par SMS. */
export const clientAccounts = mysqlTable("clientAccounts", {
  firebaseUid: varchar("firebaseUid", { length: 128 }).primaryKey(),
  whatsAppNumber: varchar("whatsAppNumber", { length: 16 }).notNull(),
  displayName: varchar("displayName", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  uniqueIndex("clientAccounts_whatsapp_unique").on(table.whatsAppNumber),
]);

export const shipments = mysqlTable("shipments", {
  id: varchar("id", { length: 64 }).primaryKey(),
  agencyId: varchar("agencyId", { length: 128 }).notNull(),
  trackingNumber: varchar("trackingNumber", { length: 128 }).notNull(),
  customerName: varchar("customerName", { length: 255 }).notNull(),
  customerEmail: varchar("customerEmail", { length: 320 }),
  customerPhone: varchar("customerPhone", { length: 16 }),
  origin: varchar("origin", { length: 255 }).notNull(),
  destination: varchar("destination", { length: 255 }).notNull(),
  mode: mysqlEnum("mode", ["air", "sea", "land", "rail"]).notNull(),
  status: mysqlEnum("status", ["planned", "in_transit", "customs", "delayed", "delivered", "cancelled"]).notNull(),
  progress: int("progress").notNull().default(0),
  distanceRemainingKm: int("distanceRemainingKm"),
  eta: timestamp("eta"),
  currentPosition: varchar("currentPosition", { length: 255 }),
  source: varchar("source", { length: 64 }).notNull().default("manual"),
  confidence: mysqlEnum("confidence", ["high", "medium", "low"]).notNull().default("medium"),
  sequence: bigint("sequence", { mode: "number" }).notNull().default(0),
  lastTelemetryAt: timestamp("lastTelemetryAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  uniqueIndex("shipments_tracking_unique").on(table.trackingNumber),
  index("shipments_agency_idx").on(table.agencyId),
  index("shipments_agency_status_idx").on(table.agencyId, table.status),
]);

/** Liaison d’un colis à son unique propriétaire client après correspondance du numéro vérifié. */
export const clientShipmentLinks = mysqlTable("clientShipmentLinks", {
  id: varchar("id", { length: 64 }).primaryKey(),
  firebaseUid: varchar("firebaseUid", { length: 128 }).notNull(),
  shipmentId: varchar("shipmentId", { length: 64 }).notNull(),
  agencyId: varchar("agencyId", { length: 128 }).notNull(),
  linkedAt: timestamp("linkedAt").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("clientShipmentLinks_client_shipment_unique").on(table.firebaseUid, table.shipmentId),
  uniqueIndex("clientShipmentLinks_shipment_owner_unique").on(table.shipmentId),
  index("clientShipmentLinks_client_idx").on(table.firebaseUid),
]);

/** Identité visible et coordonnées d’une agence locataire du SaaS GlobalLogix. */
export const agencyProfiles = mysqlTable("agencyProfiles", {
  agencyId: varchar("agencyId", { length: 128 }).primaryKey(),
  publicSlug: varchar("publicSlug", { length: 80 }).notNull(),
  displayName: varchar("displayName", { length: 255 }).notNull(),
  legalName: varchar("legalName", { length: 255 }),
  publicEmail: varchar("publicEmail", { length: 320 }),
  publicPhone: varchar("publicPhone", { length: 32 }),
  website: varchar("website", { length: 512 }),
  logoUrl: varchar("logoUrl", { length: 1024 }),
  primaryColor: varchar("primaryColor", { length: 7 }),
  timeZone: varchar("timeZone", { length: 64 }).notNull().default("Africa/Kinshasa"),
  supportHours: varchar("supportHours", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  uniqueIndex("agencyProfiles_public_slug_unique").on(table.publicSlug),
]);

/** Demandes d’agence issues d’une identité Firebase vérifiée, sans rôle tenant avant décision de l’éditeur. */
export const agencyRegistrationRequests = mysqlTable("agencyRegistrationRequests", {
  id: varchar("id", { length: 64 }).primaryKey(),
  requesterFirebaseUid: varchar("requesterFirebaseUid", { length: 128 }).notNull(),
  requesterEmail: varchar("requesterEmail", { length: 320 }).notNull(),
  requesterDisplayName: varchar("requesterDisplayName", { length: 255 }),
  agencyName: varchar("agencyName", { length: 255 }).notNull(),
  publicEmail: varchar("publicEmail", { length: 320 }).notNull(),
  city: varchar("city", { length: 120 }).notNull(),
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).notNull().default("pending"),
  reviewedByFirebaseUid: varchar("reviewedByFirebaseUid", { length: 128 }),
  reviewerNote: varchar("reviewerNote", { length: 512 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  reviewedAt: timestamp("reviewedAt"),
}, (table) => [
  index("agencyRegistrationRequests_status_created_idx").on(table.status, table.createdAt),
  index("agencyRegistrationRequests_requester_idx").on(table.requesterFirebaseUid, table.createdAt),
]);

/** Connexion Meta/WhatsApp Business appartenant exclusivement à une agence. Les secrets sont chiffrés côté serveur. */
export const agencyWhatsAppConfigs = mysqlTable("agencyWhatsAppConfigs", {
  agencyId: varchar("agencyId", { length: 128 }).primaryKey(),
  metaAppId: varchar("metaAppId", { length: 128 }),
  businessAccountId: varchar("businessAccountId", { length: 128 }),
  phoneNumberId: varchar("phoneNumberId", { length: 128 }),
  senderPhoneLast4: varchar("senderPhoneLast4", { length: 4 }),
  utilityTemplateName: varchar("utilityTemplateName", { length: 255 }),
  accessTokenCiphertext: text("accessTokenCiphertext"),
  appSecretCiphertext: text("appSecretCiphertext"),
  verifyTokenCiphertext: text("verifyTokenCiphertext"),
  status: mysqlEnum("status", ["draft", "verified", "active", "disabled"]).notNull().default("draft"),
  lastValidatedAt: timestamp("lastValidatedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/** Historique de notifications et messages du canal WhatsApp d’une agence, sans conserver de secret ni de numéro complet. */
export const agencyWhatsAppMessageLogs = mysqlTable("agencyWhatsAppMessageLogs", {
  id: varchar("id", { length: 64 }).primaryKey(),
  agencyId: varchar("agencyId", { length: 128 }).notNull(),
  shipmentId: varchar("shipmentId", { length: 64 }),
  clientFirebaseUid: varchar("clientFirebaseUid", { length: 128 }),
  recipientLast4: varchar("recipientLast4", { length: 4 }),
  direction: mysqlEnum("direction", ["outbound", "inbound"]).notNull(),
  eventType: varchar("eventType", { length: 64 }).notNull(),
  templateName: varchar("templateName", { length: 255 }),
  providerMessageId: varchar("providerMessageId", { length: 128 }),
  status: mysqlEnum("status", ["queued", "sent", "delivered", "read", "failed", "received"]).notNull(),
  sanitizedSummary: varchar("sanitizedSummary", { length: 512 }),
  errorCode: varchar("errorCode", { length: 128 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  deliveredAt: timestamp("deliveredAt"),
  readAt: timestamp("readAt"),
}, (table) => [
  uniqueIndex("agencyWhatsAppMessageLogs_provider_message_unique").on(table.providerMessageId),
  index("agencyWhatsAppMessageLogs_agency_created_idx").on(table.agencyId, table.createdAt),
  index("agencyWhatsAppMessageLogs_shipment_idx").on(table.shipmentId),
]);

/** Abonnement SaaS courant d’une agence. Une agence ne possède qu’un abonnement actif ou en attente. */
export const agencySubscriptions = mysqlTable("agencySubscriptions", {
  id: varchar("id", { length: 64 }).primaryKey(),
  agencyId: varchar("agencyId", { length: 128 }).notNull(),
  planId: varchar("planId", { length: 32 }).notNull(),
  billingCycle: mysqlEnum("billingCycle", ["monthly", "annual"]).notNull(),
  status: mysqlEnum("status", ["trial", "pending_payment", "active", "past_due", "cancelled", "expired"]).notNull().default("pending_payment"),
  chariowProductId: varchar("chariowProductId", { length: 128 }),
  chariowSaleId: varchar("chariowSaleId", { length: 128 }),
  shipmentLimit: int("shipmentLimit"),
  teamMemberLimit: int("teamMemberLimit"),
  startsAt: timestamp("startsAt"),
  endsAt: timestamp("endsAt"),
  renewsAt: timestamp("renewsAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  uniqueIndex("agencySubscriptions_agency_unique").on(table.agencyId),
  uniqueIndex("agencySubscriptions_chariow_sale_unique").on(table.chariowSaleId),
  index("agencySubscriptions_status_idx").on(table.status),
]);

/** Journal immuable des échanges de paiement, sans données de carte ou de Mobile Money. */
export const saasTransactions = mysqlTable("saasTransactions", {
  id: varchar("id", { length: 64 }).primaryKey(),
  agencyId: varchar("agencyId", { length: 128 }).notNull(),
  subscriptionId: varchar("subscriptionId", { length: 64 }).notNull(),
  provider: mysqlEnum("provider", ["chariow"]).notNull().default("chariow"),
  providerSaleId: varchar("providerSaleId", { length: 128 }),
  providerTransactionId: varchar("providerTransactionId", { length: 128 }),
  providerEventId: varchar("providerEventId", { length: 128 }),
  status: mysqlEnum("status", ["created", "awaiting_payment", "paid", "failed", "cancelled", "refunded"]).notNull().default("created"),
  planId: varchar("planId", { length: 32 }).notNull(),
  billingCycle: mysqlEnum("billingCycle", ["monthly", "annual"]).notNull(),
  productId: varchar("productId", { length: 128 }).notNull(),
  currency: varchar("currency", { length: 8 }),
  amountMinor: int("amountMinor"),
  errorCode: varchar("errorCode", { length: 128 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  uniqueIndex("saasTransactions_provider_sale_unique").on(table.providerSaleId),
  uniqueIndex("saasTransactions_provider_event_unique").on(table.providerEventId),
  index("saasTransactions_agency_idx").on(table.agencyId, table.createdAt),
  index("saasTransactions_subscription_idx").on(table.subscriptionId),
]);

export const shipmentEvents = mysqlTable("shipmentEvents", {
  id: varchar("id", { length: 64 }).primaryKey(),
  shipmentId: varchar("shipmentId", { length: 64 }).notNull(),
  agencyId: varchar("agencyId", { length: 128 }).notNull(),
  eventId: varchar("eventId", { length: 128 }).notNull(),
  type: mysqlEnum("type", ["location_update", "status_changed", "eta_changed", "customs_hold", "delay_detected", "note"]).notNull(),
  severity: mysqlEnum("severity", ["info", "warning", "critical"]).notNull().default("info"),
  source: varchar("source", { length: 64 }).notNull(),
  confidence: mysqlEnum("confidence", ["high", "medium", "low"]).notNull().default("medium"),
  sequence: bigint("sequence", { mode: "number" }).notNull(),
  message: text("message").notNull(),
  payload: text("payload"),
  occurredAt: timestamp("occurredAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("shipmentEvents_event_unique").on(table.eventId),
  index("shipmentEvents_shipment_sequence_idx").on(table.shipmentId, table.sequence),
  index("shipmentEvents_agency_occurred_idx").on(table.agencyId, table.occurredAt),
]);

export const exceptionCases = mysqlTable("exceptionCases", {
  id: varchar("id", { length: 64 }).primaryKey(),
  shipmentId: varchar("shipmentId", { length: 64 }).notNull(),
  agencyId: varchar("agencyId", { length: 128 }).notNull(),
  kind: mysqlEnum("kind", ["delay", "customs", "no_signal", "eta_risk", "temperature"]).notNull(),
  severity: mysqlEnum("severity", ["warning", "critical"]).notNull(),
  status: mysqlEnum("status", ["open", "acknowledged", "resolved"]).notNull().default("open"),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  slaDueAt: timestamp("slaDueAt"),
  assignedTo: varchar("assignedTo", { length: 128 }),
  resolvedAt: timestamp("resolvedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("exceptionCases_agency_status_idx").on(table.agencyId, table.status),
  index("exceptionCases_shipment_idx").on(table.shipmentId),
]);

export const shipmentShareLinks = mysqlTable("shipmentShareLinks", {
  id: varchar("id", { length: 64 }).primaryKey(),
  shipmentId: varchar("shipmentId", { length: 64 }).notNull(),
  agencyId: varchar("agencyId", { length: 128 }).notNull(),
  tokenHash: varchar("tokenHash", { length: 64 }).notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  revokedAt: timestamp("revokedAt"),
  createdBy: varchar("createdBy", { length: 128 }).notNull(),
  views: int("views").notNull().default(0),
  lastViewedAt: timestamp("lastViewedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("shipmentShareLinks_token_unique").on(table.tokenHash),
  index("shipmentShareLinks_shipment_idx").on(table.shipmentId),
  index("shipmentShareLinks_expiry_idx").on(table.expiresAt),
]);
