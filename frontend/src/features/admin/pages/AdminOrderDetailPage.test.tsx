import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { Route, Routes } from 'react-router-dom';
import { screen } from '@testing-library/react';
import { AdminOrderDetailPage } from '@/features/admin/pages/AdminOrderDetailPage';
import { server } from '@/test/msw-server';
import { renderWithProviders } from '@/test/test-utils';

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('AdminOrderDetailPage', () => {
  it('shows invoice and tracking actions in admin order detail', async () => {
    renderWithProviders(
      <Routes>
        <Route path="/store-admin/orders/:id" element={<AdminOrderDetailPage />} />
      </Routes>,
      {
        route: '/admin/orders/1',
        preloadedState: {
          auth: {
            isAuthenticated: true,
            accessToken: 'admin-token',
            user: { id: 99, name: 'Admin', email: 'admin@example.com', role: 'admin' },
          },
        },
      },
    );

    const invoiceButtons = await screen.findAllByRole('button', { name: /download invoice/i });
    expect(invoiceButtons.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole('heading', { name: /Tracking/i })).toBeInTheDocument();
  });
});
