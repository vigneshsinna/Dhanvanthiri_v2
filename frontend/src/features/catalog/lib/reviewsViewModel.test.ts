import { describe, expect, it } from 'vitest';
import { getProductReviewSnapshot, toReviewCollection } from '@/features/catalog/lib/reviewsViewModel';

describe('reviewsViewModel', () => {
  it('extracts reviews from the nested api response payload', () => {
    expect(toReviewCollection({
      data: {
        data: [
          { id: 1, rating: 5, body: 'Excellent', status: 'approved', created_at: '2026-03-09T10:00:00Z' },
        ],
        average_rating: 4.8,
        total: 1,
      },
    })).toEqual({
      reviews: [
        { id: 1, rating: 5, body: 'Excellent', status: 'approved', created_at: '2026-03-09T10:00:00Z' },
      ],
      averageRating: 4.8,
      total: 1,
    });
  });

  it('normalizes rating fields from either average_rating or avg_rating', () => {
    expect(getProductReviewSnapshot({ average_rating: 4.6, review_count: 12 })).toEqual({
      averageRating: 4.6,
      reviewCount: 12,
    });

    expect(getProductReviewSnapshot({ avg_rating: 4.2, review_count: 8 })).toEqual({
      averageRating: 4.2,
      reviewCount: 8,
    });
  });
});
