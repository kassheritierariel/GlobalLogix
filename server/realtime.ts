import crypto from "node:crypto";
import type { IncomingMessage, Server } from "node:http";
import { WebSocket, WebSocketServer, type RawData } from "ws";

import { canManageAgency, type FirebasePrincipal, verifyFirebaseAuthorization } from "./firebase-admin";
import * as db from "./db";

type ShipmentStatus = "in-transit" | "customs" | "delayed" | "delivered";

type StoredShipment = NonNullable<Awaited<ReturnType<typeof db.getShipment>>>;

export type ShipmentUpdate = {
  id: string;
  trackingNumber: string;
  origin: string;
  destination: string;
  mode: "air" | "sea" | "land";
  status: ShipmentStatus;
  progress: number;
  distanceRemainingKm: number;
  eta: string;
  lastTelemetryAt: string;
  currentPosition: string;
};

export type ShipmentUpdateEvent = {
  type: "shipment.updated";
  eventId: string;
  sequence: number;
  agencyId: string;
  shipment: ShipmentUpdate;
  important: boolean;
};

type ConnectedClient = { principal: FirebasePrincipal; subscriptions: Set<string> };
const clients = new Map<WebSocket, ConnectedClient>();

function parseAllowedOrigins() {
  return (process.env.REALTIME_ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((value: string) => value.trim())
    .filter(Boolean);
}

function isAllowedOrigin(request: IncomingMessage) {
  const origin = request.headers.origin;
  if (!origin) return true;
  const allowedOrigins = parseAllowedOrigins();
  if (allowedOrigins.length) return allowedOrigins.includes(origin);
  const host = request.headers.host;
  if (!host) return false;
  return origin === `https://${host}` || (process.env.NODE_ENV !== "production" && origin === `http://${host}`);
}

function send(socket: WebSocket, payload: Record<string, unknown>) {
  if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify(payload));
}

function isShipmentUpdate(value: unknown): value is ShipmentUpdate {
  const item = value as Partial<ShipmentUpdate>;
  return typeof item?.id === "string" && item.id.length <= 64 &&
    typeof item.trackingNumber === "string" && item.trackingNumber.length <= 128 &&
    typeof item.origin === "string" && item.origin.length <= 255 &&
    typeof item.destination === "string" && item.destination.length <= 255 &&
    ["air", "sea", "land"].includes(item.mode ?? "") &&
    ["in-transit", "customs", "delayed", "delivered"].includes(item.status ?? "") &&
    typeof item.progress === "number" && item.progress >= 0 && item.progress <= 100 &&
    typeof item.distanceRemainingKm === "number" && item.distanceRemainingKm >= 0 &&
    typeof item.eta === "string" && item.eta.length <= 128 &&
    typeof item.lastTelemetryAt === "string" && item.lastTelemetryAt.length <= 128 &&
    typeof item.currentPosition === "string" && item.currentPosition.length <= 255;
}

function toRealtimeStatus(status: StoredShipment["status"]): ShipmentStatus {
  if (status === "customs" || status === "delayed" || status === "delivered") return status;
  return "in-transit";
}

function toStoredStatus(status: ShipmentStatus): StoredShipment["status"] {
  return status === "in-transit" ? "in_transit" : status;
}

function toShipmentUpdate(shipment: StoredShipment): ShipmentUpdate {
  return {
    id: shipment.id,
    trackingNumber: shipment.trackingNumber,
    origin: shipment.origin,
    destination: shipment.destination,
    mode: shipment.mode === "rail" ? "land" : shipment.mode,
    status: toRealtimeStatus(shipment.status),
    progress: shipment.progress,
    distanceRemainingKm: shipment.distanceRemainingKm ?? 0,
    eta: shipment.eta?.toISOString() ?? "",
    lastTelemetryAt: shipment.lastTelemetryAt?.toISOString() ?? shipment.updatedAt.toISOString(),
    currentPosition: shipment.currentPosition ?? "Position en attente",
  };
}

async function canReadShipment(principal: FirebasePrincipal, shipmentId: string) {
  if (principal.role === "client") return Boolean(await db.getClientShipment(principal.uid, shipmentId));
  const agencyScope = principal.role === "super_admin" ? null : principal.agencyId;
  if (!agencyScope && principal.role !== "super_admin") return false;
  return Boolean(await db.getShipment(shipmentId, agencyScope));
}

async function sendShipmentPush(event: ShipmentUpdateEvent) {
  if (!event.important) return;
  const tokens = await db.listPushTokensForAgency(event.agencyId);
  if (!tokens.length) return;

  const response = await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(tokens.map((token: string) => ({
      to: token,
      sound: "default",
      channelId: "shipment_updates",
      title: `Mise à jour · ${event.shipment.trackingNumber}`,
      body: `${event.shipment.status === "delayed" ? "Retard signalé" : "Statut actualisé"} — ${event.shipment.currentPosition}`,
      data: { url: "/tracking", shipmentId: event.shipment.id, eventId: event.eventId },
    }))),
  });
  if (!response.ok) console.error("[Push] Expo push gateway rejected shipment update", response.status);
}

async function persistAndPublishShipmentUpdate(principal: FirebasePrincipal, incoming: ShipmentUpdate) {
  const agencyScope = principal.role === "super_admin" ? null : principal.agencyId;
  const current = await db.getShipment(incoming.id, agencyScope);
  if (!current || !canManageAgency(principal, current.agencyId)) throw new Error("Publication interdite");
  if (incoming.trackingNumber !== current.trackingNumber) throw new Error("Référence d’expédition incohérente");

  const eventId = crypto.randomUUID();
  const sequence = current.sequence + 1;
  const occurredAt = new Date();
  const status = toStoredStatus(incoming.status);
  const important = status === "delayed" || status === "customs";
  const result = await db.recordShipmentEvent({
    id: crypto.randomUUID(),
    shipmentId: current.id,
    agencyId: current.agencyId,
    eventId,
    type: current.status === status ? "location_update" : "status_changed",
    severity: important ? "warning" : "info",
    source: "websocket_operator",
    confidence: "medium",
    sequence,
    message: `Mise à jour opérateur : ${incoming.currentPosition}`,
    occurredAt,
    shipmentUpdate: {
      status,
      progress: incoming.progress,
      distanceRemainingKm: incoming.distanceRemainingKm,
      eta: incoming.eta ? new Date(incoming.eta) : null,
      currentPosition: incoming.currentPosition,
    },
  });
  if (!result.accepted) throw new Error("Une mise à jour plus récente existe déjà");
  const stored = await db.getShipment(current.id, current.agencyId);
  if (!stored) throw new Error("Expédition indisponible après mise à jour");
  const event: ShipmentUpdateEvent = {
    type: "shipment.updated",
    eventId,
    sequence,
    agencyId: stored.agencyId,
    shipment: toShipmentUpdate(stored),
    important,
  };

  for (const [socket, client] of clients) {
    if (client.subscriptions.has(event.shipment.id)) send(socket, event);
  }
  await sendShipmentPush(event);
  return event;
}

export function registerRealtimeServer(server: Server) {
  const wss = new WebSocketServer({ noServer: true, maxPayload: 16 * 1024 });

  server.on("upgrade", (request, socket, head) => {
    const path = new URL(request.url ?? "/", "http://localhost").pathname;
    if (path !== "/api/realtime") return;
    if (!isAllowedOrigin(request)) {
      socket.write("HTTP/1.1 403 Forbidden\r\n\r\n");
      socket.destroy();
      return;
    }
    wss.handleUpgrade(request, socket, head, (websocket: WebSocket) => wss.emit("connection", websocket, request));
  });

  wss.on("connection", (socket: WebSocket) => {
    const timeout = setTimeout(() => socket.close(4001, "Authentication timeout"), 10_000);
    const heartbeat = setInterval(() => {
      if (socket.readyState === WebSocket.OPEN) socket.ping();
    }, 25_000);

    socket.on("message", async (raw: RawData) => {
      try {
        const message = JSON.parse(raw.toString()) as { type?: string; token?: string; shipmentIds?: string[]; shipment?: unknown };
        if (message.type === "authenticate" && typeof message.token === "string") {
          const principal = await verifyFirebaseAuthorization(`Bearer ${message.token}`);
          clients.set(socket, { principal, subscriptions: new Set() });
          clearTimeout(timeout);
          send(socket, { type: "ready", connectionId: crypto.randomUUID() });
          return;
        }

        const client = clients.get(socket);
        if (!client) throw new Error("Authentification WebSocket requise");
        if (message.type === "subscribe" && Array.isArray(message.shipmentIds)) {
          const requestedIds = [...new Set(message.shipmentIds.filter((id) => typeof id === "string" && id.length > 0 && id.length <= 64))].slice(0, 100);
          const permissions = await Promise.all(requestedIds.map(async (shipmentId) => ({ shipmentId, allowed: await canReadShipment(client.principal, shipmentId) })));
          const permitted = permissions.filter(({ allowed }) => allowed).map(({ shipmentId }) => shipmentId);
          client.subscriptions = new Set(permitted);
          send(socket, { type: "subscribed", shipmentIds: permitted });
          return;
        }
        if (message.type === "publish" && isShipmentUpdate(message.shipment)) {
          await persistAndPublishShipmentUpdate(client.principal, message.shipment);
          return;
        }
        throw new Error("Message WebSocket invalide");
      } catch (error) {
        send(socket, { type: "error", message: error instanceof Error ? error.message : "Erreur temps réel" });
      }
    });

    socket.on("close", () => {
      clearTimeout(timeout);
      clearInterval(heartbeat);
      clients.delete(socket);
    });
  });
}
