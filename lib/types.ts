export type ShipmentStatus = "in-transit" | "customs" | "delayed" | "delivered";
export type ShipmentMode = "air" | "sea" | "land";

export type MobileUser = {
  uid: string;
  email: string | null;
  displayName: string;
  role: "super_admin" | "agency_admin" | "staff" | "viewer" | "client";
  agencyId: string | null;
};

export type Shipment = {
  id: string;
  /** Présent pour les flux administratifs consolidés ; omis dans les vues publiques. */
  agencyId?: string;
  trackingNumber: string;
  origin: string;
  destination: string;
  mode: ShipmentMode;
  status: ShipmentStatus;
  progress: number;
  distanceRemainingKm: number;
  eta: string;
  lastTelemetryAt: string;
  currentPosition: string;
};
