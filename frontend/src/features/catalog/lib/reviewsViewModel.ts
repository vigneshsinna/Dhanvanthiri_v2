export interface ReviewRecord {
  id: number;
  rating: number;
  body: string;
  status: string;
  created_at: string;
  title?: string;
  photos?: string[];
  user?: { name?: string };
  reviewer_name?: string;
  custom_reviewer_name?: string;
}

export function toReviewCollection(payload: {
  data?: {
    data?: ReviewRecord[];
    average_rating?: number | null;
    total?: number | null;
  };
} | null | undefined) {
  return {
    reviews: payload?.data?.data ?? [],
    averageRating: payload?.data?.average_rating ?? null,
    total: payload?.data?.total ?? 0,
  };
}

export function getProductReviewSnapshot(product: {
  average_rating?: number | null;
  avg_rating?: number | null;
  review_count?: number | null;
}) {
  return {
    averageRating: product.average_rating ?? product.avg_rating ?? null,
    reviewCount: product.review_count ?? 0,
  };
}
