import { describe, expect, it } from 'vitest';
import { buildProductsQueryParams } from './api';

describe('buildProductsQueryParams', () => {
  it('maps camelCase filters to snake_case and keeps all selected tags', () => {
    const params = buildProductsQueryParams({
      categoryId: 9,
      minPrice: 100,
      maxPrice: 250,
      sort: 'price_desc',
      page: 2,
      perPage: 24,
      tags: ['organic', 'pickle', 'mango'],
    });

    expect(params).toEqual({
      category_id: 9,
      min_price: 100,
      max_price: 250,
      sort: 'price_desc',
      page: 2,
      per_page: 24,
      tag: ['organic', 'pickle', 'mango'],
    });
  });

  it('omits empty tag arrays', () => {
    const params = buildProductsQueryParams({
      tags: [],
    });

    expect(params).not.toHaveProperty('tag');
  });
});
