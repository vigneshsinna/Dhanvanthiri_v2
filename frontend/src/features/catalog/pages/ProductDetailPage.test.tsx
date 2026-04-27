import { beforeEach, describe, it, expect, vi } from 'vitest';
import { renderWithProviders, screen } from '@/test/test-utils';
import { ProductDetailPage } from './ProductDetailPage';

const useProductQueryMock = vi.fn();
const useReviewsQueryMock = vi.fn();
const apiProduct = {
  id: 1,
  name: 'Poondu Thokku',
  slug: 'poondu-thokku',
  price: 179,
  description: '<p>Whole garlic cloves.</p>',
  about: '<p>Garlic forward admin description.</p>',
  primary_image_url: '/uploads/products/poondu.png',
  images: [],
  variants: [{ id: 10, name: '250g Jar', sku: 'PON-250', price_override: null, stock_quantity: 10 }],
  tags: [{ name: 'Thokku' }],
  avg_rating: 4.7,
  review_count: 12,
};

// Mock useParams to return a known slug
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ slug: 'poondu-thokku' }),
  };
});

vi.mock('@/features/catalog/api', () => ({
  useProductQuery: () => useProductQueryMock(),
  useReviewsQuery: () => ({
    data: useReviewsQueryMock(),
    isLoading: false,
  }),
  useSubmitReviewMutation: () => ({
    mutateAsync: vi.fn(),
    isLoading: false,
  }),
  useRecommendationsQuery: () => ({
    data: { data: [] },
    isLoading: false,
    error: null,
  }),
  useProductQueriesQuery: () => ({
    data: { data: [] },
    isLoading: false,
  }),
  useCrossSellsQuery: () => ({
    data: { data: [] },
    isLoading: false,
  }),
  useSubmitProductQueryMutation: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}));

vi.mock('@/features/cart/api', () => ({
  useAddCartItemMutation: () => ({
    mutate: vi.fn(),
    isLoading: false,
  }),
}));

vi.mock('@/features/wishlist/api', () => ({
  useWishlistQuery: () => ({
    data: {
      data: {
        data: [],
      },
    },
    isLoading: false,
  }),
  useAddToWishlistMutation: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
  useRemoveFromWishlistMutation: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}));

vi.mock('react-helmet-async', () => ({
  Helmet: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  HelmetProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('ProductDetailPage', () => {
  beforeEach(() => {
    useProductQueryMock.mockReset();
    useProductQueryMock.mockReturnValue({
      data: { data: { data: apiProduct } },
      isLoading: false,
      error: null,
    });
    useReviewsQueryMock.mockReset();
    useReviewsQueryMock.mockReturnValue(null);
  });

  it('renders product from backend data', () => {
    renderWithProviders(<ProductDetailPage />);
    const matches = screen.getAllByText(/poondu thokku/i);
    expect(matches.length).toBeGreaterThan(0);
  });

  it('displays product price', () => {
    renderWithProviders(<ProductDetailPage />);
    const allText = document.body.textContent ?? '';
    expect(allText).toContain('₹179');
  });

  it('shows Add to Cart button', () => {
    renderWithProviders(<ProductDetailPage />);
    const addButton = screen.getAllByRole('button').find(
      btn => btn.textContent?.toLowerCase().includes('add to cart')
    );
    expect(addButton).toBeTruthy();
  });

  it('shows product description', () => {
    renderWithProviders(<ProductDetailPage />);
    const allText = document.body.textContent ?? '';
    expect(allText.toLowerCase()).toContain('garlic');
  });

  it('has breadcrumb navigation', () => {
    renderWithProviders(<ProductDetailPage />);
    const links = screen.getAllByRole('link');
    const productsLink = links.find(l => l.getAttribute('href') === '/products');
    expect(productsLink).toBeTruthy();
  });

  it('shows product rating', () => {
    renderWithProviders(<ProductDetailPage />);
    const allText = document.body.textContent ?? '';
    expect(allText).toContain('4.7');
  });

  it('renders without crashing when wishlist data is nested under wrapped data collections', () => {
    renderWithProviders(<ProductDetailPage />);
    expect(screen.getAllByText(/poondu thokku/i).length).toBeGreaterThan(0);
  });

  it('shows custom reviewer names from storefront review data', () => {
    useReviewsQueryMock.mockReturnValue({
      data: {
        data: [
          {
            id: 101,
            rating: 5,
            title: 'Excellent',
            body: 'Official product review.',
            status: 'approved',
            created_at: '2026-03-20T00:00:00.000000Z',
            custom_reviewer_name: 'Official Kitchen Review',
            reviewer_name: 'Official Kitchen Review',
          },
        ],
        average_rating: 5,
        total: 1,
      },
    });

    renderWithProviders(<ProductDetailPage />);

    expect(screen.getByText(/official kitchen review/i)).toBeInTheDocument();
    expect(screen.getByText(/official product review/i)).toBeInTheDocument();
  });

  it('does not replace backend placeholder images with local product images', () => {
    useProductQueryMock.mockReturnValue({
      data: {
        data: {
          data: {
            id: 1,
            name: 'Poondu Thokku',
            slug: 'poondu-thokku',
            price: 179,
            description: '<p>Whole garlic cloves.</p>',
            primary_image_url: 'http://localhost:8000/assets/img/placeholder.jpg',
            images: [
              {
                id: 1,
                url: 'http://localhost:8000/assets/img/placeholder.jpg',
                sort_order: 0,
              },
            ],
            variants: [],
            tags: [],
          },
        },
      },
      isLoading: false,
      error: null,
    });

    renderWithProviders(<ProductDetailPage />);

    expect(screen.queryByAltText(/poondu thokku/i)).not.toBeInTheDocument();
    expect(document.body.textContent).toContain('Poondu Thokku');
  });
});
