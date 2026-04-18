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
import { headlessApi } from './client';
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
    country_id?: number;
    state_id?: number;
    city_id?: number;
    area_id?: number;
    is_default?: boolean;
  }) {
    const res = await headlessApi.post('/user/shipping/create', {
      name: payload.recipient_name,
      phone: payload.phone,
      address: payload.line1 + (payload.line2 ? ', ' + payload.line2 : ''),
      country_id: payload.country_id,
      state_id: payload.state_id,
      city_id: payload.city_id,
      area_id: payload.area_id,
      city: payload.city,
      state: payload.state,
      postal_code: payload.postal_code,
      country: payload.country_code,
      country_code: payload.country_code,
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
    country_id?: number;
    state_id?: number;
    city_id?: number;
    area_id?: number;
    is_default?: boolean;
  }) {
    const body: any = { id: addressId };
    if (payload.recipient_name) body.name = payload.recipient_name;
    if (payload.phone) body.phone = payload.phone;
    if (payload.line1) body.address = payload.line1 + (payload.line2 ? ', ' + payload.line2 : '');
    if (payload.country_id) body.country_id = payload.country_id;
    if (payload.state_id !== undefined) body.state_id = payload.state_id;
    if (payload.city_id) body.city_id = payload.city_id;
    if (payload.area_id !== undefined) body.area_id = payload.area_id;
    if (payload.city) body.city = payload.city;
    if (payload.state) body.state = payload.state;
    if (payload.postal_code) body.postal_code = payload.postal_code;
    if (payload.country_code) {
      body.country = payload.country_code;
      body.country_code = payload.country_code;
    }
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

  async guestValidateCheckout(payload: {
    temp_user_id: string;
    name: string;
    email: string;
    address: string;
    country_id?: number;
    state_id?: number;
    city_id?: number;
    postal_code: string;
    phone: string;
  }) {
    const res = await headlessApi.post('/guest/checkout/validate', {
      temp_user_id: payload.temp_user_id,
      name: payload.name,
      email: payload.email,
      address: payload.address,
      country_id: payload.country_id ?? 1,
      state_id: payload.state_id ?? null,
      city_id: payload.city_id ?? 1,
      postal_code: payload.postal_code,
      phone: payload.phone,
    });

    return { data: res.data?.data ?? res.data };
  },

  async guestCheckoutSummary(payload: { guest_checkout_token: string }) {
    const summaryRes = await headlessApi.post('/guest/checkout/summary', payload);
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

  async guestCreatePaymentIntent(payload: { guest_checkout_token: string; gateway: string }) {
    const res = await headlessApi.post('/guest/payments/intent', payload);
    return { data: res.data?.data ?? res.data };
  },

  async guestConfirmPayment(payload: {
    guest_checkout_token: string;
    order_id: number;
    gateway_payment_id: string;
    gateway_order_id: string;
    signature: string;
  }) {
    const res = await headlessApi.post('/guest/payments/confirm', payload);
    return { data: res.data?.data ?? res.data };
  },
};
