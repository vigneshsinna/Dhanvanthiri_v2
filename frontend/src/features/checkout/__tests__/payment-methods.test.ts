/**
 * Payment methods API and checkout flow tests
 * - Public payment methods endpoint
 * - Admin payment methods management (list, Razorpay health)
 * - Checkout gateway selection
 */
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { server } from '@/test/msw-server';
import { api } from '@/lib/api/client';
import { store } from '@/app/store';
import { setCredentials, clearCredentials } from '@/features/auth/store/authSlice';
import { setCheckoutData, resetCheckout } from '@/features/checkout/store/checkoutSlice';

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => { server.resetHandlers(); store.dispatch(clearCredentials()); store.dispatch(resetCheckout()); });
afterAll(() => server.close());

function login() {
  store.dispatch(setCredentials({ accessToken: 'test-jwt-token', user: { id: 1, name: 'Lakshmi', email: 'l@e.com', role: 'customer' } }));
}
function loginAdmin() {
  store.dispatch(setCredentials({ accessToken: 'admin-token', user: { id: 99, name: 'Admin', email: 'a@e.com', role: 'admin' } }));
}
function loginSuperAdmin() {
  store.dispatch(setCredentials({ accessToken: 'super-admin-token', user: { id: 100, name: 'Super', email: 's@e.com', role: 'super_admin' } }));
}

describe('Public payment methods', () => {
  it('GET /payment-methods returns enabled methods', async () => {
    const res = await api.get('/payment-methods');
    expect(res.status).toBe(200);
    const methods = res.data.data.data;
    expect(methods.length).toBeGreaterThanOrEqual(1);
    expect(methods.some((m: any) => m.code === 'razorpay')).toBe(true);
  });

  it('each method has required fields', async () => {
    const res = await api.get('/payment-methods');
    for (const method of res.data.data.data) {
      expect(method).toHaveProperty('code');
      expect(method).toHaveProperty('name');
      expect(method).toHaveProperty('description');
      expect(method).toHaveProperty('is_enabled');
      expect(method).toHaveProperty('type');
    }
  });

  it('does not return COD', async () => {
    const res = await api.get('/payment-methods');
    const methods = res.data.data.data;
    expect(methods.some((m: any) => m.code === 'cod')).toBe(false);
  });
});

describe('Checkout gateway selection', () => {
  it('supports razorpay gateway', () => {
    store.dispatch(setCheckoutData({ gateway: 'razorpay' }));
    const state = store.getState().checkout;
    expect(state.gateway).toBe('razorpay');
  });

  it('defaults to razorpay', () => {
    store.dispatch(resetCheckout());
    const state = store.getState().checkout;
    expect(state.gateway).toBe('razorpay');
  });

  it('stores orderNumber in checkout state', () => {
    store.dispatch(setCheckoutData({ orderNumber: 'DH-2025-0001' }));
    const state = store.getState().checkout;
    expect(state.orderNumber).toBe('DH-2025-0001');
  });
});

describe('Admin payment methods', () => {
  it('GET /admin/payment-methods is forbidden for admins', async () => {
    loginAdmin();
    await expect(api.get('/admin/payment-methods')).rejects.toMatchObject({
      response: { status: 403 },
    });
  });

  it('GET /admin/payment-methods lists razorpay only for super admins', async () => {
    loginSuperAdmin();
    const res = await api.get('/admin/payment-methods');
    expect(res.status).toBe(200);
    const methods = res.data.data.data;
    expect(methods.length).toBe(1);
    expect(methods.some((m: any) => m.code === 'razorpay')).toBe(true);
    expect(methods.some((m: any) => m.code === 'cod')).toBe(false);
  });

  it('GET /admin/payment-methods/razorpay/health returns status', async () => {
    loginSuperAdmin();
    const res = await api.get('/admin/payment-methods/razorpay/health');
    expect(res.status).toBe(200);
    expect(res.data.data.data.status).toBe('healthy');
  });
});
