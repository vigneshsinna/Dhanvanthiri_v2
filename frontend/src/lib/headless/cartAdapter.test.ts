import { beforeEach, describe, expect, it, vi } from 'vitest';
import { cartAdapter } from './cartAdapter';
import { headlessApi } from './client';
import { store } from '@/app/store';
import { clearCredentials, setCredentials } from '@/features/auth/store/authSlice';
import { setCartToken } from '@/features/cart/store/cartSlice';

vi.mock('./client', async () => {
  const actual = await vi.importActual<typeof import('./client')>('./client');
  return {
    ...actual,
    headlessApi: {
      get: vi.fn(),
      post: vi.fn(),
      delete: vi.fn(),
    },
  };
});

const mockedPost = vi.mocked(headlessApi.post);
const mockedDelete = vi.mocked(headlessApi.delete);

describe('cartAdapter', () => {
  beforeEach(() => {
    mockedPost.mockReset();
    mockedDelete.mockReset();
    localStorage.clear();
    store.dispatch(clearCredentials());
    store.dispatch(setCartToken(null));
  });

  it('stores the guest temp user id as the cart token after adding an item', async () => {
    mockedPost.mockResolvedValue({
      data: {
        success: true,
        message: 'Product added to cart successfully',
        data: {
          temp_user_id: 'guest-cart-123',
        },
      },
    } as any);

    await cartAdapter.addItem({ product_id: 1, quantity: 1 });

    expect(mockedPost).toHaveBeenCalledWith('/carts/add', {
      id: 1,
      variant: '',
      quantity: 1,
      cost_matrix: 'headless-storefront',
    });
    expect(store.getState().cart.cartToken).toBe('guest-cart-123');
    expect(localStorage.getItem('cart_token')).toBe('guest-cart-123');
  });

  it('includes the authenticated user id when loading cart data and preserves cart page fields', async () => {
    store.dispatch(setCredentials({
      accessToken: 'test-token',
      user: { id: 42, name: 'Lakshmi', email: 'lakshmi@example.com', role: 'customer' },
    }));

    mockedPost.mockImplementation(async (url: string, body?: unknown) => {
      if (url === '/carts') {
        expect(body).toEqual({ user_id: 42 });
        return {
          data: {
            success: true,
            data: {
              grand_total: 'Rs 500.00',
              data: [
                {
                  name: 'Inhouse',
                  owner_id: 1,
                  sub_total: 'Rs 250.00',
                  cart_items: [
                    {
                      id: 9,
                      status: 1,
                      owner_id: 1,
                      user_id: 42,
                      product_id: 5,
                      product_name: 'Poondu Thokku',
                      product_slug: 'poondu-thokku',
                      auction_product: 0,
                      product_thumbnail_image: '/uploads/poondu.png',
                      variation: '',
                      price: 'Rs 250.00',
                      currency_symbol: 'Rs',
                      tax: 'Rs 12.50',
                      shipping_cost: 40,
                      quantity: 2,
                      lower_limit: 1,
                      upper_limit: 10,
                      digital: 0,
                      stock: 10,
                    },
                  ],
                },
              ],
            },
          },
        } as any;
      }

      if (url === '/cart-summary') {
        expect(body).toEqual({ user_id: 42 });
        return {
          data: {
            success: true,
            data: {
              sub_total: 'Rs 500.00',
              tax: 'Rs 25.00',
              shipping_cost: 'Rs 40.00',
              discount: 'Rs 0.00',
              grand_total: 'Rs 565.00',
              grand_total_value: 565,
              coupon_code: '',
              coupon_applied: false,
            },
          },
        } as any;
      }

      throw new Error(`Unexpected POST ${url}`);
    });

    const response = await cartAdapter.getCart();

    expect(response.data.data.items[0]).toEqual(expect.objectContaining({
      unit_price: 250,
      line_total: 500,
      unitPrice: 250,
      lineTotal: 500,
      product: expect.objectContaining({
        id: 5,
        name: 'Poondu Thokku',
        slug: 'poondu-thokku',
        primary_image_url: '/uploads/poondu.png',
        primaryImageUrl: '/uploads/poondu.png',
      }),
    }));
    expect(response.data.data.grand_total).toBe(565);
  });

  it('uses the stored guest cart token for subsequent cart requests', async () => {
    store.dispatch(setCartToken('guest-cart-xyz'));

    mockedPost.mockImplementation(async (url: string, body?: unknown) => {
      expect(body).toEqual({ temp_user_id: 'guest-cart-xyz' });

      if (url === '/carts') {
        return { data: { data: [] } } as any;
      }

      if (url === '/cart-summary') {
        return {
          data: {
            sub_total: 'Rs 0.00',
            tax: 'Rs 0.00',
            shipping_cost: 'Rs 0.00',
            discount: 'Rs 0.00',
            grand_total: 'Rs 0.00',
            grand_total_value: 0,
            coupon_code: '',
            coupon_applied: false,
          },
        } as any;
      }

      throw new Error(`Unexpected POST ${url}`);
    });

    const response = await cartAdapter.getCart();

    expect(response.data.data.cart_token).toBe('guest-cart-xyz');
  });
});
