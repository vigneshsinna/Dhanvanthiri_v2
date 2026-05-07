/**
 * Headless Commerce API Client
 * Connects to the new V2 backend (/api/v2)
 * Used by adapter modules to bridge old frontend → new backend
 */
import axios from 'axios';
import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { store } from '@/app/store';
import { setAccessToken } from '@/features/auth/store/authSlice';
import { clearCredentials } from '@/features/auth/store/authSlice';

const HEADLESS_BASE_URL = '/api/v2';

export const headlessApi: AxiosInstance = axios.create({
  baseURL: HEADLESS_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 15000,
});

let refreshPromise: Promise<string | null> | null = null;

function extractAccessToken(payload: any): string | null {
  return payload?.access_token ?? payload?.data?.access_token ?? null;
}

// Request interceptor: attach auth token + language + system key
headlessApi.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const state = store.getState();
  const token = state.auth.accessToken;
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  const locale = localStorage.getItem('dhanvanthiri_locale') || 'en';
  config.headers['App-Language'] = locale;

  // Required by EnsureSystemKey middleware on all API routes
  config.headers['System-Key'] = (import.meta as any).env?.VITE_SYSTEM_KEY || '0d279f87add587c1c6d046cd59ee012d';

  return config;
});

headlessApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = (error.config ?? {}) as any;
    const token = store.getState().auth.accessToken;

    if (
      error.response?.status === 401
      && !original._retry
      && token
      && !String(original.url || '').includes('/auth/refresh')
    ) {
      original._retry = true;

      try {
        if (!refreshPromise) {
          const locale = localStorage.getItem('dhanvanthiri_locale') || 'en';
          refreshPromise = axios.post<{ access_token?: string }>(`${HEADLESS_BASE_URL}/auth/refresh`, {}, {
            headers: {
              Authorization: `Bearer ${token}`,
              'App-Language': locale,
              'System-Key': (import.meta as any).env?.VITE_SYSTEM_KEY || '0d279f87add587c1c6d046cd59ee012d',
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
          localStorage.setItem('auth_token', refreshedToken);
          original.headers = original.headers ?? {};
          original.headers.Authorization = `Bearer ${refreshedToken}`;
          return headlessApi(original);
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

// ── Helpers ─────────────────────────────────────────────────

/**
 * Unwrap V2 API envelope: { success, data, message, meta }
 */
export function unwrapData<T>(response: { data: { data: T } }): T {
  return response.data.data;
}

export function unwrapResponse<T>(response: { data: T }): T {
  return response.data;
}

/**
 * Parse a price string like "$12.99" or "₹299.00" into a number.
 */
export function parsePrice(price: string | number | undefined): number {
  if (typeof price === 'number') return price;
  if (!price) return 0;
  const cleaned = price.replace(/[^0-9.,-]/g, '').replace(',', '');
  return parseFloat(cleaned) || 0;
}
