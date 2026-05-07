import { describe, it, expect } from 'vitest';
import { renderWithProviders, screen } from '@/test/test-utils';
import { PrivateRoute } from './index';
import { Routes, Route, useLocation } from 'react-router-dom';

function TestProtected() {
  return <div>Protected Content</div>;
}

function LoginLocationState() {
  const location = useLocation();
  return <div>{(location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? 'no-from'}</div>;
}

// We need to render through Routes for Navigate to work properly
function renderGuardedRoute(
  Guard: typeof PrivateRoute,
  preloadedState: Parameters<typeof renderWithProviders>[1]
) {
  return renderWithProviders(
    <Routes>
      <Route path="/" element={<Guard><TestProtected /></Guard>} />
      <Route path="/login" element={<div>Login Page</div>} />
    </Routes>,
    preloadedState,
  );
}

describe('PrivateRoute', () => {
  it('renders children when authenticated', () => {
    renderGuardedRoute(PrivateRoute, {
      preloadedState: {
        auth: {
          isAuthenticated: true,
          user: { id: 1, name: 'Test', email: 'a@b.com', role: 'customer' },
          accessToken: 'token',
        },
      },
    });
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('redirects to login when not authenticated', () => {
    renderGuardedRoute(PrivateRoute, {
      preloadedState: {
        auth: { isAuthenticated: false, user: null, accessToken: null },
      },
    });
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });
});
