import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { AdminDashboardPage } from '@/features/admin/pages/AdminDashboardPage';
import { server } from '@/test/msw-server';
import { renderWithProviders } from '@/test/test-utils';

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('AdminDashboardPage', () => {
  it('renders revenue, orders, customers, and low stock cards from the real summary shape', async () => {
    renderWithProviders(<AdminDashboardPage />, {
      route: '/admin',
      preloadedState: {
        auth: {
          isAuthenticated: true,
          accessToken: 'admin-token',
          user: { id: 99, name: 'Admin', email: 'admin@example.com', role: 'admin' },
        },
      },
    });

    expect(await screen.findByText(/^Revenue$/i)).toBeInTheDocument();
    expect(screen.getByText(/^Orders$/i)).toBeInTheDocument();
    expect(screen.getByText(/^Customers$/i)).toBeInTheDocument();
    expect(screen.getAllByText(/^Low Stock$/i).length).toBeGreaterThan(0);
  });

  it('renders IT User technical widgets for super_admin', async () => {
    renderWithProviders(<AdminDashboardPage />, {
      route: '/admin',
      preloadedState: {
        auth: {
          isAuthenticated: true,
          accessToken: 'super-admin-token',
          user: { id: 100, name: 'IT User', email: 'it@example.com', role: 'super_admin' },
        },
      },
    });

    expect(await screen.findByText(/License Issues/i)).toBeInTheDocument();
    expect(screen.getByText(/Enabled Modules/i)).toBeInTheDocument();
  });
});
