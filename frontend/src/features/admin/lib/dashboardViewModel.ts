export interface DashboardSummaryPayload {
  period?: string;
  revenue?:
    | number
    | {
        current?: number | null;
        previous?: number | null;
        growth_percent?: number | null;
      };
  revenue_change?: number | null;
  orders?:
    | number
    | {
        current?: number | null;
        previous?: number | null;
        growth_percent?: number | null;
        by_status?: Record<string, number> | null;
      };
  orders_change?: number | null;
  orders_by_status?: Record<string, number> | null;
  customers?:
    | number
    | {
        total?: number | null;
        new_this_period?: number | null;
      };
  customers_change?: number | null;
  products?: {
    active?: number | null;
    low_stock?: number | null;
    out_of_stock?: number | null;
  } | null;
  low_stock_count?: number | null;
  recent_orders?: DashboardRecentOrderPayload[] | null;
  top_products?: DashboardTopProductPayload[] | null;
  pending_returns?: number | null;
  pending_reviews?: number | null;
}

export interface DashboardRecentOrderPayload {
  id?: number | null;
  order_number?: string | null;
  status?: string | null;
  grand_total?: number | null;
  total?: number | null;
  created_at?: string | null;
  user?: {
    id?: number | null;
    name?: string | null;
  } | null;
}

export interface DashboardTopProductPayload {
  product_name?: string | null;
  name?: string | null;
  total_sold?: number | null;
  revenue?: number | null;
  total_revenue?: number | null;
}

export interface DashboardKpi {
  value: number;
  change: number | null;
}

export interface DashboardViewModel {
  period: string;
  kpis: {
    revenue: DashboardKpi;
    orders: DashboardKpi;
    customers: DashboardKpi;
    lowStock: DashboardKpi;
  };
  orderStatus: Record<string, number>;
  recentOrders: Array<{
    id: number;
    orderNumber: string;
    status: string;
    total: number;
    createdAt: string;
    customerName: string;
  }>;
  topProducts: Array<{
    id: string;
    name: string;
    totalSold: number;
    revenue: number;
  }>;
  inventory: {
    active: number;
    lowStock: number;
    outOfStock: number;
  };
  actionRequired: {
    pendingReturns: number;
    pendingReviews: number;
    lowStock: number;
    outOfStock: number;
  };
}

export function toDashboardViewModel(payload: DashboardSummaryPayload = {}): DashboardViewModel {
  const revenueSection = typeof payload.revenue === 'number'
    ? { current: payload.revenue, growth_percent: payload.revenue_change ?? null }
    : (payload.revenue ?? {});
  const ordersSection = typeof payload.orders === 'number'
    ? { current: payload.orders, growth_percent: payload.orders_change ?? null, by_status: payload.orders_by_status ?? {} }
    : (payload.orders ?? {});
  const customersSection = typeof payload.customers === 'number'
    ? { total: payload.customers }
    : (payload.customers ?? {});
  const productsSection = payload.products ?? {};
  const lowStockCount = toNumber(productsSection.low_stock ?? payload.low_stock_count);

  return {
    period: payload.period ?? 'month',
    kpis: {
      revenue: {
        value: toNumber(revenueSection.current),
        change: toNullableNumber(revenueSection.growth_percent),
      },
      orders: {
        value: toNumber(ordersSection.current),
        change: toNullableNumber(ordersSection.growth_percent),
      },
      customers: {
        value: toNumber(customersSection.total),
        change: toNullableNumber(payload.customers_change),
      },
      lowStock: {
        value: lowStockCount,
        change: null,
      },
    },
    orderStatus: normalizeCounts(ordersSection.by_status ?? payload.orders_by_status ?? {}),
    recentOrders: (payload.recent_orders ?? []).map((order, index) => ({
      id: toNumber(order.id, index + 1),
      orderNumber: order.order_number ?? '-',
      status: order.status ?? 'pending',
      total: toNumber(order.grand_total ?? order.total),
      createdAt: order.created_at ?? '',
      customerName: order.user?.name ?? 'Guest',
    })),
    topProducts: (payload.top_products ?? []).map((product, index) => {
      const name = product.product_name ?? product.name ?? `Product ${index + 1}`;
      return {
        id: name,
        name,
        totalSold: toNumber(product.total_sold),
        revenue: toNumber(product.total_revenue ?? product.revenue),
      };
    }),
    inventory: {
      active: toNumber(productsSection.active),
      lowStock: lowStockCount,
      outOfStock: toNumber(productsSection.out_of_stock),
    },
    actionRequired: {
      pendingReturns: toNumber(payload.pending_returns),
      pendingReviews: toNumber(payload.pending_reviews),
      lowStock: lowStockCount,
      outOfStock: toNumber(productsSection.out_of_stock),
    },
  };
}

function normalizeCounts(values: Record<string, number> = {}): Record<string, number> {
  return Object.fromEntries(
    Object.entries(values).map(([key, value]) => [key, toNumber(value)]),
  );
}

function toNumber(value: number | string | null | undefined, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') { const n = parseFloat(value); if (Number.isFinite(n)) return n; }
  return fallback;
}

function toNullableNumber(value: number | string | null | undefined): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') { const n = parseFloat(value); if (Number.isFinite(n)) return n; }
  return null;
}
