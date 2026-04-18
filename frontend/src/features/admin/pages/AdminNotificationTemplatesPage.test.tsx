import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { HttpResponse, http } from 'msw';
import { screen, userEvent } from '@/test/test-utils';
import { server } from '@/test/msw-server';
import { renderWithProviders } from '@/test/test-utils';
import { AdminNotificationTemplatesPage } from '@/features/admin/pages/AdminNotificationTemplatesPage';

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('AdminNotificationTemplatesPage', () => {
  it('renders and opens templates from the real Laravel response shape', async () => {
    server.use(
      http.get('/api/admin/notification-templates', () => HttpResponse.json({
        message: 'OK',
        code: 'SUCCESS',
        data: {
          data: [
            {
              id: 1,
              type: 'email',
              context: 'order_confirmed',
              subject: { en: 'Order confirmed', ta: '' },
              content: { en: '<p>Your order is confirmed.</p>', ta: '' },
              variables: ['{{customer_name}}', '{{order_number}}'],
              is_active: true,
            },
          ],
        },
      })),
    );

    renderWithProviders(<AdminNotificationTemplatesPage />, {
      route: '/admin/notification-templates',
      preloadedState: {
        auth: {
          isAuthenticated: true,
          accessToken: 'admin-token',
          user: { id: 99, name: 'Admin', email: 'admin@example.com', role: 'admin' },
        },
      },
    });

    const templateButton = await screen.findByRole('button', { name: /email order confirmed/i });
    expect(templateButton).toBeInTheDocument();

    await userEvent.click(templateButton);

    expect(await screen.findByText(/order confirmed template/i)).toBeInTheDocument();
    expect(screen.getByText(/available variables/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue('Order confirmed')).toBeInTheDocument();
  });
});
