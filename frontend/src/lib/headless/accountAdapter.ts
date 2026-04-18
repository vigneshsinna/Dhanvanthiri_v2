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
    const res = await headlessApi.get('/purchase-history');
    const orders = res.data.data || [];

    return {
      data: {
        items: orders.map((order: any) => ({
          id: order.id,
          orderNumber: order.code || order.order_code || `ORD-${order.id}`,
          status: order.delivery_status || order.status,
          paymentStatus: order.payment_status,
          grandTotal: parsePrice(order.grand_total),
          itemCount: order.num_of_items || order.order_details?.length || 0,
          createdAt: order.date || order.created_at,
          _raw: order,
        })),
      },
    };
  },

  async getOrder(orderIdOrNumber: string) {
    // V2 uses numeric ID
    const id = parseInt(orderIdOrNumber, 10) || orderIdOrNumber;
    const res = await headlessApi.get(`/purchase-history-details/${id}`);
    const order = res.data.data || res.data;

    // Return both camelCase and snake_case for backward compat with old pages
    const items = (order.order_details || []).map((item: any) => ({
      id: item.id,
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

    return {
      data: {
        id: order.id,
        order_number: order.code || order.order_code || `ORD-${order.id}`,
        orderNumber: order.code || order.order_code || `ORD-${order.id}`,
        status: order.delivery_status || order.status,
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
        can_cancel: ['pending_payment', 'paid', 'placed', 'confirmed', 'processing', 'packed'].includes(
          order.delivery_status || order.status
        ),
        can_return: ['delivered', 'completed'].includes(order.delivery_status || order.status),
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

  async guestOrderTracking(payload: {
    order_number: string;
    email?: string;
    phone?: string;
    guest_checkout_token?: string;
    order_access_token?: string;
  }) {
    const res = await headlessApi.post('/orders/track', {
      order_number: payload.order_number,
      ...(payload.email ? { email: payload.email } : {}),
      ...(payload.phone ? { phone: payload.phone } : {}),
      ...(payload.guest_checkout_token ? { guest_checkout_token: payload.guest_checkout_token } : {}),
      ...(payload.order_access_token ? { order_access_token: payload.order_access_token } : {}),
    });
    const data = res.data?.data ?? res.data;
    return {
      data: {
        order: {
          order_number: data.order_number || payload.order_number,
          status: data.status || data.delivery_status || 'unknown',
          payment_status: data.payment_status,
          grand_total: data.grand_total || 0,
          created_at: data.created_at || new Date().toISOString(),
        },
        items: data.items || [],
        shipping_address: data.shipping_address || null,
        shipments: data.shipments || [],
        status_history: data.status_history || [],
        order_access_token: data.order_access_token,
        order_access_expires_at: data.order_access_expires_at,
      },
    };
  },

  async guestGetOrder(orderNumber: string, opts?: {
    guest_checkout_token?: string;
    order_access_token?: string;
  }) {
    const params: Record<string, string> = {};
    if (opts?.guest_checkout_token) params.guest_checkout_token = opts.guest_checkout_token;
    if (opts?.order_access_token) params.order_access_token = opts.order_access_token;

    const res = await headlessApi.get(`/orders/${encodeURIComponent(orderNumber)}`, { params });
    const order = res.data?.data ?? res.data;

    return { data: order };
  },

  async guestClaimAccount(payload: {
    guest_checkout_token: string;
    password: string;
    password_confirmation: string;
  }) {
    const res = await headlessApi.post('/guest/account/claim', payload);
    return { data: res.data?.data ?? res.data };
  },

  // ── Re-order ──

  async reOrder(orderId: number) {
    const res = await headlessApi.get(`/re-order/${orderId}`);
    return { data: res.data };
  },

  // ── Invoice ──

  async downloadInvoice(orderId: number) {
    const res = await headlessApi.get(`/invoice/download/${orderId}`, {
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

  async addToWishlist(payload: { product_id: number; variant_id?: number | null; slug: string }) {
    if (!payload.slug) {
      throw new Error('Wishlist operations require a product slug.');
    }
    const slug = payload.slug;
    const res = await headlessApi.get(`/wishlists-add-product/${encodeURIComponent(slug)}`);
    return { data: res.data };
  },

  async removeFromWishlist(id: number, slug: string) {
    if (!slug) {
      throw new Error('Wishlist removal requires the product slug.');
    }
    const res = await headlessApi.delete(`/wishlists-remove-product/${encodeURIComponent(slug)}`);
    return { data: res.data };
  },
};
