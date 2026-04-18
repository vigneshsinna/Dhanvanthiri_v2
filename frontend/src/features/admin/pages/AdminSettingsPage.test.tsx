import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { AdminSettingsPage } from '@/features/admin/pages/AdminSettingsPage';
import { server } from '@/test/msw-server';
import { renderWithProviders } from '@/test/test-utils';

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('AdminSettingsPage', () => {
  it('shows admin user access inside settings for IT User', async () => {
    renderWithProviders(<AdminSettingsPage />, {
      route: '/admin/settings',
      preloadedState: {
        auth: {
          isAuthenticated: true,
          accessToken: 'super-admin-token',
          user: { id: 100, name: 'IT User', email: 'it@example.com', role: 'super_admin' },
        },
      },
    });

    expect(await screen.findByText(/general settings/i)).toBeInTheDocument();
    const link = screen.getByRole('link', { name: /manage admin user access/i });
    expect(link).toHaveAttribute('href', '/admin/admins');
  });

  it('hides admin user access inside settings for admin users', async () => {
    renderWithProviders(<AdminSettingsPage />, {
      route: '/admin/settings',
      preloadedState: {
        auth: {
          isAuthenticated: true,
          accessToken: 'admin-token',
          user: { id: 99, name: 'Admin', email: 'admin@example.com', role: 'admin' },
        },
      },
    });

    expect(await screen.findByText(/general settings/i)).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /manage admin user access/i })).not.toBeInTheDocument();
  });
});
