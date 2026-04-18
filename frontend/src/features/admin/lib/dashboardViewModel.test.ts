import { describe, expect, it } from 'vitest';
import { toDashboardViewModel } from '@/features/admin/lib/dashboardViewModel';

describe('toDashboardViewModel', () => {
  it('maps dashboard summary from nested backend payload', () => {
    const vm = toDashboardViewModel({
      period: 'month',
      revenue: { current: 1200, previous: 1000, growth_percent: 4.2 },
      orders: { current: 12, previous: 10, growth_percent: 20, by_status: { processing: 3, shipped: 2 } },
      customers: { total: 8, new_this_period: 2 },
      products: { active: 24, low_stock: 2, out_of_stock: 1 },
      recent_orders: [
        {
          id: 1,
          order_number: 'ORD-1',
          status: 'processing',
          grand_total: 649.6,
          created_at: '2026-03-07T10:00:00Z',
          user: { id: 5, name: 'Lakshmi' },
        },
      ],
      top_products: [
        {
          product_name: 'Poondu Thokku',
          total_sold: 18,
          total_revenue: 4500,
        },
      ],
      pending_returns: 1,
      pending_reviews: 0,
    });

    expect(vm.kpis.orders.value).toBe(12);
    expect(vm.kpis.orders.change).toBe(20);
    expect(vm.orderStatus.processing).toBe(3);
    expect(vm.kpis.lowStock.value).toBe(2);
    expect(vm.inventory.outOfStock).toBe(1);
    expect(vm.recentOrders[0]).toMatchObject({
      id: 1,
      orderNumber: 'ORD-1',
      customerName: 'Lakshmi',
    });
    expect(vm.topProducts[0]).toMatchObject({
      id: 'Poondu Thokku',
      name: 'Poondu Thokku',
      revenue: 4500,
    });
    expect(vm.actionRequired.pendingReturns).toBe(1);
  });

  it('falls back to safe defaults when payload sections are missing', () => {
    const vm = toDashboardViewModel({});

    expect(vm.kpis.revenue.value).toBe(0);
    expect(vm.kpis.customers.value).toBe(0);
    expect(vm.orderStatus).toEqual({});
    expect(vm.recentOrders).toEqual([]);
    expect(vm.topProducts).toEqual([]);
    expect(vm.actionRequired.pendingReviews).toBe(0);
  });
});
