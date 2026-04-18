import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { Route, Routes } from 'react-router-dom';
import { screen, userEvent } from '@/test/test-utils';
import { server } from '@/test/msw-server';
import { renderWithProviders } from '@/test/test-utils';
import { AdminLayout } from '@/components/layout/AdminLayout';

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('AdminLayout', () => {
  it('opens the user menu with settings and logout actions', async () => {
    renderWithProviders(
      <Routes>
        <Route path="/store-admin" element={<AdminLayout />}>
          <Route index element={<div>Dashboard content</div>} />
        </Route>
      </Routes>,
      {
        route: '/admin',
        preloadedState: {
          auth: {
            isAuthenticated: true,
            accessToken: 'admin-token',
            user: { id: 99, name: 'Admin User', email: 'admin@example.com', role: 'admin' },
          },
        },
      },
    );

    const userMenuButton = await screen.findByRole('button', { name: /open user menu/i });
    await userEvent.click(userMenuButton);

    expect(screen.getByRole('link', { name: /store settings/i })).toHaveAttribute('href', '/admin/settings');
    expect(screen.getByRole('link', { name: /security settings/i })).toHaveAttribute('href', '/profile/security');
    expect(screen.getAllByRole('button', { name: /logout/i })).toHaveLength(2);
  });

  it('navigates to admin notifications when the bell is clicked', async () => {
    renderWithProviders(
      <Routes>
        <Route path="/store-admin" element={<AdminLayout />}>
          <Route index element={<div>Dashboard content</div>} />
          <Route path="notifications" element={<div>Notifications page</div>} />
        </Route>
      </Routes>,
      {
        route: '/admin',
        preloadedState: {
          auth: {
            isAuthenticated: true,
            accessToken: 'admin-token',
            user: { id: 99, name: 'Admin User', email: 'admin@example.com', role: 'admin' },
          },
        },
      },
    );

    const notificationsButton = await screen.findByRole('button', { name: /view notifications/i });
    await userEvent.click(notificationsButton);

    expect(await screen.findByText('Notifications page')).toBeInTheDocument();
  });
});
