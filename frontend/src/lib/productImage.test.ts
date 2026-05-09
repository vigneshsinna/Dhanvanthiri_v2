import { describe, expect, it } from 'vitest';
import {
  isPlaceholderProductImage,
  resolveProductImageGallery,
  resolveProductImageUrl,
} from './productImage';

describe('productImage', () => {
  it('returns a non-placeholder image unchanged', () => {
    expect(
      resolveProductImageUrl({
        primaryImageUrl: 'http://localhost:8000/uploads/products/poondu.png',
        productName: 'Poondu Thokku',
        productSlug: 'poondu-thokku',
        productId: 1,
      }),
    ).toBe('http://localhost:8000/uploads/products/poondu.png');
  });

  it('resolves relative image paths against the API origin', () => {
    expect(
      resolveProductImageUrl({
        primaryImageUrl: '/uploads/products/poondu.png',
        apiOrigin: 'http://localhost:8000',
        productName: 'Poondu Thokku',
        productSlug: 'poondu-thokku',
        productId: 1,
      }),
    ).toBe('http://localhost:8000/uploads/products/poondu.png');
  });

  it('does not replace backend placeholders with local storefront product images', () => {
    expect(
      resolveProductImageUrl({
        primaryImageUrl: 'http://localhost:8000/assets/img/placeholder.jpg',
        productName: 'Poondu Thokku',
        productSlug: 'poondu-thokku',
        productId: 1,
      }),
    ).toBeUndefined();
  });

  it('filters placeholder gallery items and keeps usable image URLs', () => {
    expect(
      resolveProductImageGallery({
        primaryImageUrl: 'http://localhost:8000/assets/img/placeholder.jpg',
        imagePaths: [
          'http://localhost:8000/assets/img/placeholder.jpg',
          '/uploads/products/poondu-side.png',
        ],
        apiOrigin: 'http://localhost:8000',
        productName: 'Poondu Thokku',
        productSlug: 'poondu-thokku',
        productId: 1,
      }),
    ).toEqual(['http://localhost:8000/uploads/products/poondu-side.png']);
  });

  it('recognizes backend placeholder assets', () => {
    expect(isPlaceholderProductImage('http://localhost:8000/assets/img/placeholder.jpg')).toBe(true);
    expect(isPlaceholderProductImage('http://localhost:8000/uploads/products/poondu.png')).toBe(false);
  });

  it('rejects upload directory URLs without a file name', () => {
    expect(resolveProductImageUrl({ primaryImageUrl: 'https://dhanvanthrifoods.com/public/uploads/all' })).toBeUndefined();
    expect(resolveProductImageUrl({ primaryImageUrl: 'https://dhanvanthrifoods.com/core/public/uploads/all/' })).toBeUndefined();
    expect(resolveProductImageUrl({ primaryImageUrl: '/public/uploads/all' })).toBeUndefined();
    expect(resolveProductImageUrl({ primaryImageUrl: '/public/uploads/all/legacy-storefront/garlic_thokku.png' })).toBe(
      '/public/uploads/all/legacy-storefront/garlic_thokku.png',
    );
  });
});
