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

    expect(await screen.findByText(/Razorpay \(Online Payment\)/i)).toBeInTheDocument();
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
