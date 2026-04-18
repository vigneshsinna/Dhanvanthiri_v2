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
}));

describe('LoginPage', () => {
  beforeEach(() => {
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
    ['admin', 'admin-token'],
    ['super_admin', 'super-admin-token'],
  ])('redirects %s users to /admin after successful login', async (role, accessToken) => {
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
      expect(mockNavigate).toHaveBeenCalledWith('/admin', { replace: true });
    });
  });
});
