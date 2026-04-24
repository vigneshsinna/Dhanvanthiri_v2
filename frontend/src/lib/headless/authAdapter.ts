/**
 * Auth Adapter
 * Maps new V2 auth endpoints → old frontend auth contract
 *
 * Old endpoints:           New V2 endpoints:
 * POST /auth/login      → POST /auth/login
 * POST /auth/register   → POST /auth/signup
 * GET  /auth/me         → GET  /auth/user
 * POST /auth/logout     → POST /auth/logout
 * POST /auth/forgot-password → POST /auth/password/forget_request
 * POST /auth/reset-password  → POST /auth/password/confirm_reset
 * PUT  /profile         → POST /profile/update
 * PUT  /profile/password → POST /profile/update (with password field)
 * POST /profile/avatar  → POST /profile/update (multipart — not directly supported)
 */
import { headlessApi, unwrapResponse } from './client';
import type { AuthUser } from '@/features/auth/store/authSlice';

interface V2LoginResponse {
  result: boolean;
  message: string;
  access_token: string;
  token_type: string;
  expires_at?: string;
  user: V2User;
}

interface V2User {
  id: number;
  type: string;
  role?: string;
  name: string;
  email: string;
  avatar: string;
  avatar_original: string;
  phone?: string;
}

interface V2SignupResponse {
  result: boolean;
  message: string;
  access_token: string;
  token_type: string;
  user: V2User;
}

interface SocialLoginSetting {
  type: string;
  value: string | number | boolean | null;
}

function normalizeUser(v2User: V2User): AuthUser {
  const role = v2User.role ?? (v2User.type === 'admin' ? 'admin' : 'customer');
  return {
    id: v2User.id,
    name: v2User.name,
    email: v2User.email,
    role: role === 'super_admin' ? 'super_admin' : role === 'admin' ? 'admin' : 'customer',
  };
}

export const authAdapter: any = {
  async socialProviders() {
    const res = await headlessApi.get<SocialLoginSetting[]>('/activated-social-login');
    const rows = Array.isArray(res.data) ? res.data : [];
    const enabled = new Set(['1', 'true', 'yes', 'on', 'enabled']);

    return rows
      .filter((row) => enabled.has(String(row.value ?? '').toLowerCase()))
      .map((row) => String(row.type).replace(/_login$/i, ''))
      .filter((provider) => ['google', 'facebook', 'twitter'].includes(provider));
  },

  socialLoginRedirectUrl(provider: string) {
    const env = ((import.meta as unknown as { env?: Record<string, string | undefined> }).env ?? {});
    const base = (env.VITE_LARAVEL_APP_URL || env.VITE_APP_URL || '').replace(/\/+$/, '');
    return `${base}/social-login/redirect/${provider}`;
  },

  async login(payload: { email: string; password: string }) {
    const res = await headlessApi.post<V2LoginResponse>('/auth/login', {
      ...payload,
      login_by: 'email',
      // The V2 backend rejects customer login when this legacy field is empty.
      identity_matrix: 'headless-storefront',
    });
    const v2 = res.data;

    // Store token in localStorage for V2 client compatibility
    if (v2.access_token) {
      localStorage.setItem('auth_token', v2.access_token);
    }

    return {
      data: {
        user: normalizeUser(v2.user),
        access_token: v2.access_token,
      },
    };
  },

  async register(payload: { name: string; email: string; password: string; password_confirmation: string }) {
    const res = await headlessApi.post<V2SignupResponse>('/auth/signup', {
      name: payload.name,
      email_or_phone: payload.email,
      password: payload.password,
      password_confirmation: payload.password_confirmation,
      register_by: 'email',
    });
    const v2 = res.data;

    if (v2.access_token) {
      localStorage.setItem('auth_token', v2.access_token);
    }

    return {
      data: {
        user: normalizeUser(v2.user),
        access_token: v2.access_token,
      },
    };
  },

  async me() {
    const res = await headlessApi.get<{ result?: boolean; user?: V2User } & Partial<V2User>>('/auth/user');
    const v2User = (res.data.user ?? res.data) as V2User;
    const normalized = {
      ...normalizeUser(v2User),
      phone: v2User.phone || '',
      avatar: v2User.avatar || '',
    };
    return {
      data: {
        // Flat user fields for ProfilePage (meData.data.name, meData.data.phone, etc.)
        ...normalized,
        // Nested user object for AppLayout (meData.data.user)
        user: normalized,
      },
    };
  },

  async logout() {
    const res = await headlessApi.get('/auth/logout');
    localStorage.removeItem('auth_token');
    return { data: res.data };
  },

  async forgotPassword(payload: { email: string }) {
    const res = await headlessApi.post('/auth/password/forget_request', {
      email_or_phone: payload.email,
      send_code_by: 'email',
    });
    return { data: res.data };
  },

  async resetPassword(payload: { token: string; email: string; password: string; password_confirmation: string }) {
    const res = await headlessApi.post('/auth/password/confirm_reset', {
      verification_code: payload.token,
      email: payload.email,
      password: payload.password,
    });
    return { data: res.data };
  },

  async updateProfile(payload: { name: string; email: string; phone?: string }) {
    const res = await headlessApi.post('/profile/update', {
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
    });
    return { data: res.data };
  },

  async changePassword(payload: { current_password: string; password: string; password_confirmation: string }) {
    const res = await headlessApi.post('/profile/update', {
      current_password: payload.current_password,
      password: payload.password,
    });
    return { data: res.data };
  },

  async uploadAvatar(file: File) {
    const fd = new FormData();
    fd.append('avatar', file);
    // V2 profile/update may or may not support avatar upload directly
    // Try as profile image upload
    const res = await headlessApi.post('/profile/image-upload', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return { data: res.data };
  },
};

