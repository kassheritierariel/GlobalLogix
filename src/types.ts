export interface Shipment {
  id: string;
  trackingNumber: string;
  sender: string;
  receiver: string;
  origin: string;
  destination: string;
  status: 'pending' | 'in-transit' | 'customs' | 'delayed' | 'delivered';
  type: 'air' | 'sea' | 'land';
  weight: number;
  value: number;
  lastUpdate: string;
  createdAt: string;
  agencyId: string;
}

export interface User {
  uid: string;
  email: string | null;
  role: 'super_admin' | 'agency_admin' | 'staff';
  agencyId?: string;
  displayName?: string;
}

export interface Agency {
  id: string;
  name: string;
  location: string;
  contact: string;
  status: 'active' | 'inactive';
}
