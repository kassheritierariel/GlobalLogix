import type { Shipment } from "@/lib/types";

export type MultimodalLocationPresentation = {
  title: string;
  subtitle: string;
  icon: "flight" | "directions-boat" | "local-shipping";
  landmarkLabel: string;
};

export function getMultimodalLocationPresentation(shipment: Pick<Shipment, "mode" | "currentPosition">): MultimodalLocationPresentation {
  if (shipment.mode === "air") {
    return { title: "Localisation aérienne", subtitle: "Couloir de vol, escale ou aéroport opérationnel", icon: "flight", landmarkLabel: "Dernier point aérien" };
  }
  if (shipment.mode === "sea") {
    return { title: "Localisation maritime", subtitle: "Port, mouillage, corridor maritime ou escale", icon: "directions-boat", landmarkLabel: "Dernier point maritime" };
  }
  return { title: "Localisation terrestre", subtitle: "Hub, axe routier, terminal ou frontière", icon: "local-shipping", landmarkLabel: "Dernier point terrestre" };
}

export function getExternalMapUrl(shipment: Pick<Shipment, "currentPosition" | "destination">) {
  const query = [shipment.currentPosition, shipment.destination].filter(Boolean).join(", ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}
