/** All possible order statuses from the OMS spec */
export const ORDER_STATUSES = [
  'pending_payment',
  'paid',
  'placed',
  'confirmed',
  'processing',
  'packed',
  'shipped',
  'out_for_delivery',
  'delivered',
  'completed',
  'cancel_requested',
  'cancelled',
  'return_requested',
  'return_approved',
  'return_rejected',
  'returned',
  'refund_pending',
  'refunded',
  'partially_refunded',
  'failed',
  'on_hold',
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PAYMENT_STATUSES = ['pending', 'authorized', 'paid', 'failed', 'cod_pending', 'refund_pending', 'refunded', 'partially_refunded'] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const SHIPMENT_STATUSES = ['draft', 'created', 'label_generated', 'dispatched', 'in_transit', 'out_for_delivery', 'delivered', 'delivery_failed', 'returned_to_origin'] as const;
export type ShipmentStatus = (typeof SHIPMENT_STATUSES)[number];

export const RETURN_STATUSES = ['requested', 'under_review', 'approved', 'rejected', 'pickup_scheduled', 'received', 'refund_pending', 'refund_completed', 'closed'] as const;
export type ReturnStatus = (typeof RETURN_STATUSES)[number];

/** Cancellable statuses (before shipment) */
export const CANCELLABLE_STATUSES: OrderStatus[] = ['pending_payment', 'paid', 'placed', 'confirmed', 'processing', 'packed'];

/** Returnable statuses (post-delivery) */
export const RETURNABLE_STATUSES: OrderStatus[] = ['delivered', 'completed'];

export interface OrderMeta {
  can_cancel: boolean;
  can_return: boolean;
  can_create_shipment: boolean;
  allowed_transitions: string[];
}

export interface ShipmentEvent {
  id: number;
  status: string;
  description: string;
  location: string;
  occurred_at: string;
}

export interface Shipment {
  id: number;
  order_id: number;
  carrier: string;
  tracking_number: string;
  tracking_url?: string;
  status: ShipmentStatus;
  shipped_at?: string;
  estimated_delivery_at?: string;
  delivered_at?: string;
  package_count?: number;
  weight?: string;
  dispatch_note?: string;
  events: ShipmentEvent[];
  created_at: string;
  order?: {
    id: number;
    order_number: string;
    status: string;
  };
}

export interface ReturnItem {
  id: number;
  order_item_id: number;
  product_name?: string;
  quantity: number;
  reason: string;
  condition: string;
}

export interface ReturnRequest {
  id: number;
  order_id: number;
  user_id: number;
  reason: string;
  description?: string;
  status: ReturnStatus;
  refund_type: string;
  admin_notes?: string;
  evidence_urls?: string[];
  pickup_scheduled_at?: string;
  received_at?: string;
  resolved_at?: string;
  created_at: string;
  items: ReturnItem[];
  order?: {
    id: number;
    order_number: string;
    status: string;
    grand_total: number;
  };
  user?: {
    id: number;
    name: string;
    email: string;
  };
}

export interface OmsSummary {
  queue: {
    pending_payment: number;
    placed: number;
    confirmed: number;
    processing: number;
    packed: number;
    shipped: number;
    out_for_delivery: number;
    cancel_requested: number;
    return_requested: number;
  };
  alerts: {
    overdue_processing: number;
    pending_returns: number;
    low_stock_orders: number;
    stale_shipments: number;
  };
  today: {
    new_orders: number;
    revenue: number;
    delivered: number;
    cancelled: number;
  };
}

/** Status display config */
export const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  pending_payment:  { label: 'Pending Payment', color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
  paid:             { label: 'Paid',            color: 'text-green-700',  bgColor: 'bg-green-100' },
  placed:           { label: 'Placed',          color: 'text-blue-700',   bgColor: 'bg-blue-100' },
  confirmed:        { label: 'Confirmed',       color: 'text-blue-700',   bgColor: 'bg-blue-100' },
  processing:       { label: 'Processing',      color: 'text-indigo-700', bgColor: 'bg-indigo-100' },
  packed:           { label: 'Packed',           color: 'text-purple-700', bgColor: 'bg-purple-100' },
  shipped:          { label: 'Shipped',          color: 'text-cyan-700',   bgColor: 'bg-cyan-100' },
  out_for_delivery: { label: 'Out for Delivery', color: 'text-teal-700',  bgColor: 'bg-teal-100' },
  delivered:        { label: 'Delivered',         color: 'text-green-700', bgColor: 'bg-green-100' },
  completed:        { label: 'Completed',         color: 'text-green-800', bgColor: 'bg-green-200' },
  cancel_requested: { label: 'Cancel Requested',  color: 'text-orange-700', bgColor: 'bg-orange-100' },
  cancelled:        { label: 'Cancelled',          color: 'text-red-700',   bgColor: 'bg-red-100' },
  return_requested: { label: 'Return Requested',   color: 'text-amber-700', bgColor: 'bg-amber-100' },
  return_approved:  { label: 'Return Approved',    color: 'text-amber-800', bgColor: 'bg-amber-200' },
  return_rejected:  { label: 'Return Rejected',    color: 'text-red-600',   bgColor: 'bg-red-100' },
  returned:         { label: 'Returned',            color: 'text-gray-700',  bgColor: 'bg-gray-200' },
  refund_pending:   { label: 'Refund Pending',      color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
  refunded:         { label: 'Refunded',             color: 'text-green-600', bgColor: 'bg-green-100' },
  partially_refunded: { label: 'Partially Refunded', color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
  failed:           { label: 'Failed',               color: 'text-red-700',   bgColor: 'bg-red-200' },
  on_hold:          { label: 'On Hold',              color: 'text-gray-600',  bgColor: 'bg-gray-200' },
};

export function getStatusConfig(status: string) {
  return STATUS_CONFIG[status] ?? { label: status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()), color: 'text-gray-700', bgColor: 'bg-gray-100' };
}
