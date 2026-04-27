import { beforeEach, describe, it, expect, vi } from 'vitest';
import { renderWithProviders, screen } from '@/test/test-utils';
import { CatalogPage } from './CatalogPage';

const mockUseProductsQuery = vi.fn();
const apiProducts = [
  {
    id: 1,
    name: 'Admin Poondu Thokku',
    slug: 'admin-poondu-thokku',
    price: 179,
    primary_image_url: '/uploads/products/admin-poondu.png',
    short_description: 'Managed in admin',
    category: { name: 'Thokku', slug: 'thokku' },
    variants: [{ id: 10, name: '250g Jar', stock_quantity: 10 }],
  },
];
const apiCategories = [{ id: 1, name: 'Thokku', slug: 'thokku' }];

// Mock all API hooks
vi.mock('@/features/catalog/api', () => ({
  useProductsQuery: (filters: Record<string, unknown>) => mockUseProductsQuery(filters),
  useCategoriesQuery: () => ({ data: { data: apiCategories }, isLoading: false }),
}));

vi.mock('@/features/cart/api', () => ({
  useAddCartItemMutation: () => ({ mutate: vi.fn(), isLoading: false }),
}));

vi.mock('@/features/cms/api', () => ({
  useFaqsQuery: () => ({ data: null, isLoading: false }),
}));

vi.mock('react-helmet-async', () => ({
  Helmet: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  HelmetProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('CatalogPage', () => {
  beforeEach(() => {
    mockUseProductsQuery.mockReset();
    mockUseProductsQuery.mockReturnValue({ data: { data: apiProducts }, isLoading: false });
  });

  it('renders without crashing', () => {
    renderWithProviders(<CatalogPage />);
    expect(document.body.textContent).toBeTruthy();
  });

  it('displays product cards from backend data', () => {
    renderWithProviders(<CatalogPage />);
    expect(screen.getByText('Admin Poondu Thokku')).toBeInTheDocument();
  });

  it('shows category filter options', () => {
    renderWithProviders(<CatalogPage />);
    const allText = document.body.textContent ?? '';
    // Should have category names available
    expect(allText.toLowerCase()).toContain('thokku');
  });

  it('displays product prices with ₹ symbol', () => {
    renderWithProviders(<CatalogPage />);
    const allText = document.body.textContent ?? '';
    expect(allText).toContain('₹');
  });

  it('renders heading for product catalog', () => {
    renderWithProviders(<CatalogPage />);
    const headings = screen.getAllByRole('heading');
    expect(headings.length).toBeGreaterThan(0);
  });

  it('has clickable product links', () => {
    renderWithProviders(<CatalogPage />);
    const links = screen.getAllByRole('link');
    const productLinks = links.filter(l => {
      const href = l.getAttribute('href') ?? '';
      return href.startsWith('/products/');
    });
    expect(productLinks.length).toBeGreaterThan(0);
  });

  it('requests enough products to avoid truncating the catalog', () => {
    renderWithProviders(<CatalogPage />);

    expect(mockUseProductsQuery).toHaveBeenCalledWith(expect.objectContaining({ perPage: 100 }));
  });
});
