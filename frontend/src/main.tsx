import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { RouterProvider } from 'react-router-dom';
import { store } from '@/app/store';
import { setAccessToken, setCredentials, type AuthUser } from '@/features/auth/store/authSlice';
import { queryClient } from '@/lib/query/client';
import { router } from '@/app/router';
import '@/index.css';

const storedAccessToken = localStorage.getItem('auth_token');
const storedUser = localStorage.getItem('auth_user');

if (storedAccessToken) {
  try {
    const user = storedUser ? JSON.parse(storedUser) as AuthUser : null;
    if (user?.role) {
      store.dispatch(setCredentials({ user, accessToken: storedAccessToken }));
    } else {
      store.dispatch(setAccessToken(storedAccessToken));
    }
  } catch {
    localStorage.removeItem('auth_user');
    store.dispatch(setAccessToken(storedAccessToken));
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HelmetProvider>
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={router} />
        </QueryClientProvider>
      </Provider>
    </HelmetProvider>
  </React.StrictMode>
);
