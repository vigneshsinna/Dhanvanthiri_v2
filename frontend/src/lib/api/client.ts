import axios from 'axios';
import { store } from '@/app/store';
import { setAccessToken } from '@/features/auth/store/authSlice';
import { clearCredentials } from '@/features/auth/store/authSlice';

export const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

let refreshPromise: Promise<string | null> | null = null;
const systemKey = (import.meta as any).env?.VITE_SYSTEM_KEY || '';

function extractAccessToken(payload: any): string | null {
  return payload?.access_token ?? payload?.data?.access_token ?? null;
}

api.interceptors.request.use((config) => {
  const state = store.getState();
  const token = state.auth.accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  const locale = localStorage.getItem('dhanvanthiri_locale') || 'en';
  config.headers['Accept-Language'] = locale;

  const cartToken = state.cart.cartToken;
  if (cartToken && (
    config.url?.startsWith('/cart') ||
    config.url?.startsWith('/guest') ||
    config.url?.startsWith('/checkout') ||
    config.url?.startsWith('/payments')
  )) {
    config.headers['X-Cart-Token'] = cartToken;
  }

  config.headers['System-Key'] = systemKey;

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = (error.config ?? {}) as any;
    const token = store.getState().auth.accessToken;

    if (
      error.response?.status === 401
      && !original._retry
      && token
      && !String(original.url || '').includes('/v2/auth/refresh')
    ) {
      original._retry = true;

      try {
        if (!refreshPromise) {
          const locale = localStorage.getItem('dhanvanthiri_locale') || 'en';
          refreshPromise = axios.post<{ access_token?: string }>('/api/v2/auth/refresh', {}, {
            headers: {
              Authorization: `Bearer ${token}`,
              'Accept-Language': locale,
              'System-Key': systemKey,
              Accept: 'application/json',
            },
          }).then((response) => extractAccessToken(response.data))
            .finally(() => {
              refreshPromise = null;
            });
        }

        const refreshedToken = await refreshPromise;
        if (refreshedToken) {
          store.dispatch(setAccessToken(refreshedToken));
          original.headers = original.headers ?? {};
          original.headers.Authorization = `Bearer ${refreshedToken}`;
          return api(original);
        }
      } catch {
        // Fall through to clearing credentials below.
      }

      store.dispatch(clearCredentials());
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
    }

    return Promise.reject(error);
  }
);
