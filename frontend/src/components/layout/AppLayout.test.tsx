import { act } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen } from '@/test/test-utils';
import { AppLayout } from './AppLayout';

const mockUseCartQuery = vi.fn();
const mockUseWebsiteSettingsQuery = vi.fn();
const mockSyncCartStateFromResponse = vi.fn();

vi.mock('@/features/auth/api', () => ({
  useMeQuery: () => ({ data: null, isLoading: false }),
  useLogoutMutation: () => ({ mutateAsync: vi.fn() }),
}));

vi.mock('@/features/cart/api', () => ({
  useCartQuery: () => mockUseCartQuery(),
  syncCartStateFromResponse: (payload: unknown) => mockSyncCartStateFromResponse(payload),
}));

vi.mock('@/features/cms/api', async () => {
  const actual = await vi.importActual<typeof import('@/features/cms/api')>('@/features/cms/api');
  return {
    ...actual,
    useWebsiteSettingsQuery: () => mockUseWebsiteSettingsQuery(),
    useActiveAlertsQuery: () => ({ data: { data: { items: [] } }, isLoading: false }),
    useActivePopupsQuery: () => ({ data: { data: { items: [] } }, isLoading: false }),
  };
});

vi.mock('@/lib/utils/usePageScrollReveal', () => ({
  usePageScrollReveal: vi.fn(),
}));

describe('AppLayout', () => {
  beforeEach(() => {
    localStorage.clear();
    mockUseCartQuery.mockReset();
    mockUseCartQuery.mockReturnValue({ data: null, isLoading: false });
    mockSyncCartStateFromResponse.mockReset();
    mockUseWebsiteSettingsQuery.mockReset();
    mockUseWebsiteSettingsQuery.mockReturnValue({ data: null, isLoading: false });
  });

  it('renders announcement bar', () => {
    renderWithProviders(<AppLayout />);
    expect(screen.getByText(/free shipping/i)).toBeInTheDocument();
  });

  it('renders brand logo', () => {
    renderWithProviders(<AppLayout />);
    const logo = screen.getAllByAltText(/dhanvanthiri/i);
    expect(logo.length).toBeGreaterThan(0);
    expect(logo[0]).toHaveAttribute('src', '/images/dhanvanthiri-logo.png');
  });

  it('renders desktop navigation links', () => {
    renderWithProviders(<AppLayout />);
    const links = screen.getAllByRole('link');
    const productLinks = links.filter((link) => link.getAttribute('href') === '/products');
    expect(productLinks.length).toBeGreaterThan(0);
  });

  it('has Products, Blog, FAQ, About nav links', () => {
    renderWithProviders(<AppLayout />);
    const allText = document.body.textContent ?? '';
    expect(allText).toContain('Products');
    expect(allText).toContain('Blog');
    expect(allText).toContain('FAQ');
    expect(allText).toContain('About');
  });

  it('renders cart icon link', () => {
    renderWithProviders(<AppLayout />);
    const cartLink = screen.getByLabelText(/cart/i);
    expect(cartLink).toBeInTheDocument();
    expect(cartLink.getAttribute('href')).toBe('/cart');
  });

  it('shows Sign In button when not authenticated', () => {
    renderWithProviders(<AppLayout />, {
      preloadedState: {
        auth: { isAuthenticated: false, user: null, accessToken: null },
      },
    });
    const allText = document.body.textContent ?? '';
    expect(allText).toContain('Sign In');
  });

  it('shows user name when authenticated', () => {
    renderWithProviders(<AppLayout />, {
      preloadedState: {
        auth: {
          isAuthenticated: true,
          user: { id: 1, name: 'Test User', email: 'test@test.com', role: 'customer' },
          accessToken: 'token',
        },
      },
    });
    const allText = document.body.textContent ?? '';
    expect(allText).toContain('Test User');
  });

  it('shows Admin link for admin users', () => {
    renderWithProviders(<AppLayout />, {
      preloadedState: {
        auth: {
          isAuthenticated: true,
          user: { id: 1, name: 'Admin', email: 'admin@test.com', role: 'admin' },
          accessToken: 'token',
        },
      },
    });
    const allText = document.body.textContent ?? '';
    expect(allText).toContain('Admin');
    expect(screen.getAllByRole('link', { name: /^admin$/i }).some((link) => link.getAttribute('href') === '/store-admin')).toBe(true);
  });

  it('hides configured admin navigation from customer users', () => {
    mockUseWebsiteSettingsQuery.mockReturnValue({
      data: {
        navigation: {
          primary: [
            { label: 'Products', href: '/products' },
            { label: 'Admin', href: '/admin' },
            { label: 'Store Admin', href: '/store-admin' },
          ],
        },
      },
      isLoading: false,
    });

    renderWithProviders(<AppLayout />, {
      preloadedState: {
        auth: {
          isAuthenticated: true,
          user: { id: 1, name: 'Customer', email: 'customer@test.com', role: 'customer' },
          accessToken: 'token',
        },
      },
    });

    expect(screen.getByRole('link', { name: /^products$/i })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /^admin$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /store admin/i })).not.toBeInTheDocument();
  });

  it('links IT users to the module license portal', () => {
    renderWithProviders(<AppLayout />, {
      preloadedState: {
        auth: {
          isAuthenticated: true,
          user: { id: 100, name: 'IT User', email: 'it@test.com', role: 'super_admin' },
          accessToken: 'token',
        },
      },
    });

    expect(screen.getByRole('link', { name: /it portal/i })).toHaveAttribute('href', '/store-admin/modules');
  });

  it('shows cart badge when items in cart', () => {
    renderWithProviders(<AppLayout />, {
      preloadedState: {
        cart: {
          items: [],
          coupon: null,
          subtotal: 0,
          discountAmount: 0,
          shippingCost: null,
          taxAmount: null,
          grandTotal: 0,
          itemCount: 3,
          cartToken: null,
        },
      },
    });
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('shows add-to-cart confirmation near the cart icon', () => {
    renderWithProviders(<AppLayout />);

    act(() => {
      window.dispatchEvent(new CustomEvent('dhanvanthiri:cart-added'));
    });

    const cartLink = screen.getByLabelText(/cart/i);
    const notice = screen.getByRole('status');

    expect(notice).toHaveTextContent(/added to cart/i);
    expect(cartLink).toContainElement(notice);
    expect(notice).toHaveClass('top-full');
  });

  it('syncs cart badge from nested API payload item_count', async () => {
    mockUseCartQuery.mockReturnValue({
      data: {
        data: {
          data: {
            items: [
              {
                id: 1,
                quantity: 3,
                unit_price: 179,
                line_total: 537,
                product: { id: 1, name: 'Poondu Thokku' },
                variant: null,
              },
            ],
            item_count: 3,
            subtotal: 537,
            discount_amount: 0,
            shipping_cost: null,
            tax_amount: null,
            grand_total: 537,
          },
        },
      },
      isLoading: false,
    });

    renderWithProviders(<AppLayout />);

    expect(mockSyncCartStateFromResponse).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        data: expect.objectContaining({
          item_count: 3,
        }),
      }),
    }));
  });

  it('shows Tamil navigation label when locale is Tamil', () => {
    localStorage.setItem('dhanvanthiri_locale', 'ta');
    renderWithProviders(<AppLayout />);
    expect(screen.getByText('தயாரிப்புகள்')).toBeInTheDocument();
  });

  it('has mobile hamburger button', () => {
    renderWithProviders(<AppLayout />);
    const menuButton = screen.getByLabelText(/toggle menu/i);
    expect(menuButton).toBeInTheDocument();
  });

  it('renders footer with brand info', () => {
    renderWithProviders(<AppLayout />);
    const allText = document.body.textContent ?? '';
    expect(allText).toContain('Traditional South Indian');
  });

  it('renders admin-managed branding and navigation when website settings are available', () => {
    mockUseWebsiteSettingsQuery.mockReturnValue({
      data: {
        website: {
          name: 'Admin Storefront',
          footerDescription: 'Managed from the Laravel admin footer settings.',
        },
        navigation: {
          primary: [
            { label: 'Catalog', href: '/products' },
            { label: 'Journal', href: '/blog' },
          ],
        },
        social: { links: [] },
      },
      isLoading: false,
    });

    renderWithProviders(<AppLayout />);

    expect(screen.getAllByText('Admin Storefront').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Catalog').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Journal').length).toBeGreaterThan(0);
    expect(screen.getByText('Managed from the Laravel admin footer settings.')).toBeInTheDocument();
  });

  it('footer has shop links', () => {
    renderWithProviders(<AppLayout />);
    const links = screen.getAllByRole('link');
    const shopLinks = links.filter((link) => {
      const href = link.getAttribute('href') ?? '';
      return href === '/products' || href === '/cart' || href === '/faq';
    });
    expect(shopLinks.length).toBeGreaterThanOrEqual(3);
  });
});
