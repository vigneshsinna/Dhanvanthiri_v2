import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { catalogAdapter } from '@/lib/headless';
import { queryKeys } from '@/lib/query/keys';

export type ProductQueryFilters = Record<string, unknown>;

export function buildProductsQueryParams(filters: ProductQueryFilters) {
  const params: Record<string, unknown> = {};

  if (filters.categoryId !== null && filters.categoryId !== undefined && filters.categoryId !== '') {
    params.categoryId = filters.categoryId;
  }
  if (filters.minPrice !== null && filters.minPrice !== undefined && filters.minPrice !== '') {
    params.minPrice = filters.minPrice;
  }
  if (filters.maxPrice !== null && filters.maxPrice !== undefined && filters.maxPrice !== '') {
    params.maxPrice = filters.maxPrice;
  }
  if (filters.sort) {
    params.sort = filters.sort;
  }
  if (filters.page) {
    params.page = filters.page;
  }
  if (filters.perPage) {
    params.perPage = filters.perPage;
  }
  if (Array.isArray(filters.tags) && filters.tags.length > 0) {
    params.tags = filters.tags;
  }
  if (filters.search) {
    params.search = filters.search;
  }

  return params;
}

export function useProductsQuery(filters: Record<string, unknown>) {
  const params = buildProductsQueryParams(filters);
  return useQuery({
    queryKey: queryKeys.catalog.products(params),
    queryFn: async () => {
      const res = await catalogAdapter.products(params);
      return res;
    },
  });
}

export function useProductQuery(slug: string) {
  return useQuery({
    queryKey: queryKeys.catalog.product(slug),
    enabled: !!slug,
    queryFn: async () => {
      const res = await catalogAdapter.product(slug);
      return res;
    },
  });
}

export function useCategoriesQuery() {
  return useQuery({
    queryKey: queryKeys.catalog.categories,
    queryFn: async () => {
      const res = await catalogAdapter.categories();
      return res;
    },
  });
}

export function useFeaturedProductsQuery() {
  return useQuery({
    queryKey: queryKeys.catalog.featured,
    queryFn: async () => {
      const res = await catalogAdapter.featured();
      return res;
    },
  });
}

export function useReviewsQuery(productId: number) {
  return useQuery({
    queryKey: queryKeys.catalog.reviews(productId),
    enabled: !!productId,
    queryFn: async () => {
      const res = await catalogAdapter.reviews(productId);
      return res;
    },
  });
}

export function useSubmitReviewMutation(productId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: FormData) => {
      const res = await catalogAdapter.submitReview(productId, payload);
      return res;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.catalog.reviews(productId) }),
  });
}

export function useRecommendationsQuery(params?: { product_id?: number; category_id?: number; limit?: number }) {
  return useQuery({
    queryKey: ['catalog', 'recommendations', params] as const,
    queryFn: async () => {
      const res = await catalogAdapter.recommendations(params);
      return res;
    },
  });
}

export function useProductQueriesQuery(productId: number) {
  return useQuery({
    queryKey: queryKeys.catalog.queries(productId),
    enabled: !!productId,
    queryFn: async () => {
      const res = await catalogAdapter.productQueries(productId);
      return res;
    },
  });
}

export function useSubmitProductQueryMutation(productId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { question: string; customer_name?: string; customer_email?: string }) => {
      const res = await catalogAdapter.submitProductQuery(productId, data);
      return res;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.catalog.queries(productId) }),
  });
}

export function useCrossSellsQuery(productId: number) {
  return useQuery({
    queryKey: queryKeys.catalog.crossSells(productId),
    enabled: !!productId,
    queryFn: async () => {
      const res = await catalogAdapter.crossSells(productId);
      return res;
    },
  });
}
