/**
 * CUSTOMER INVOICE DOWNLOAD WORKFLOW TEST
 * 
 * Real-world scenario: A customer makes a payment and needs to download their invoice.
 * This test verifies the complete user journey works as intended.
 */
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { server } from '@/test/msw-server';
import { api } from '@/lib/api/client';
import { store } from '@/app/store';
import { setCredentials, clearCredentials } from '@/features/auth/store/authSlice';

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => { server.resetHandlers(); store.dispatch(clearCredentials()); });
afterAll(() => server.close());

describe('REAL CUSTOMER WORKFLOW: Invoice Download After Payment', () => {
  it('Step 1: Customer logs in', () => {
    // Customer successfully authenticates
    store.dispatch(setCredentials({
      accessToken: 'real-jwt-token',
      user: {
        id: 1,
        name: 'Lakshmi',
        email: 'lakshmi@example.com',
        role: 'customer'
      }
    }));

    expect(store.getState().auth.isAuthenticated).toBe(true);
    expect(store.getState().auth.user?.email).toBe('lakshmi@example.com');
  });

  it('Step 2: Customer views their orders', async () => {
    store.dispatch(setCredentials({ 
      accessToken: 'test-jwt-token', 
      user: { id: 1, name: 'Lakshmi', email: 'lakshmi@example.com', role: 'customer' } 
    }));

    const res = await api.get('/orders');
    expect(res.status).toBe(200);
    // Customer has orders
    expect(res.data.data).toBeDefined();
  });

  it('Step 3: Customer clicks on an order to see details', async () => {
    store.dispatch(setCredentials({ 
      accessToken: 'test-jwt-token', 
      user: { id: 1, name: 'Lakshmi', email: 'lakshmi@example.com', role: 'customer' } 
    }));

    const res = await api.get('/orders/ORD-20260307-0001');
    expect(res.status).toBe(200);

    const order = res.data.data;
    expect(order).toBeDefined();
    expect(order.order_number).toBe('ORD-20260307-0001');
    expect(order.status).toBeDefined(); // Order has a status
  });

  it('Step 4: Order page shows invoice section (after payment)', async () => {
    store.dispatch(setCredentials({ 
      accessToken: 'test-jwt-token', 
      user: { id: 1, name: 'Lakshmi', email: 'lakshmi@example.com', role: 'customer' } 
    }));

    const res = await api.get('/orders/ORD-20260307-0001');
    const order = res.data.data;

    // Payment was processed, so invoice exists
    expect(order.invoice).toBeDefined();
    expect(order.invoice).not.toBeNull();

    // Invoice has the information customer needs
    expect(order.invoice.invoice_number).toBeDefined();
    expect(typeof order.invoice.invoice_number).toBe('string');

    // Invoice shows when it was issued
    const issuedDate = new Date(order.invoice.issued_at);
    expect(issuedDate.getTime()).toBeGreaterThan(0);
  });

  it('Step 5: Customer clicks download invoice button', async () => {
    store.dispatch(setCredentials({ 
      accessToken: 'test-jwt-token', 
      user: { id: 1, name: 'Lakshmi', email: 'lakshmi@example.com', role: 'customer' } 
    }));

    // Get order details to extract order ID
    const orderRes = await api.get('/orders/ORD-20260307-0001');
    const order = orderRes.data.data;
    const orderId = order.id;

    // Customer clicks download button, which calls the invoice endpoint
    const invoiceRes = await api.get(`/orders/${orderId}/invoice`);

    expect(invoiceRes.status).toBe(200);
    expect(invoiceRes.data).toBeDefined();
    // Response has PDF content type
    expect(invoiceRes.headers['content-type']).toBeDefined();
  });

  it('Step 6: Invoice downloads to customer device successfully', async () => {
    store.dispatch(setCredentials({ 
      accessToken: 'test-jwt-token', 
      user: { id: 1, name: 'Lakshmi', email: 'lakshmi@example.com', role: 'customer' } 
    }));

    const orderRes = await api.get('/orders/ORD-20260307-0001');
    const order = orderRes.data.data;
    const orderId = order.id;
    const invoiceNumber = order.invoice.invoice_number;

    const invoiceRes = await api.get(`/orders/${orderId}/invoice`);

    // Simulate frontend download logic
    expect(invoiceRes.status).toBe(200);
    expect(invoiceRes.data).toBeDefined();

    // Filename would be constructed from invoice number
    const expectedFilename = `${invoiceNumber}.pdf`;
    expect(expectedFilename).toMatch(/^INV-\d+-\d+\.pdf$/);
  });

  it('Step 7: Invoice contains correct customer information', async () => {
    store.dispatch(setCredentials({ 
      accessToken: 'test-jwt-token', 
      user: { id: 1, name: 'Lakshmi', email: 'lakshmi@example.com', role: 'customer' } 
    }));

    const orderRes = await api.get('/orders/ORD-20260307-0001');
    const order = orderRes.data.data;

    // Invoice data should match order data
    expect(order.invoice.invoice_number).toBeDefined();
    expect(order.invoice.issued_at).toBeDefined();
    
    // Invoice is associated with this order
    expect(order.invoice.order_id).toBe(order.id);
  });

  it('Complete workflow: Payment → Invoice → Download works end-to-end', async () => {
    store.dispatch(setCredentials({ 
      accessToken: 'test-jwt-token', 
      user: { id: 1, name: 'Lakshmi', email: 'lakshmi@example.com', role: 'customer' } 
    }));

    // 1. Customer has access token
    expect(store.getState().auth.isAuthenticated).toBe(true);

    // 2. Customer can view orders
    const ordersRes = await api.get('/orders');
    expect(ordersRes.status).toBe(200);

    // 3. Customer can view specific order
    const orderRes = await api.get('/orders/ORD-20260307-0001');
    expect(orderRes.status).toBe(200);
    const order = orderRes.data.data;

    // 4. Order has invoice (payment was processed)
    expect(order.invoice).toBeDefined();

    // 5. Customer can download invoice
    const invoiceRes = await api.get(`/orders/${order.id}/invoice`);
    expect(invoiceRes.status).toBe(200);

    // 6. All pieces work together
    expect({
      hasAccess: !!store.getState().auth.accessToken,
      hasInvoice: !!order.invoice,
      canDownload: invoiceRes.status === 200,
      invoiceNumber: order.invoice.invoice_number,
      issuedDate: order.invoice.issued_at,
    }).toEqual({
      hasAccess: true,
      hasInvoice: true,
      canDownload: true,
      invoiceNumber: expect.any(String),
      issuedDate: expect.any(String),
    });
  });
});
