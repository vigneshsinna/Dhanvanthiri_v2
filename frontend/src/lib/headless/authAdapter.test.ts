import { beforeEach, describe, expect, it, vi } from 'vitest';
import { authAdapter } from './authAdapter';
import { headlessApi } from './client';

vi.mock('./client', async () => {
  const actual = await vi.importActual<typeof import('./client')>('./client');
  return {
    ...actual,
    headlessApi: {
      get: vi.fn(),
      post: vi.fn(),
    },
  };
});

const mockedGet = vi.mocked(headlessApi.get);
const mockedPost = vi.mocked(headlessApi.post);

describe('authAdapter', () => {
  beforeEach(() => {
    mockedGet.mockReset();
    mockedPost.mockReset();
    localStorage.clear();
  });

  it('sends the V2 login_by field and normalizes the returned role', async () => {
    mockedPost.mockResolvedValue({
      data: {
        result: true,
        access_token: 'access-token',
        user: {
          id: 99,
          type: 'admin',
          role: 'super_admin',
          name: 'Admin User',
          email: 'admin@example.com',
          avatar: '',
          avatar_original: '',
        },
      },
    } as any);

    const response = await authAdapter.login({
      email: 'admin@example.com',
      password: 'secret123',
    });

    expect(mockedPost).toHaveBeenCalledWith('/auth/login', {
      email: 'admin@example.com',
      password: 'secret123',
      login_by: 'email',
      identity_matrix: 'headless-storefront',
    });
    expect(response.data.user.role).toBe('super_admin');
    expect(localStorage.getItem('auth_token')).toBe('access-token');
  });

  it('accepts the raw /auth/user payload returned by the V2 backend', async () => {
    mockedGet.mockResolvedValue({
      data: {
        id: 5,
        type: 'customer',
        name: 'Lakshmi',
        email: 'lakshmi@example.com',
        phone: '9876543210',
        avatar: '',
      },
    } as any);

    const response = await authAdapter.me();

    expect(response.data.user).toEqual(expect.objectContaining({
      id: 5,
      name: 'Lakshmi',
      email: 'lakshmi@example.com',
      role: 'customer',
      phone: '9876543210',
    }));
  });
});
