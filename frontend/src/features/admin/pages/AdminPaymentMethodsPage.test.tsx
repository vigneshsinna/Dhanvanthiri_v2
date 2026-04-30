import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { store } from '@/app/store';
import { clearCredentials, setCredentials } from '@/features/auth/store/authSlice';
import { AdminPaymentMethodsPage } from '@/features/admin/pages/AdminPaymentMethodsPage';
import { server } from '@/test/msw-server';
import { renderWithProviders, userEvent } from '@/test/test-utils';

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => {
  server.resetHandlers();
  store.dispatch(clearCredentials());
});
afterAll(() => server.close());

describe('AdminPaymentMethodsPage', () => {
  it('renders payment methods from the nested backend response shape', async () => {
    store.dispatch(setCredentials({
      accessToken: 'super-admin-token',
      user: { id: 100, name: 'IT User', email: 'it@example.com', role: 'super_admin' },
    }));

    renderWithProviders(<AdminPaymentMethodsPage />, {
      route: '/admin/payment-methods',
      preloadedState: {
        auth: {
          isAuthenticated: true,
          accessToken: 'super-admin-token',
          user: { id: 100, name: 'IT User', email: 'it@example.com', role: 'super_admin' },
        },
      },
    });

    expect((await screen.findAllByText(/Razorpay \(Online Payment\)/i)).length).toBeGreaterThan(0);
    expect((await screen.findAllByText(/PhonePe/i)).length).toBeGreaterThan(0);
    expect(screen.getByLabelText(/Client ID/i)).toHaveValue('PHONEPEUAT');
    expect(screen.getByLabelText(/Client Secret/i)).toHaveValue('********');
    expect(screen.queryByText(/Cash on Delivery/i)).not.toBeInTheDocument();
  });

  it('saves PhonePe admin settings without exposing COD', async () => {
    const user = userEvent.setup();

    store.dispatch(setCredentials({
      accessToken: 'super-admin-token',
      user: { id: 100, name: 'IT User', email: 'it@example.com', role: 'super_admin' },
    }));

    renderWithProviders(<AdminPaymentMethodsPage />, {
      route: '/admin/payment-methods',
      preloadedState: {
        auth: {
          isAuthenticated: true,
          accessToken: 'super-admin-token',
          user: { id: 100, name: 'IT User', email: 'it@example.com', role: 'super_admin' },
        },
      },
    });

    await user.clear(await screen.findByLabelText(/Client Version/i));
    await user.type(screen.getByLabelText(/Client Version/i), '2');
    await user.click(screen.getByRole('button', { name: /save phonepe/i }));

    expect((await screen.findAllByText(/PhonePe/i)).length).toBeGreaterThan(0);
    expect(screen.queryByText(/Cash on Delivery/i)).not.toBeInTheDocument();
  });

  it('shows a healthy Razorpay connectivity state for super admins', async () => {
    const user = userEvent.setup();

    store.dispatch(setCredentials({
      accessToken: 'super-admin-token',
      user: { id: 100, name: 'IT User', email: 'it@example.com', role: 'super_admin' },
    }));

    renderWithProviders(<AdminPaymentMethodsPage />, {
      route: '/admin/payment-methods',
      preloadedState: {
        auth: {
          isAuthenticated: true,
          accessToken: 'super-admin-token',
          user: { id: 100, name: 'IT User', email: 'it@example.com', role: 'super_admin' },
        },
      },
    });

    await user.click(await screen.findByRole('button', { name: /test connection/i }));

    expect(await screen.findByText(/Connected/i)).toBeInTheDocument();
    expect(screen.getByText(/Razorpay API is reachable and credentials are valid\./i)).toBeInTheDocument();
  });
});
