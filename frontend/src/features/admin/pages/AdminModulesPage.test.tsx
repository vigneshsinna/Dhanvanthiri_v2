import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { HttpResponse, http } from 'msw';
import { AdminModulesPage } from '@/features/admin/pages/AdminModulesPage';
import { server } from '@/test/msw-server';
import { renderWithProviders, screen } from '@/test/test-utils';

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('AdminModulesPage', () => {
  it('shows a read-only masked license key to admin users', async () => {
    renderWithProviders(<AdminModulesPage />, {
      route: '/admin/modules',
      preloadedState: {
        auth: {
          isAuthenticated: true,
          accessToken: 'admin-token',
          user: { id: 99, name: 'Admin', email: 'admin@example.com', role: 'admin' },
        },
      },
    });

    expect(await screen.findByDisplayValue(/\*{4,}/)).toBeInTheDocument();
  });

  it('does not nest the activation button inside the module row button', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    renderWithProviders(<AdminModulesPage />, {
      route: '/admin/modules',
      preloadedState: {
        auth: {
          isAuthenticated: true,
          accessToken: 'admin-token',
          user: { id: 99, name: 'Admin', email: 'admin@example.com', role: 'admin' },
        },
      },
    });

    expect(await screen.findByRole('button', { name: /Request Activation/i })).toBeInTheDocument();

    const nestingWarnings = consoleErrorSpy.mock.calls.filter((call) =>
      call.some((value) => String(value).includes('<button> cannot appear as a descendant of <button>'))
    );

    expect(nestingWarnings).toHaveLength(0);
    consoleErrorSpy.mockRestore();
  });

  it('shows the setup-required state when module licensing is unavailable', async () => {
    server.use(
      http.get('/api/admin/modules', () => HttpResponse.json({
        success: true,
        message: 'Module licensing setup required',
        data: {
          data: [],
          meta: {
            setup_required: true,
            reason: 'feature_modules_table_missing',
          },
        },
      })),
    );

    renderWithProviders(<AdminModulesPage />, {
      route: '/admin/modules',
      preloadedState: {
        auth: {
          isAuthenticated: true,
          accessToken: 'super-admin-token',
          user: { id: 100, name: 'IT User', email: 'it@example.com', role: 'super_admin' },
        },
      },
    });

    expect(await screen.findByText(/Module licensing setup required/i)).toBeInTheDocument();
    expect(screen.getByText(/feature_modules_table_missing/i)).toBeInTheDocument();
  });
});
