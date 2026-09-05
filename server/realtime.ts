import crypto from "node:crypto";
import type { Server } from "node:http";
import type { IncomingMessage } from "node:http";
import { WebSocketServer, WebSocket, type RawData } from "ws";

import { canManageAgency, type FirebasePrincipal, verifyFirebaseAuthorization } from "./firebase-admin";
import * as db from "./db";

type ShipmentStatus = "in-transit" | "customs" | "delayed" | "delivered";

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
const knownShipments: Record<string, string> = {
  "GLX-801": "agency-kinshasa",
  "GLX-806": "agency-kinshasa",
  "GLX-824": "agency-kinshasa",
  "GLX-831": "agency-kinshasa",
};

function parseAllowedOrigins() {
  return (process.env.REALTIME_ALLOWED_ORIGINS ?? "").split(",").map((value) => value.trim()).filter(Boolean);
}

function isAllowedOrigin(request: IncomingMessage) {
  const origin = request.headers.origin;
  if (!origin) return true; // Les clients natifs n’envoient généralement pas Origin.
  const allowedOrigins = parseAllowedOrigins();
  return allowedOrigins.includes(origin);
}

function send(socket: WebSocket, payload: Record<string, unknown>) {
  if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify(payload));
}

function isShipmentUpdate(value: unknown): value is ShipmentUpdate {
  const item = value as Partial<ShipmentUpdate>;
  return typeof item?.id === "string" && typeof item.trackingNumber === "string" &&
    typeof item.origin === "string" && typeof item.destination === "string" &&
    ["air", "sea", "land"].includes(item.mode ?? "") &&
    ["in-transit", "customs", "delayed", "delivered"].includes(item.status ?? "") &&
    typeof item.progress === "number" && item.progress >= 0 && item.progress <= 100 &&
    typeof item.distanceRemainingKm === "number" && item.distanceRemainingKm >= 0 &&
    typeof item.eta === "string" && typeof item.lastTelemetryAt === "string" &&
    typeof item.currentPosition === "string";
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

export async function publishShipmentUpdate(input: Omit<ShipmentUpdateEvent, "type" | "eventId">) {
  const agencyId = knownShipments[input.shipment.id];
  if (!agencyId || agencyId !== input.agencyId) throw new Error("Expédition ou périmètre agence invalide");
  const event: ShipmentUpdateEvent = {
    ...input,
    type: "shipment.updated",
    eventId: crypto.randomUUID(),
  };

  for (const [socket, client] of clients) {
    if (client.principal.agencyId === event.agencyId || client.principal.role === "super_admin") {
      if (client.subscriptions.size === 0 || client.subscriptions.has(event.shipment.id)) send(socket, event);
    }
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
    let sequence = 0;
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
          const permitted = message.shipmentIds.filter((shipmentId) => {
            const agency = knownShipments[shipmentId];
            return agency && canManageAgency(client.principal, agency);
          });
          client.subscriptions = new Set(permitted);
          send(socket, { type: "subscribed", shipmentIds: permitted });
          return;
        }
        if (message.type === "publish" && isShipmentUpdate(message.shipment)) {
          const shipment = message.shipment;
          const agencyId = knownShipments[shipment.id];
          if (!agencyId || !canManageAgency(client.principal, agencyId)) throw new Error("Publication interdite");
          sequence += 1;
          await publishShipmentUpdate({ agencyId, sequence, shipment, important: shipment.status === "delayed" || shipment.status === "customs" });
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
