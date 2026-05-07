/**
 * Account Adapter
 * Maps V2 account endpoints → old frontend account contract
 *
 * Old endpoints:           New V2 endpoints:
 * GET /orders            → GET /purchase-history
 * GET /orders/:number    → GET /purchase-history-details/:id
 * GET /orders/:id/tracking → (not directly available)
 * POST /orders/:id/cancel → GET /order/cancel/:id
 * GET /wishlist          → GET /wishlists
 * POST /wishlist         → GET /wishlists-add-product/:slug
 * DELETE /wishlist/:id   → GET /wishlists-remove-product/:slug
 */
import { headlessApi, parsePrice } from './client';

export const accountAdapter: any = {
  // ── Orders ──

  async getOrders(params?: Record<string, unknown>) {
    const res = await headlessApi.get('/purchase-history', { params });
    const orders = res.data.data || [];

    return {
      data: orders.map((order: any) => ({
        id: order.id,
        order_number: order.code || order.order_code || `ORD-${order.id}`,
        orderNumber: order.code || order.order_code || `ORD-${order.id}`,
        status: order.delivery_status || order.status,
        payment_status: order.payment_status,
        paymentStatus: order.payment_status,
        grand_total: parsePrice(order.grand_total),
        grandTotal: parsePrice(order.grand_total),
        item_count: order.num_of_items || order.order_details?.length || 0,
        itemCount: order.num_of_items || order.order_details?.length || 0,
        created_at: order.date || order.created_at,
        createdAt: order.date || order.created_at,
        _raw: order,
      })),
      meta: res.data.meta || null,
    };
  },

  async getOrder(orderIdOrNumber: string) {
    // Pass as-is: backend supports lookup by both numeric id and order code (e.g. 20260502-18305125)
    const id = orderIdOrNumber;
    const res = await headlessApi.get(`/purchase-history-details/${id}`);

    // PurchaseHistoryCollection returns an array in 'data'
    const rawData = res.data.data || res.data;
    const order = Array.isArray(rawData) ? rawData[0] : rawData;

    if (!order) return { data: null };

    // Return both camelCase and snake_case for backward compat with old pages
    const items = (order.order_details || []).map((item: any) => ({
      id: item.id,
      product_id: item.product_id || item.product?.id,
      product_name: item.product_name || item.product?.name,
      quantity: item.quantity,
      unit_price: parsePrice(item.price),
      total_price: parsePrice(item.price) * item.quantity,
      unitPrice: parsePrice(item.price),
      lineTotal: parsePrice(item.price) * item.quantity,
      variation: item.variation,
      variant_name: item.variation,
      sku: item.sku || '',
      thumbnailUrl: item.product_thumbnail || item.product?.thumbnail_image,
      product_thumbnail: item.product_thumbnail || item.product?.thumbnail_image,
    }));

    const status = order.delivery_status || order.status || 'placed';

    return {
      data: {
        id: order.id,
        order_number: order.code || order.order_code || `ORD-${order.id}`,
        orderNumber: order.code || order.order_code || `ORD-${order.id}`,
        status: status,
        payment_status: order.payment_status,
        paymentStatus: order.payment_status,
        payment_type: order.payment_type,
        paymentType: order.payment_type,
        grand_total: parsePrice(order.grand_total),
        grandTotal: parsePrice(order.grand_total),
        subtotal: parsePrice(order.subtotal),
        tax: parsePrice(order.tax),
        tax_amount: parsePrice(order.tax),
        shipping_cost: parsePrice(order.shipping_cost),
        shippingCost: parsePrice(order.shipping_cost),
        discount: parsePrice(order.coupon_discount),
        discount_amount: parsePrice(order.coupon_discount),
        items,
        shipping_address: order.shipping_address,
        shippingAddress: order.shipping_address,
        created_at: order.date || order.created_at,
        createdAt: order.date || order.created_at,
        payment: order.payment || null,
        invoice: order.invoice || null,
        _raw: order,
      },
      meta: {
        can_cancel: ['pending_payment', 'paid', 'placed', 'confirmed', 'processing', 'packed'].includes(status),
        can_return: ['delivered', 'completed'].includes(status),
      },
    };
  },

  async getOrderTracking(orderId: number) {
    const res = await headlessApi.get(`/purchase-history-details/${orderId}`);
    const order = res.data.data || res.data;
    // Build tracking timeline from order status history
    const events = [];
    const statusFlow = ['pending', 'confirmed', 'processing', 'packed', 'shipped', 'out_for_delivery', 'delivered'];
    const currentStatus = (order.delivery_status || order.status || '').toLowerCase();
    const currentIdx = statusFlow.indexOf(currentStatus);

    // Add order placed event
    events.push({
      id: 1,
      description: 'Order placed',
      location: '',
      occurred_at: order.date || order.created_at || new Date().toISOString(),
      created_at: order.date || order.created_at || new Date().toISOString(),
    });

    // Add intermediate status events up to current status
    for (let i = 1; i <= Math.max(currentIdx, 0); i++) {
      events.push({
        id: i + 1,
        description: `Order ${statusFlow[i].replace(/_/g, ' ')}`,
        location: '',
        occurred_at: order.date || order.created_at || new Date().toISOString(),
        created_at: order.date || order.created_at || new Date().toISOString(),
      });
    }

    // If status is not in standard flow, add it as latest event
    if (currentIdx === -1 && currentStatus) {
      events.push({
        id: events.length + 1,
        description: `Order ${currentStatus.replace(/_/g, ' ')}`,
        location: '',
        occurred_at: order.updated_at || order.date || new Date().toISOString(),
        created_at: order.updated_at || order.date || new Date().toISOString(),
      });
    }

    return { data: events };
  },

  async cancelOrder({ orderId, reason }: { orderId: number; reason: string }) {
    const res = await headlessApi.get(`/order/cancel/${orderId}`);
    return { data: res.data };
  },

  async returnRequest(payload: { orderId: number; reason: string; description?: string }) {
    const res = await headlessApi.post('/refund-request/send', {
      order_id: payload.orderId,
      reason: payload.reason,
      description: payload.description || payload.reason,
    });
    return { data: res.data };
  },

  async guestOrderTracking(payload: { order_number: string; email?: string; phone?: string }) {
    // Try to look up order by code via track-order endpoint
    try {
      const res = await headlessApi.get('/track-your-order', {
        params: { order_code: payload.order_number },
      });
      const order = res.data.data || res.data;
      if (order && (order.delivery_status || order.status)) {
        return {
          data: {
            items: [{
              id: 1,
              description: `Order ${order.delivery_status || order.status}`,
              location: '',
              occurred_at: order.date || order.created_at || new Date().toISOString(),
              created_at: order.date || order.created_at || new Date().toISOString(),
            }],
            order: {
              order_number: order.code || payload.order_number,
              status: order.delivery_status || order.status,
              payment_status: order.payment_status,
            },
          },
        };
      }
    } catch {
      // Endpoint may not exist — fall through
    }
    return { data: { items: [], order: null } };
  },

  async guestClaimAccount(payload: { guest_checkout_token: string; password: string; password_confirmation: string }) {
    const res = await headlessApi.post('/guest/account/claim', payload);
    return { data: res.data };
  },

  // ── Re-order ──

  async reOrder(orderId: number) {
    const res = await headlessApi.get(`/re-order/${orderId}`);
    return { data: res.data };
  },

  // ── Invoice ──

  async downloadInvoice(orderId: number, guestToken?: string) {
    const res = await headlessApi.get(`/invoice/download/${orderId}`, {
      params: { guest_token: guestToken },
      responseType: 'blob',
    });
    return res;
  },

  // ── Wishlist ──

  async getWishlist() {
    const res = await headlessApi.get('/wishlists');
    const items = res.data.data || [];

    return {
      data: {
        items: items.map((item: any) => ({
          id: item.id,
          product_id: item.product?.id || item.id,
          product: item.product || item,
          variant_id: null,
          _raw: item,
        })),
      },
    };
  },

  async addToWishlist(payload: { product_id: number; variant_id?: number | null; slug?: string }) {
    // V2 uses GET with slug — we need the product slug
    // If slug provided use it; otherwise try to find it
    const slug = payload.slug || String(payload.product_id);
    const res = await headlessApi.get(`/wishlists-add-product/${slug}`);
    return { data: res.data };
  },

  async removeFromWishlist(id: number, slug?: string) {
    // V2 uses GET with slug for removal
    const identifier = slug || String(id);
    const res = await headlessApi.get(`/wishlists-remove-product/${identifier}`);
    return { data: res.data };
  },
};
