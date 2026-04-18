export interface AdminOrderPayload {
  id?: number | null;
  order_number?: string | null;
  status?: string | null;
  payment_method?: string | null;
  grand_total?: number | null;
  total?: number | null;
  created_at?: string | null;
  items?: AdminOrderItemPayload[] | null;
  payments?: AdminOrderPaymentPayload[] | null;
  shipments?: AdminOrderShipmentPayload[] | null;
  user?: {
    name?: string | null;
    email?: string | null;
  } | null;
  customer?: {
    name?: string | null;
    email?: string | null;
  } | null;
}

export interface AdminOrderItemPayload {
  id?: number | null;
  product_name?: string | null;
  quantity?: number | null;
}

export interface AdminOrderPaymentPayload {
  id?: number | null;
  gateway?: string | null;
  status?: string | null;
}

export interface AdminOrderShipmentPayload {
  id?: number | null;
  status?: string | null;
}

export interface AdminOrderCollectionPayload {
  data?: AdminOrderPayload[] | null;
  meta?: {
    current_page?: number | null;
    last_page?: number | null;
    total?: number | null;
  } | null;
}

export interface AdminOrderRow {
  id: number;
  orderNumber: string;
  status: string;
  total: number;
  productsSummary: string;
  customerName: string;
  customerEmail: string;
  deliveryStatus: string;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: string;
}

export interface AdminOrderCollection {
  rows: AdminOrderRow[];
  meta: {
    currentPage: number;
    lastPage: number;
    total: number;
  };
}

export function toAdminOrderRow(order: AdminOrderPayload): AdminOrderRow {
  const customer = order.user ?? order.customer ?? null;
  const items = Array.isArray(order.items) ? order.items : [];
  const payments = Array.isArray(order.payments) ? order.payments : [];
  const shipments = Array.isArray(order.shipments) ? order.shipments : [];
  const primaryPayment = payments[0] ?? null;
  const latestShipment = shipments[shipments.length - 1] ?? null;

  return {
    id: toNumber(order.id),
    orderNumber: order.order_number ?? '-',
    status: order.status ?? 'pending_payment',
    total: toNumber(order.grand_total ?? order.total),
    productsSummary: toProductsSummary(items),
    customerName: customer?.name ?? '-',
    customerEmail: customer?.email ?? '',
    deliveryStatus: latestShipment?.status ?? order.status ?? 'pending',
    paymentMethod: order.payment_method ?? primaryPayment?.gateway ?? '-',
    paymentStatus: primaryPayment?.status ?? 'pending',
    createdAt: order.created_at ?? '',
  };
}

export function toAdminOrderCollection(payload: AdminOrderCollectionPayload = {}): AdminOrderCollection {
  return {
    rows: (payload.data ?? []).map(toAdminOrderRow),
    meta: {
      currentPage: toNumber(payload.meta?.current_page, 1),
      lastPage: toNumber(payload.meta?.last_page, 1),
      total: toNumber(payload.meta?.total),
    },
  };
}

function toNumber(value: number | string | null | undefined, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') { const n = parseFloat(value); if (Number.isFinite(n)) return n; }
  return fallback;
}

function toProductsSummary(items: AdminOrderItemPayload[]): string {
  if (items.length === 0) {
    return '-';
  }

  const firstLabel = items[0]?.product_name?.trim() || 'Item';
  if (items.length === 1) {
    return firstLabel;
  }

  return `${firstLabel} +${items.length - 1} more`;
}
