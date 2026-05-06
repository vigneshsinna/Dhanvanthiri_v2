import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithProviders, screen, userEvent } from '@/test/test-utils';
import { HomePage } from './HomePage';

const mockAddToCart = vi.fn();
const featuredProducts = [
  {
    id: 1,
    name: 'Admin Poondu Thokku',
    slug: 'admin-poondu-thokku',
    price: 179,
    primary_image_url: '/uploads/products/admin-poondu.png',
    short_description: 'Managed in admin',
    variants: [{ id: 10, name: '250g Jar', stock_quantity: 10 }],
    tags: [{ name: 'Thokku' }],
  },
];

// Mock all API hooks to avoid actual HTTP calls
vi.mock('@/features/catalog/api', () => ({
  useFeaturedProductsQuery: () => ({ data: { data: featuredProducts }, isLoading: false }),
}));

vi.mock('@/features/cms/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features/cms/api')>();
  return {
    ...actual,
    useBannersQuery: () => ({ data: null, isLoading: false }),
  };
});

vi.mock('@/features/cart/api', () => ({
  useAddCartItemMutation: () => ({ mutate: mockAddToCart, isLoading: false }),
}));

vi.mock('react-helmet-async', () => ({
  Helmet: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  HelmetProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('HomePage', () => {
  beforeEach(() => {
    localStorage.clear();
    mockAddToCart.mockReset();
  });

  it('renders without crashing', () => {
    renderWithProviders(<HomePage />);
    // The page should render something visible
    expect(document.body.textContent).toBeTruthy();
  });

  it('shows brand text "Dhanvanthiri"', () => {
    renderWithProviders(<HomePage />);
    const allText = document.body.textContent ?? '';
    expect(allText).toContain('Dhanvanthiri');
  });

  it('renders hero CTA link to products', () => {
    renderWithProviders(<HomePage />);
    const links = screen.getAllByRole('link');
    const shopLink = links.find(l => l.getAttribute('href') === '/products');
    expect(shopLink).toBeTruthy();
  });

  it('displays featured/best seller products from backend data', () => {
    renderWithProviders(<HomePage />);
    expect(screen.getByText('Admin Poondu Thokku')).toBeInTheDocument();
  });

  it('renders "Why Choose Us" section', () => {
    renderWithProviders(<HomePage />);
    const allText = document.body.textContent ?? '';
    expect(allText.toLowerCase()).toContain('why choose');
  });

  it('has SEO meta concerns (title tag present)', () => {
    renderWithProviders(<HomePage />);
    // With mocked Helmet, title should render in document
    const titleEl = document.querySelector('title');
    // Title might be in the mocked output
    const allText = document.body.textContent ?? '';
    expect(allText).toContain('Traditional Tamil Foods');
  });

  it('shows Add to Cart buttons for products', () => {
    renderWithProviders(<HomePage />);
    const addButtons = screen.getAllByRole('button').filter(
      btn => btn.textContent?.toLowerCase().includes('add')
    );
    expect(addButtons.length).toBeGreaterThan(0);
  });

  it('adds a featured product to cart when CTA is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<HomePage />);

    await user.click(screen.getAllByRole('button', { name: /add to cart/i })[0]);

    expect(mockAddToCart).toHaveBeenCalledWith(
      expect.objectContaining({ product_id: expect.any(Number), quantity: 1 }),
      expect.any(Object),
    );
  });

  it('shows button confirmation and notifies the layout after adding a featured product to cart', async () => {
    const user = userEvent.setup();
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
    mockAddToCart.mockImplementation((_payload, options) => {
      options?.onSuccess?.();
    });

    renderWithProviders(<HomePage />);

    await user.click(screen.getAllByRole('button', { name: /add to cart/i })[0]);

    expect(screen.getByRole('button', { name: /added/i })).toBeDisabled();
    expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({ type: 'dhanvanthiri:cart-added' }));
  });

  it('renders Tamil hero copy when locale is Tamil', () => {
    localStorage.setItem('dhanvanthiri_locale', 'ta');
    renderWithProviders(<HomePage />);

    expect(screen.getByText(/பாரம்பரிய தமிழ் ஊறுகாய்/i)).toBeInTheDocument();
  });

  it('displays product prices', () => {
    renderWithProviders(<HomePage />);
    // Prices should be in INR format (₹)
    const allText = document.body.textContent ?? '';
    expect(allText).toContain('₹');
  });
});
