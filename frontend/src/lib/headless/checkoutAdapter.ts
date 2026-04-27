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

function checkoutState() {
  return store.getState().checkout;
}

function cartToken() {
  return store.getState().cart.cartToken;
}

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
      city_name: payload.city,
      state_name: payload.state,
      country_name: payload.country_code,
      city: payload.city,
      state: payload.state,
      postal_code: payload.postal_code,
      country_code: payload.country_code,
      set_default: payload.is_default ? 1 : 0,
    });
    return { data: res.data?.data ?? res.data };
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
    if (payload.city) {
      body.city = payload.city;
      body.city_name = payload.city;
    }
    if (payload.state) {
      body.state = payload.state;
      body.state_name = payload.state;
    }
    if (payload.postal_code) body.postal_code = payload.postal_code;
    if (payload.country_code) {
      body.country_code = payload.country_code;
      body.country_name = payload.country_code;
    }
    if (payload.is_default !== undefined) body.set_default = payload.is_default ? 1 : 0;
    const res = await headlessApi.post('/user/shipping/update', body);
    return { data: res.data?.data ?? res.data };
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
          code: m.payment_type_key || m.payment_type || m.code || m.name?.toLowerCase(),
          name: m.name || m.payment_type_key || m.title || '',
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

  async guestValidateCheckout(payload: any) {
    const errors: string[] = [];
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!payload.guest_email || !emailRegex.test(payload.guest_email)) {
      errors.push('A valid email address is required');
    }
    if (!payload.guest_phone || payload.guest_phone.replace(/\D/g, '').length < 10) {
      errors.push('A valid phone number is required');
    }
    if (!cartToken()) {
      errors.push('Cart is empty');
    }

    if (errors.length > 0) {
      return { data: { valid: false, issues: errors, errors } };
    }

    const res = await headlessApi.post('/guest/checkout/validate', {
      temp_user_id: cartToken(),
      guest_email: payload.guest_email,
      guest_phone: payload.guest_phone,
      recipient_name: payload.recipient_name,
      line1: payload.line1,
      line2: payload.line2,
      city: payload.city,
      state: payload.state,
      postal_code: payload.postal_code,
      country_code: payload.country_code || 'IN',
      phone: payload.phone || payload.guest_phone,
    });

    return {
      data: {
        valid: true,
        guest_checkout_token: res.data?.data?.guest_checkout_token,
        expires_at: res.data?.data?.expires_at,
        _raw: res.data,
      },
    };
  },

  async guestCheckoutSummary(payload: { shipping_method_id?: number; state?: string }) {
    const guest_checkout_token = checkoutState().guestCheckoutToken;
    if (!guest_checkout_token) {
      return { data: { subtotal: 0, discount_amount: 0, shipping_cost: 0, tax_amount: 0, grand_total: 0 } };
    }

    const summaryRes = await headlessApi.post('/guest/checkout/summary', { guest_checkout_token });
    const summary = summaryRes.data?.data ?? summaryRes.data;
    return {
      data: {
        subtotal: Number(summary.subtotal ?? 0),
        discount_amount: Number(summary.discount_amount ?? 0),
        shipping_cost: Number(summary.shipping_cost ?? 0),
        tax_amount: Number(summary.tax_amount ?? 0),
        grand_total: Number(summary.grand_total ?? 0),
        tax: Number(summary.tax_amount ?? 0),
        shippingCost: Number(summary.shipping_cost ?? 0),
        discount: Number(summary.discount_amount ?? 0),
        grandTotal: Number(summary.grand_total ?? 0),
        _raw: summary,
      },
    };
  },

  async guestCreatePaymentIntent(payload: any) {
    const guest_checkout_token = checkoutState().guestCheckoutToken;
    const res = await headlessApi.post('/guest/payments/intent', {
      guest_checkout_token,
      gateway: payload.gateway,
    });

    return { data: res.data?.data ?? res.data };
  },

  async guestConfirmPayment(payload: any) {
    const res = await headlessApi.post('/guest/payments/confirm', {
      guest_checkout_token: checkoutState().guestCheckoutToken,
      order_id: payload.order_id,
      gateway_payment_id: payload.gateway_payment_id,
      gateway_order_id: payload.gateway_order_id,
      signature: payload.signature,
    });

    return { data: res.data?.data ?? res.data };
  },
};
