import { beforeEach, describe, expect, it, vi } from 'vitest';
import { catalogAdapter } from './catalogAdapter';
import { headlessApi } from './client';

vi.mock('./client', async () => {
  const actual = await vi.importActual<typeof import('./client')>('./client');
  return {
    ...actual,
    headlessApi: {
      get: vi.fn(),
      post: vi.fn(),
    },
  };
});

const mockedGet = vi.mocked(headlessApi.get);

describe('catalogAdapter', () => {
  beforeEach(() => {
    mockedGet.mockReset();
  });

  it('maps V2 product collection thumbnails to primary_image_url', async () => {
    mockedGet.mockResolvedValue({
      data: {
        data: [
          {
            id: 1,
            slug: 'poondu-thokku',
            name: 'Poondu Thokku',
            thumbnail_image: '/uploads/products/poondu.png',
            has_discount: false,
            discount: '-0%',
            stroked_price: 'Rs 250.00',
            main_price: 'Rs 250.00',
            rating: 4.8,
            review_count: 8,
            sales: 20,
            is_wholesale: false,
            links: { details: '/products/1' },
          },
        ],
      },
    } as any);

    const response = await catalogAdapter.products();

    expect(response.data.data).toEqual([
      expect.objectContaining({
        id: 1,
        slug: 'poondu-thokku',
        name: 'Poondu Thokku',
        primary_image_url: '/uploads/products/poondu.png',
        thumbnail_image: '/uploads/products/poondu.png',
      }),
    ]);
  });

  it('dedupes generated duplicate products onto the canonical slug entry', async () => {
    mockedGet.mockResolvedValue({
      data: {
        data: [
          {
            id: 38,
            slug: 'poondu-thokku-69dd34720504c',
            name: 'Poondu Thokku',
            thumbnail_image: '/uploads/products/placeholder.png',
            has_discount: false,
            discount: '-0%',
            stroked_price: 'Rs 250.00',
            main_price: 'Rs 250.00',
            rating: 0,
            review_count: 0,
            sales: 10,
            is_wholesale: false,
            links: { details: '/products/38' },
          },
          {
            id: 36,
            slug: 'poondu-thokku',
            name: 'Poondu Thokku',
            thumbnail_image: '/uploads/products/placeholder.png',
            has_discount: false,
            discount: '-0%',
            stroked_price: 'Rs 249.00',
            main_price: 'Rs 249.00',
            rating: 0,
            review_count: 0,
            sales: 0,
            is_wholesale: false,
            links: { details: '/products/36' },
          },
          {
            id: 1,
            slug: 'poondu-thokku',
            name: 'Poondu Thokku',
            thumbnail_image: '/uploads/products/poondu.png',
            has_discount: true,
            discount: '-26%',
            stroked_price: 'Rs 179.00',
            main_price: 'Rs 133.00',
            rating: 4.7,
            review_count: 33,
            sales: 20,
            is_wholesale: false,
            links: { details: '/products/1' },
          },
        ],
      },
    } as any);

    const response = await catalogAdapter.products();

    expect(response.data.data).toHaveLength(1);
    expect(response.data.data[0]).toEqual(
      expect.objectContaining({
        id: 1,
        slug: 'poondu-thokku',
        name: 'Poondu Thokku',
        primary_image_url: '/uploads/products/poondu.png',
      })
    );
  });
});
