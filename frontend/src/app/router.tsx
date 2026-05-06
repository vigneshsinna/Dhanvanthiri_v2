import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { PrivateRoute } from '@/components/guards';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { RegisterPage } from '@/features/auth/pages/RegisterPage';
import { ForgotPasswordPage } from '@/features/auth/pages/ForgotPasswordPage';
import { ResetPasswordPage } from '@/features/auth/pages/ResetPasswordPage';
import { ProfilePage } from '@/features/auth/pages/ProfilePage';
import { SecurityPage } from '@/features/auth/pages/SecurityPage';
import { HomePage } from '@/pages/HomePage';
import { AboutPage } from '@/pages/AboutPage';
import { CatalogPage } from '@/features/catalog/pages/CatalogPage';
import { ProductDetailPage } from '@/features/catalog/pages/ProductDetailPage';
import { CartPage } from '@/features/cart/pages/CartPage';
import { CheckoutPage } from '@/features/checkout/pages/CheckoutPage';
import { OrderConfirmationPage } from '@/features/payment/pages/OrderConfirmationPage';
import { OrderListPage } from '@/features/orders/pages/OrderListPage';
import { OrderDetailPage } from '@/features/orders/pages/OrderDetailPage';
import { OrderTrackingPage } from '@/features/orders/pages/OrderTrackingPage';
import { WishlistPage } from '@/features/wishlist/pages/WishlistPage';
import { BlogListPage } from '@/features/cms/pages/BlogListPage';
import { BlogPostPage } from '@/features/cms/pages/BlogPostPage';
import { ContactPage } from '@/features/cms/pages/ContactPage';
import { DynamicPage } from '@/features/cms/pages/DynamicPage';
import { FaqPage } from '@/features/cms/pages/FaqPage';
import { NotFoundPage } from '@/pages/NotFoundPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'products', element: <CatalogPage /> },
      { path: 'products/:slug', element: <ProductDetailPage /> },
      { path: 'cart', element: <CartPage /> },
      { path: 'checkout', element: <CheckoutPage /> },
      {
        path: 'profile',
        element: (
          <PrivateRoute>
            <ProfilePage />
          </PrivateRoute>
        ),
      },
      {
        path: 'profile/security',
        element: (
          <PrivateRoute>
            <SecurityPage />
          </PrivateRoute>
        ),
      },
      { path: 'checkout/confirmation', element: <OrderConfirmationPage /> },
      {
        path: 'account/orders',
        element: (
          <PrivateRoute>
            <OrderListPage />
          </PrivateRoute>
        ),
      },
      {
        path: 'account/orders/:orderNumber',
        element: (
          <PrivateRoute>
            <OrderDetailPage />
          </PrivateRoute>
        ),
      },
      {
        path: 'wishlist',
        element: (
          <PrivateRoute>
            <WishlistPage />
          </PrivateRoute>
        ),
      },
      { path: 'blog', element: <BlogListPage /> },
      { path: 'blog/:slug', element: <BlogPostPage /> },
      { path: 'contact', element: <ContactPage /> },
      { path: 'about', element: <Navigate to="/pages/about" replace /> },
      { path: 'pages/about', element: <AboutPage /> },
      { path: 'pages/contact', element: <ContactPage /> },
      { path: 'pages/:slug', element: <DynamicPage /> },
      { path: 'faq', element: <FaqPage /> },
      { path: 'track-order', element: <OrderTrackingPage /> },
      { path: 'order/:orderNumber', element: <OrderDetailPage /> },
    ],
  },
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  { path: '/forgot-password', element: <ForgotPasswordPage /> },
  { path: '/reset-password', element: <ResetPasswordPage /> },
  { path: '*', element: <NotFoundPage /> },
]);
