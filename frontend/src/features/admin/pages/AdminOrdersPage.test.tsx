import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import { AdminOrdersPage } from '@/features/admin/pages/AdminOrdersPage';
import { server } from '@/test/msw-server';
import { renderWithProviders } from '@/test/test-utils';

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('AdminOrdersPage', () => {
  it('renders the commerce order columns from the admin orders API', async () => {
    renderWithProviders(<AdminOrdersPage />, {
      route: '/admin/orders',
      preloadedState: {
        auth: {
          isAuthenticated: true,
          accessToken: 'admin-token',
          user: { id: 99, name: 'Admin', email: 'admin@example.com', role: 'admin' },
        },
      },
    });

    const table = await screen.findByRole('table');
    const tableScope = within(table);

    expect(tableScope.getByRole('columnheader', { name: /order id/i })).toBeInTheDocument();
    expect(tableScope.getByRole('columnheader', { name: /products/i })).toBeInTheDocument();
    expect(tableScope.getByRole('columnheader', { name: /customer/i })).toBeInTheDocument();
    expect(tableScope.getByRole('columnheader', { name: /amount/i })).toBeInTheDocument();
    expect(tableScope.getByRole('columnheader', { name: /delivery status/i })).toBeInTheDocument();
    expect(tableScope.getByRole('columnheader', { name: /payment method/i })).toBeInTheDocument();
    expect(tableScope.getByRole('columnheader', { name: /payment status/i })).toBeInTheDocument();
    expect(tableScope.getByRole('columnheader', { name: /actions/i })).toBeInTheDocument();

    expect(tableScope.getByText(/poondu thokku/i)).toBeInTheDocument();
    expect(tableScope.getByText(/lakshmi@example.com/i)).toBeInTheDocument();
    expect(tableScope.getByText(/razorpay/i)).toBeInTheDocument();
    expect(tableScope.getByText(/captured/i)).toBeInTheDocument();
  });
});
