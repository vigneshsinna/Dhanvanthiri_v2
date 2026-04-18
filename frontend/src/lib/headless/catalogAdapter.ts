/**
 * Catalog Adapter
 * Maps new V2 product/category endpoints → old frontend catalog contract
 *
 * Old endpoints:                    New V2 endpoints:
 * GET /products                   → GET /products
 * GET /products/:slug             → GET /products/:slug/0
 * GET /categories                 → GET /categories/all
 * GET /products/featured          → GET /products/featured
 * GET /products/:id/reviews       → GET /reviews/product/:id
 * POST /products/:id/reviews      → (review submit — may not exist in V2)
 * GET /products/recommendations   → GET /products/best-seller (closest match)
 * GET /products/:id/queries       → (not in V2)
 * GET /products/:id/cross-sells   → (not in V2, use related products)
 */
import { headlessApi, parsePrice } from './client';

function plainTextExcerpt(html: string | undefined, limit = 180): string {
  const text = String(html ?? '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!text) {
    return '';
  }

  if (text.length <= limit) {
    return text;
  }

  return `${text.slice(0, limit).trimEnd()}...`;
}

interface V2ProductMini {
  id: number;
  slug: string;
  name: string;
  thumbnail_image: string;
  has_discount: boolean;
  discount: string;
  stroked_price: string;
  main_price: string;
  rating: number;
  review_count?: number;
  sales: number;
  is_wholesale: boolean;
  links: { details: string };
  variants?: any[];
}

interface V2ProductDetail {
  id: number;
  name: string;
  added_by: string;
  seller_id: number;
  shop_id: number;
  shop_slug: string;
  shop_name: string;
  shop_logo: string;
  photos: { variant: string; path: string }[];
  thumbnail_image: string;
  tags: string[];
  price_high_low: string;
  choice_options: { name: string; title: string; options: string[] }[];
  colors: string[];
  has_discount: boolean;
  discount: string;
  stroked_price: string;
  main_price: string;
  calculable_price: number;
  currency_symbol: string;
  current_stock: number;
  unit: string;
  rating: number;
  rating_count: number;
  earn_point: number;
  description: string;
  video_link: string;
  brand: { id: number; name: string; slug: string; logo: string } | null;
  link: string;
  slug?: string;
  short_description?: string;
  compare_at_price?: string | null;
  category_id?: number | null;
  variants?: any[];
}

interface V2Category {
  id: number;
  slug: string;
  name: string;
  banner: string;
  cover_image: string;
  icon: string;
  number_of_children: number;
  links: { products: string; sub_categories: string };
}

interface V2Review {
  id: number;
  user_id: number;
  user_name?: string;
  rating: number;
  comment: string;
  created_at: string;
}

function canonicalProductKey(product: Pick<V2ProductMini, 'slug' | 'name'>): string {
  const slug = String(product.slug || '')
    .trim()
    .toLowerCase()
    .replace(/-[0-9a-f]{8,}$/i, '');

  if (slug) {
    return slug;
  }

  return String(product.name || '').trim().toLowerCase();
}

function preferCanonicalProduct(current: V2ProductMini | undefined, candidate: V2ProductMini): V2ProductMini {
  if (!current) {
    return candidate;
  }

  const currentKey = canonicalProductKey(current);
  const candidateKey = canonicalProductKey(candidate);
  const currentIsCanonicalSlug = current.slug.toLowerCase() === currentKey;
  const candidateIsCanonicalSlug = candidate.slug.toLowerCase() === candidateKey;

  if (candidateIsCanonicalSlug && !currentIsCanonicalSlug) {
    return candidate;
  }

  if (candidateIsCanonicalSlug === currentIsCanonicalSlug && candidate.id < current.id) {
    return candidate;
  }

  return current;
}

// Normalize V2 product detail to match what old frontend pages expect
function normalizeProductDetail(v2: V2ProductDetail): any {
  return {
    data: {
      data: {
        // Spread raw V2 data first, then our explicit mappings override
        ...v2,
        id: v2.id,
        slug: v2.slug || v2.link?.split('/').pop() || '',
        name: v2.name,
        description: v2.description,
        short_description: v2.short_description ?? plainTextExcerpt(v2.description),
        price: parsePrice(v2.main_price),
        originalPrice: parsePrice(v2.stroked_price),
        compare_at_price: v2.compare_at_price ?? parsePrice(v2.stroked_price),
        hasDiscount: v2.has_discount,
        discount: v2.discount,
        mainPrice: v2.main_price,
        main_price: v2.main_price,
        strokedPrice: v2.stroked_price,
        stroked_price: v2.stroked_price,
        currencySymbol: v2.currency_symbol,
        currency_symbol: v2.currency_symbol,
        stock: v2.current_stock,
        current_stock: v2.current_stock,
        unit: v2.unit,
        rating: v2.rating,
        ratingCount: v2.rating_count,
        rating_count: v2.rating_count,
        images: v2.photos.map(p => ({ url: p.path, variant: p.variant })),
        photos: v2.photos,
        primary_image_url: v2.thumbnail_image,
        thumbnailUrl: v2.thumbnail_image,
        thumbnail_image: v2.thumbnail_image,
        tags: v2.tags,
        brand: v2.brand,
        category_id: v2.category_id ?? null,
        variants: v2.variants ?? [],
        seller: {
          id: v2.seller_id,
          shopId: v2.shop_id,
          shopSlug: v2.shop_slug,
          shopName: v2.shop_name,
          shopLogo: v2.shop_logo,
        },
        seller_id: v2.seller_id,
        shop_id: v2.shop_id,
        shop_name: v2.shop_name,
        choiceOptions: v2.choice_options,
        choice_options: v2.choice_options,
        colors: v2.colors,
        videoLink: v2.video_link,
        video_link: v2.video_link,
        has_discount: v2.has_discount,
      },
    },
  };
}

export const catalogAdapter: any = {
  async products(filters: Record<string, unknown> = {}) {
    const params: Record<string, unknown> = {};
    if (filters.categoryId) params.category_id = filters.categoryId;
    if (filters.minPrice) params.min_price = filters.minPrice;
    if (filters.maxPrice) params.max_price = filters.maxPrice;
    if (filters.sort) params.sort = filters.sort;
    if (filters.page) params.page = filters.page;
    if (filters.perPage) params.per_page = filters.perPage;
    if (filters.search) params.name = filters.search;

    const res = await headlessApi.get('/products', { params });
    const v2Data = res.data;
    const dedupedProducts: V2ProductMini[] = Array.isArray(v2Data.data)
      ? Array.from(
          v2Data.data.reduce((map: Map<string, V2ProductMini>, product: V2ProductMini) => {
            const key = canonicalProductKey(product);
            map.set(key, preferCanonicalProduct(map.get(key), product));
            return map;
          }, new Map<string, V2ProductMini>()).values()
        )
      : [];

    const items = dedupedProducts.map((product: V2ProductMini) => ({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: parsePrice(product.main_price),
      compare_at_price: product.has_discount ? parsePrice(product.stroked_price) : undefined,
      primary_image_url: product.thumbnail_image,
      thumbnail_image: product.thumbnail_image,
      short_description: '',
      avg_rating: product.rating,
      review_count: product.review_count ?? 0,
      has_discount: product.has_discount,
      discount: product.discount,
      main_price: product.main_price,
      stroked_price: product.stroked_price,
      sales: product.sales,
      is_wholesale: product.is_wholesale,
      variants: product.variants || [],
    }));

    return {
      data: {
        data: items,
        meta: v2Data.meta || {
          current_page: 1,
          last_page: 1,
          per_page: 20,
          total: items.length,
        },
      },
    };
  },

  async product(slug: string) {
    // V2 endpoint: /products/:slug/:userId  (userId=0 for guests)
    const res = await headlessApi.get(`/products/${slug}/0`);
    const v2Data = res.data;

    // V2 returns array in data field
    const detail = Array.isArray(v2Data.data) ? v2Data.data[0] : v2Data.data;
    if (!detail) {
      throw new Error('Product not found');
    }

    return normalizeProductDetail(detail);
  },

  async categories() {
    const res = await headlessApi.get('/categories');
    return {
      data: {
        items: res.data.data || [],
      },
    };
  },

  async featured() {
    const res = await headlessApi.get('/products/featured');
    const v2Items: V2ProductMini[] = Array.isArray(res.data.data) ? res.data.data : [];

    // Deduplicate (same logic as products())
    const deduped = Array.from(
      v2Items.reduce((map: Map<string, V2ProductMini>, product: V2ProductMini) => {
        const key = canonicalProductKey(product);
        map.set(key, preferCanonicalProduct(map.get(key), product));
        return map;
      }, new Map<string, V2ProductMini>()).values()
    );

    // Map V2 product mini → frontend Product interface
    const mapped = deduped.map((p: V2ProductMini) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: parsePrice(p.main_price),
      compare_at_price: p.has_discount ? parsePrice(p.stroked_price) : undefined,
      primary_image_url: p.thumbnail_image,
      thumbnail_image: p.thumbnail_image,
      short_description: '',
      avg_rating: p.rating,
      review_count: p.review_count ?? 0,
      has_discount: p.has_discount,
      discount: p.discount,
      main_price: p.main_price,
      stroked_price: p.stroked_price,
      sales: p.sales,
      is_wholesale: p.is_wholesale,
      // Use actual variants from backend if available
      variants: p.variants || [],
    }));

    return {
      data: {
        data: mapped,
      },
    };
  },

  async reviews(productId: number) {
    const res = await headlessApi.get(`/reviews/product/${productId}`);
    const items = res.data.data || [];
    return {
      data: {
        data: items,
        average_rating: items.length > 0
          ? items.reduce((sum: number, r: any) => sum + (r.rating || 0), 0) / items.length
          : null,
        total: items.length,
      },
    };
  },

  async submitReview(productId: number, payload: FormData) {
    // V2 may have review submit at a different endpoint
    // Try the common pattern
    payload.append('product_id', String(productId));
    const res = await headlessApi.post('/reviews/submit', payload, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return { data: res.data };
  },

  async recommendations(params?: { product_id?: number; category_id?: number; limit?: number }) {
    // V2 doesn't have a recommendations endpoint, use best-seller as fallback
    const res = await headlessApi.get('/products/best-seller');
    return {
      data: {
        items: res.data.data || [],
      },
    };
  },

  async productQueries(productId: number) {
    try {
      const res = await headlessApi.get(`/product-queries/${productId}`);
      return {
        data: {
          items: res.data.data || [],
        },
      };
    } catch {
      return { data: { items: [] } };
    }
  },

  async submitProductQuery(productId: number, data: { question: string }) {
    const res = await headlessApi.post(`/product-queries`, {
      product_id: productId,
      question: data.question,
    });
    return { data: res.data };
  },

  async crossSells(productId: number) {
    try {
      const res = await headlessApi.get(`/products/${productId}/related`);
      return {
        data: {
          items: (res.data.data || []).slice(0, 4),
        },
      };
    } catch {
      // Fallback to best-seller if related endpoint doesn't exist
      const res = await headlessApi.get('/products/best-seller');
      return {
        data: {
          items: (res.data.data || []).slice(0, 4),
        },
      };
    }
  },

  async productsByCategory(categorySlug: string, params?: Record<string, unknown>) {
    const res = await headlessApi.get(`/products/category/${categorySlug}`, { params });
    return {
      data: {
        items: res.data.data || [],
        meta: res.data.meta,
      },
    };
  },

  async search(params: Record<string, unknown>) {
    const res = await headlessApi.get('/products/search', { params });
    return {
      data: {
        items: res.data.data || [],
        meta: res.data.meta,
      },
    };
  },

  async addToWishlist(productSlug: string) {
    const res = await headlessApi.post(`/wishlists-add-product/${productSlug}`);
    return { data: res.data };
  },

  async removeFromWishlist(productSlug: string) {
    const res = await headlessApi.delete(`/wishlists-remove-product/${productSlug}`);
    return { data: res.data };
  },

  async checkWishlistStatus(productSlug: string) {
    const res = await headlessApi.get(`/wishlists-check-product/${productSlug}`);
    return { data: res.data };
  },

  async wishlist() {
    const res = await headlessApi.get('/wishlists');
    return { data: res.data };
  },
};
