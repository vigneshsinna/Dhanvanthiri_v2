import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders, userEvent } from '@/test/test-utils';
import { LoginPage } from './LoginPage';

const mockMutateAsync = vi.fn();
const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('@/features/auth/api', () => ({
  useLoginMutation: () => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  }),
  useSocialProvidersQuery: () => ({ data: [] }),
  getSocialLoginRedirectUrl: (provider: string) => `/social/${provider}`,
}));

describe('LoginPage', () => {
  beforeEach(() => {
    localStorage.clear();
    mockMutateAsync.mockReset();
    mockNavigate.mockReset();
  });

  it('renders the sign in heading', () => {
    renderWithProviders(<LoginPage />);
    expect(screen.getByText('Sign in to your account')).toBeInTheDocument();
  });

  it('renders email input', () => {
    renderWithProviders(<LoginPage />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  });

  it('renders password input', () => {
    renderWithProviders(<LoginPage />);
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it('renders sign in button', () => {
    renderWithProviders(<LoginPage />);
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('has link to register page', () => {
    renderWithProviders(<LoginPage />);
    expect(screen.getByRole('link', { name: /create one/i })).toHaveAttribute('href', '/register');
  });

  it('has link to forgot password page', () => {
    renderWithProviders(<LoginPage />);
    expect(screen.getByRole('link', { name: /forgot password/i })).toHaveAttribute('href', '/forgot-password');
  });

  it('renders remember me checkbox', () => {
    renderWithProviders(<LoginPage />);
    expect(screen.getByLabelText(/remember me/i)).toBeInTheDocument();
  });

  it('renders brand name linking to home', () => {
    renderWithProviders(<LoginPage />);
    const brandLink = screen.getByRole('link', { name: /dhanvanthiri foods/i });
    expect(brandLink).toHaveAttribute('href', '/');
  });

  it.each([
    ['admin', 'admin-token', '/store-admin'],
    ['super_admin', 'super-admin-token', '/store-admin/modules'],
  ])('redirects %s users to the role-specific admin portal after successful login', async (role, accessToken, destination) => {
    mockMutateAsync.mockResolvedValue({
      data: {
        access_token: accessToken,
        user: {
          id: role === 'admin' ? 99 : 100,
          name: role === 'admin' ? 'Admin' : 'IT User',
          email: role === 'admin' ? 'admin@example.com' : 'it@example.com',
          role,
        },
      },
    });

    renderWithProviders(<LoginPage />);

    await userEvent.type(screen.getByLabelText(/email/i), 'admin@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'Password1!');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(destination, { replace: true });
    });
  });

  it('does not send customer users to an admin URL from login state', async () => {
    mockMutateAsync.mockResolvedValue({
      data: {
        access_token: 'customer-token',
        user: {
          id: 1,
          name: 'Lakshmi',
          email: 'lakshmi@example.com',
          role: 'customer',
        },
      },
    });

    renderWithProviders(<LoginPage />, { route: '/login' });

    await userEvent.type(screen.getByLabelText(/email/i), 'lakshmi@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'Password1!');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/products', { replace: true });
    });
  });

  it('clears an existing admin session before trying a new customer login', async () => {
    mockMutateAsync.mockRejectedValue({
      response: { data: { message: 'Unauthorized' } },
    });
    localStorage.setItem('auth_token', 'old-admin-token');
    localStorage.setItem('auth_user', JSON.stringify({
      id: 99,
      name: 'Admin',
      email: 'admin@example.com',
      role: 'admin',
    }));

    const { store } = renderWithProviders(<LoginPage />, {
      preloadedState: {
        auth: {
          isAuthenticated: true,
          user: { id: 99, name: 'Admin', email: 'admin@example.com', role: 'admin' },
          accessToken: 'old-admin-token',
        },
      },
    });

    await userEvent.type(screen.getByLabelText(/email/i), 'customer@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'WrongPassword1!');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText('Unauthorized')).toBeInTheDocument();
    });

    expect(store.getState().auth.isAuthenticated).toBe(false);
    expect(localStorage.getItem('auth_token')).toBeNull();
    expect(localStorage.getItem('auth_user')).toBeNull();
  });
});
