export type Role = 'customer' | 'rider' | 'staff' | 'admin';

export type OrderStatus = 
  | 'pending' 
  | 'pickup_scheduled' 
  | 'picked_up' 
  | 'washing' 
  | 'drying' 
  | 'folding' 
  | 'ready_for_delivery' 
  | 'delivered'
  | 'cancelled';

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: Role;
  points?: number;
  address?: string;
  phone?: string;
  rating?: number;
  status?: string;
  station?: string;
}

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  service: string;
  status: OrderStatus;
  cost: number;
  weight?: number;
  createdAt: string;
  specialInstructions?: string;
  paymentMethod: string;
  isPaid: boolean;
  qrCodeValue?: string;
  address?: string;
  phone?: string;
  riderId?: string;
  riderName?: string;
  rating?: number;
  review?: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  minLimit: number;
}

export interface AuditLog {
  timestamp: string;
  user: string;
  action: string;
}

export interface Feedback {
  id: string;
  customerName: string;
  rating: number;
  review: string;
  type: string;
}

export const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pending",
  pickup_scheduled: "Pickup Scheduled",
  picked_up: "Picked Up",
  washing: "Washing",
  drying: "Drying",
  folding: "Folding",
  ready_for_delivery: "Ready for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled"
};
