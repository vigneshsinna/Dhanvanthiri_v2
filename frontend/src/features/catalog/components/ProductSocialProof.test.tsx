import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen } from '@/test/test-utils';
import { FrequentlyBoughtTogether, ProductQASection } from './ProductSocialProof';

const useCrossSellsQueryMock = vi.fn();
const useProductQueriesQueryMock = vi.fn();

vi.mock('@/features/catalog/api', () => ({
  useProductQueriesQuery: () => useProductQueriesQueryMock(),
  useSubmitProductQueryMutation: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
  useCrossSellsQuery: () => useCrossSellsQueryMock(),
}));

vi.mock('@/features/cart/api', () => ({
  useAddCartItemMutation: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}));

describe('FrequentlyBoughtTogether', () => {
  beforeEach(() => {
    useCrossSellsQueryMock.mockReset();
    useProductQueriesQueryMock.mockReset();
    useProductQueriesQueryMock.mockReturnValue({
      data: { data: [] },
      isLoading: false,
    });
  });

  it('renders cross-sell items from nested API data', () => {
    useCrossSellsQueryMock.mockReturnValue({
      data: {
        data: {
          data: [
            {
              id: 11,
              name: 'Idly Podi',
              slug: 'idly-podi',
              price: 99,
              primary_image_url: '/images/idly-podi.jpg',
              variants: [{ id: 21, stock_quantity: 10 }],
            },
          ],
        },
      },
      isLoading: false,
    });

    renderWithProviders(<FrequentlyBoughtTogether productId={1} />);

    expect(screen.getByText('Frequently Bought Together')).toBeInTheDocument();
    expect(screen.getByText('Idly Podi')).toBeInTheDocument();
  });

  it('does not crash when cross-sell images are wrapped instead of plain arrays', () => {
    useCrossSellsQueryMock.mockReturnValue({
      data: {
        data: {
          data: [
            {
              id: 12,
              name: 'Paruppu Podi',
              slug: 'paruppu-podi',
              price: 99,
              images: {
                data: [
                  { path: '/images/paruppu-podi.jpg', is_primary: true },
                ],
              },
              variants: [{ id: 22, stock_quantity: 12 }],
            },
          ],
        },
      },
      isLoading: false,
    });

    renderWithProviders(<FrequentlyBoughtTogether productId={1} />);

    expect(screen.getByText('Paruppu Podi')).toBeInTheDocument();
  });

  it('renders answered product questions from the storefront API', () => {
    useProductQueriesQueryMock.mockReturnValue({
      data: {
        data: {
          data: [
            {
              id: 51,
              question: 'Is this spicy?',
              answer: 'It is medium spicy.',
              customer_name: 'Meena',
              answered_at: '2026-03-24',
            },
          ],
        },
      },
      isLoading: false,
    });

    renderWithProviders(<ProductQASection productId={1} />);

    expect(screen.getByText('Questions & Answers')).toBeInTheDocument();
    expect(screen.getByText(/is this spicy/i)).toBeInTheDocument();
  });
});
