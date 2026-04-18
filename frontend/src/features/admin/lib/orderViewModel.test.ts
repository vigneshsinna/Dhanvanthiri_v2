import { describe, expect, it } from 'vitest';
import { toAdminOrderCollection, toAdminOrderRow } from '@/features/admin/lib/orderViewModel';

describe('toAdminOrderRow', () => {
  it('maps admin order list rows from user-based backend payload', () => {
    const row = toAdminOrderRow({
      id: 1,
      order_number: 'ORD-1',
      status: 'confirmed',
      grand_total: 649.6,
      items: [
        { id: 11, product_name: 'Poondu Thokku', quantity: 2 },
        { id: 12, product_name: 'Lemon Pickle', quantity: 1 },
      ],
      payments: [{ id: 21, gateway: 'razorpay', status: 'captured' }],
      shipments: [{ id: 31, status: 'in_transit' }],
      user: { name: 'Lakshmi', email: 'lakshmi@example.com' },
      created_at: '2026-03-07T10:00:00Z',
    });

    expect(row.customerName).toBe('Lakshmi');
    expect(row.customerEmail).toBe('lakshmi@example.com');
    expect(row.total).toBe(649.6);
    expect(row.productsSummary).toBe('Poondu Thokku +1 more');
    expect(row.deliveryStatus).toBe('in_transit');
    expect(row.paymentMethod).toBe('razorpay');
    expect(row.paymentStatus).toBe('captured');
  });

  it('normalizes order collections and pagination metadata', () => {
    const collection = toAdminOrderCollection({
      data: [
        {
          id: 1,
          order_number: 'ORD-1',
          status: 'processing',
          grand_total: 649.6,
          created_at: '2026-03-07T10:00:00Z',
          items: [],
          payments: [],
          shipments: [],
          user: null,
        },
      ],
      meta: {
        current_page: 2,
        last_page: 5,
        total: 68,
      },
    });

    expect(collection.rows[0].customerName).toBe('-');
    expect(collection.rows[0].productsSummary).toBe('-');
    expect(collection.rows[0].deliveryStatus).toBe('processing');
    expect(collection.rows[0].paymentMethod).toBe('-');
    expect(collection.rows[0].paymentStatus).toBe('pending');
    expect(collection.meta).toEqual({
      currentPage: 2,
      lastPage: 5,
      total: 68,
    });
  });
});
