/**
 * Checkout Adapter
 * Maps new V2 checkout/payment endpoints → old frontend checkout contract
 *
 * Old endpoints:                         New V2 endpoints:
 * GET  /addresses                      → GET /user/shipping/address
 * POST /addresses                      → POST /user/shipping/create
 * POST /checkout/summary               → POST /cart-summary + POST /delivery-info
 * POST /checkout/validate              → (validate via delivery-info + shipping_cost)
 * POST /payments/intent                → POST /order/store + gateway-specific pay
 * POST /payments/confirm               → (gateway callback handling)
 * GET  /payments/:orderId              → GET /purchase-history-details/:id
 * GET  /payment-methods                → GET /payment-types
 */
import { headlessApi, parsePrice } from './client';
import { store } from '@/app/store';

export const checkoutAdapter: any = {
  // ── Addresses ──

  async getAddresses() {
    const res = await headlessApi.get('/user/shipping/address');
    const addresses = res.data.data || [];
    const userName = store.getState().auth.user?.name || '';
    return {
      data: {
        data: addresses.map((addr: any) => ({
          id: addr.id,
          label: addr.address || '',
          recipient_name: addr.name || userName,
          phone: addr.phone || '',
          line_1: addr.address || '',
          line_2: '',
          city: addr.city_name || '',
          state: addr.state_name || '',
          postal_code: addr.postal_code || addr.zip || '',
          country_code: addr.country_code || 'IN',
          is_default: addr.set_default === 1 || addr.is_default,
          _raw: addr,
        })),
      },
    };
  },

  async createAddress(payload: {
    label?: string;
    recipient_name: string;
    phone: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postal_code: string;
    country_code: string;
    is_default?: boolean;
  }) {
    const res = await headlessApi.post('/user/shipping/create', {
      name: payload.recipient_name,
      phone: payload.phone,
      address: payload.line1 + (payload.line2 ? ', ' + payload.line2 : ''),
      city: payload.city,
      state: payload.state,
      postal_code: payload.postal_code,
      country: payload.country_code,
      set_default: payload.is_default ? 1 : 0,
    });
    return { data: res.data };
  },

  async updateAddress(addressId: number, payload: {
    recipient_name?: string;
    phone?: string;
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country_code?: string;
    is_default?: boolean;
  }) {
    const body: any = { id: addressId };
    if (payload.recipient_name) body.name = payload.recipient_name;
    if (payload.phone) body.phone = payload.phone;
    if (payload.line1) body.address = payload.line1 + (payload.line2 ? ', ' + payload.line2 : '');
    if (payload.city) body.city = payload.city;
    if (payload.state) body.state = payload.state;
    if (payload.postal_code) body.postal_code = payload.postal_code;
    if (payload.country_code) body.country = payload.country_code;
    if (payload.is_default !== undefined) body.set_default = payload.is_default ? 1 : 0;
    const res = await headlessApi.post('/user/shipping/update', body);
    return { data: res.data };
  },

  async deleteAddress(addressId: number) {
    const res = await headlessApi.get(`/user/shipping/delete/${addressId}`);
    return { data: res.data };
  },

  async setDefaultAddress(addressId: number) {
    const res = await headlessApi.post('/user/shipping/make_default', { id: addressId });
    return { data: res.data };
  },

  // ── Checkout Flow ──

  async checkoutSummary(payload: { address_id: number; shipping_method_id: number }) {
    const summaryRes = await headlessApi.post('/checkout/summary', payload);
    const summary = summaryRes.data?.data ?? summaryRes.data;
    return {
      data: {
        subtotal: Number(summary.subtotal ?? 0),
        discount_amount: Number(summary.discount_amount ?? 0),
        shipping_cost: Number(summary.shipping_cost ?? 0),
        tax_amount: Number(summary.tax_amount ?? 0),
        grand_total: Number(summary.grand_total ?? 0),
        _raw: summary,
      },
    };
  },

  async validateCheckout(payload: { address_id: number; shipping_method_id: number }) {
    // V2 doesn't have explicit validate; use delivery-info for validation
    try {
      const cartRes = await headlessApi.post('/carts');
      const groups = cartRes.data.data || [];

      if (groups.length === 0) {
        return { data: { valid: false, errors: ['Cart is empty'] } };
      }

      // Fetch delivery info for each seller group
      await Promise.all(
        groups.map((group: any) =>
          headlessApi.post('/delivery-info', { owner_id: group.owner_id })
        )
      );

      return { data: { valid: true, errors: [] } };
    } catch (error: any) {
      return {
        data: {
          valid: false,
          errors: [error.response?.data?.message || 'Checkout validation failed'],
        },
      };
    }
  },

  // ── Payment ──

  async getPaymentMethods() {
    const res = await headlessApi.get('/payment-types');
    const methods = res.data.data || res.data || [];
    // Normalize to old frontend PaymentMethod shape
    const normalized = Array.isArray(methods)
      ? methods.map((m: any) => ({
          code: m.payment_type || m.code || m.name?.toLowerCase(),
          name: m.payment_type_key || m.name || m.title || '',
          description: m.name || '',
          is_enabled: true,
          is_default: false,
          type: 'online' as const,
          _raw: m,
        }))
      : [];
    return { data: { data: normalized } };
  },

  async createPaymentIntent(payload: {
    gateway: string;
    shipping_address_id: number;
    shipping_method_id: number;
    billing_same_as_shipping: boolean;
    billing_address_id?: number;
    notes?: string;
  }) {
    const res = await headlessApi.post('/payments/intent', payload);
    return { data: res.data?.data ?? res.data };
  },

  async confirmPayment(payload: {
    order_id: number;
    gateway_payment_id: string;
    gateway_order_id: string;
    signature: string;
  }) {
    const res = await headlessApi.post('/payments/confirm', payload);
    return { data: res.data?.data ?? res.data };
  },

  async getOrderPayment(orderId: number) {
    const res = await headlessApi.get(`/purchase-history-details/${orderId}`);
    return { data: res.data };
  },

  // ── Guest Checkout ──

  async guestValidateCheckout(payload: { guest_email: string; guest_phone: string }) {
    // Basic client-side validation for guest checkout
    const errors: string[] = [];
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!payload.guest_email || !emailRegex.test(payload.guest_email)) {
      errors.push('A valid email address is required');
    }
    if (!payload.guest_phone || payload.guest_phone.replace(/\D/g, '').length < 10) {
      errors.push('A valid phone number is required');
    }
    // Verify cart is not empty
    try {
      const cartRes = await headlessApi.post('/carts');
      const groups = cartRes.data.data || [];
      if (groups.length === 0 || groups.every((g: any) => (g.cart_items || []).length === 0)) {
        errors.push('Cart is empty');
      }
    } catch {
      errors.push('Unable to verify cart');
    }
    return { data: { valid: errors.length === 0, errors } };
  },

  async guestCheckoutSummary(payload: { shipping_method_id?: number; state?: string }) {
    const summaryRes = await headlessApi.post('/cart-summary');
    return {
      data: {
        subtotal: parsePrice(summaryRes.data.sub_total),
        tax: parsePrice(summaryRes.data.tax),
        shippingCost: parsePrice(summaryRes.data.shipping_cost),
        discount: parsePrice(summaryRes.data.discount),
        grandTotal: parsePrice(summaryRes.data.grand_total),
        _raw: summaryRes.data,
      },
    };
  },

  async guestCreatePaymentIntent(payload: any) {
    // Create order as guest
    const orderRes = await headlessApi.post('/order/store', {
      payment_type: payload.gateway,
      name: payload.shipping_address?.recipient_name,
      email: payload.guest_email,
      phone: payload.guest_phone || payload.shipping_address?.phone,
      address: payload.shipping_address
        ? `${payload.shipping_address.line1}, ${payload.shipping_address.city}, ${payload.shipping_address.state} ${payload.shipping_address.postal_code || ''}`
        : '',
      postal_code: payload.shipping_address?.postal_code || '',
      city: payload.shipping_address?.city || '',
      state: payload.shipping_address?.state || '',
      country: payload.shipping_address?.country_code || 'IN',
      shipping_method_id: payload.shipping_method_id || undefined,
    });

    const orderData = orderRes.data;
    const orderId = orderData.order_id || orderData.data?.order_id || orderData.combined_order_id;

    // COD: done immediately
    if (payload.gateway === 'cash_on_delivery' || payload.gateway === 'cod') {
      return {
        data: {
          order_id: orderId,
          order_number: orderData.order_number || `ORD-${orderId}`,
          status: 'confirmed',
          payment_status: 'cod',
          _raw: orderData,
        },
      };
    }

    // Wallet
    if (payload.gateway === 'wallet') {
      const walletRes = await headlessApi.post('/payments/pay/wallet', {
        combined_order_id: orderId,
      });
      return {
        data: {
          order_id: orderId,
          order_number: orderData.order_number || `ORD-${orderId}`,
          status: 'confirmed',
          payment_status: 'paid',
          _raw: walletRes.data,
        },
      };
    }

    // Online gateways
    return {
      data: {
        order_id: orderId,
        combined_order_id: orderId,
        order_number: orderData.order_number || `ORD-${orderId}`,
        gateway: payload.gateway,
        status: 'pending_payment',
        _raw: orderData,
      },
    };
  },
};
