import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import { DEMO_SHIPMENTS } from "@/lib/demo-data";
import { getFirebaseIdToken } from "@/lib/firebase";
import { fetchShipments, hasLogisticsApi } from "@/lib/logistics-api";
import { getRealtimeUrl, mergeShipmentUpdate, parseRealtimeEvent } from "@/lib/realtime";
import { useAuth } from "@/lib/auth-context";
import type { DetailedTransitEvent } from "@/lib/shipment-detail";
import { createSimulatedGpsUpdate, type GpsSimulationOptions } from "@/lib/gps-simulator";
import type { Shipment } from "@/lib/types";

type TrackingContextValue = {
  shipments: Shipment[];
  selectedShipmentId: string;
  connectionState: "connecting" | "connected" | "disconnected" | "error";
  lastEventAt: string;
  reconnect: () => void;
  selectShipment: (shipmentId: string) => void;
  toggleLive: () => void;
  resetLive: () => void;
  simulationEvents: Record<string, DetailedTransitEvent[]>;
  simulateGpsUpdate: (shipmentId: string, options?: GpsSimulationOptions) => void;
};

const TrackingContext = createContext<TrackingContextValue | undefined>(undefined);

const formatEventTime = () => new Date().toLocaleTimeString("fr-FR", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

export function TrackingProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [shipments, setShipments] = useState<Shipment[]>(DEMO_SHIPMENTS);
  const [selectedShipmentId, setSelectedShipmentId] = useState(DEMO_SHIPMENTS[0].id);
  const [connectionState, setConnectionState] = useState<TrackingContextValue["connectionState"]>("disconnected");
  const [lastEventAt, setLastEventAt] = useState("En attente du premier événement");
  const [simulationEvents, setSimulationEvents] = useState<Record<string, DetailedTransitEvent[]>>({});
  const socketRef = useRef<WebSocket | null>(null);
  const shipmentsRef = useRef<Shipment[]>(DEMO_SHIPMENTS);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttempt = useRef(0);

  useEffect(() => {
    shipmentsRef.current = shipments;
  }, [shipments]);

  useEffect(() => {
    const loadRealShipments = async () => {
      if (!user || !hasLogisticsApi()) return;
      try {
        const next = await fetchShipments();
        if (next.length) {
          setShipments(next);
          setSelectedShipmentId((selected) => next.some((shipment) => shipment.id === selected) ? selected : next[0].id);
          setLastEventAt("Synchronisé avec la base logistique");
        }
      } catch {
        setLastEventAt("Mode hors ligne : données locales affichées");
      }
    };
    void loadRealShipments();
  }, [user?.uid]);

  useEffect(() => {
    let disposed = false;
    const connect = async () => {
      const url = getRealtimeUrl();
      const token = await getFirebaseIdToken();
      if (!url || !token || disposed) {
        setConnectionState("disconnected");
        return;
      }
      setConnectionState("connecting");
      const socket = new WebSocket(url);
      socketRef.current = socket;
      socket.onopen = () => socket.send(JSON.stringify({ type: "authenticate", token }));
      socket.onmessage = ({ data }) => {
        const event = parseRealtimeEvent(String(data));
        if (!event) return;
        if (event.type === "ready") {
          reconnectAttempt.current = 0;
          setConnectionState("connected");
          socket.send(JSON.stringify({ type: "subscribe", shipmentIds: shipmentsRef.current.map((shipment) => shipment.id) }));
        }
        if (event.type === "shipment.updated") {
          setShipments((current) => mergeShipmentUpdate(current, event.shipment));
          setLastEventAt(formatEventTime());
        }
        if (event.type === "error") setConnectionState("error");
      };
      socket.onclose = () => {
        if (disposed) return;
        setConnectionState("disconnected");
        const delay = Math.min(30_000, 1_000 * 2 ** reconnectAttempt.current) + Math.round(Math.random() * 400);
        reconnectAttempt.current += 1;
        reconnectTimer.current = setTimeout(() => void connect(), delay);
      };
      socket.onerror = () => setConnectionState("error");
    };
    void connect();
    return () => {
      disposed = true;
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      socketRef.current?.close(1000, "Session stopped");
    };
  }, [user?.uid]);

  const resetLive = () => {
    setShipments(DEMO_SHIPMENTS);
    setSelectedShipmentId(DEMO_SHIPMENTS[0].id);
    setSimulationEvents({});
  };

  const simulateGpsUpdate = (shipmentId: string, options: GpsSimulationOptions = {}) => {
    const shipment = shipmentsRef.current.find((item) => item.id === shipmentId);
    if (!shipment) return;
    const sequence = simulationEvents[shipmentId]?.length ?? 0;
    const update = createSimulatedGpsUpdate(shipment, sequence, options);
    setShipments((current) => current.map((item) => item.id === shipmentId ? { ...item, currentPosition: update.position, progress: update.progress, lastTelemetryAt: formatEventTime() } : item));
    setSimulationEvents((current) => ({ ...current, [shipmentId]: [update.event, ...(current[shipmentId] ?? [])] }));
    setLastEventAt(`Simulation GPS locale · ${formatEventTime()}`);
  };

  const value = useMemo(() => ({
    shipments,
    selectedShipmentId,
    connectionState,
    lastEventAt,
    selectShipment: setSelectedShipmentId,
    toggleLive: () => socketRef.current?.close(1000, "Operator paused realtime"),
    reconnect: () => {
      socketRef.current?.close(1000, "Operator reconnect");
    },
    resetLive,
    simulationEvents,
    simulateGpsUpdate,
  }), [shipments, selectedShipmentId, connectionState, lastEventAt, simulationEvents]);

  return <TrackingContext.Provider value={value}>{children}</TrackingContext.Provider>;
}

export function useTracking() {
  const context = useContext(TrackingContext);
  if (!context) {
    throw new Error("useTracking doit être utilisé dans TrackingProvider.");
  }
  return context;
}
