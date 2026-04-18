import { beforeEach, describe, expect, it, vi } from 'vitest';
import { checkoutAdapter } from './checkoutAdapter';
import { headlessApi } from './client';

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

const mockedGet = vi.mocked(headlessApi.get);
const mockedPost = vi.mocked(headlessApi.post);

describe('checkoutAdapter', () => {
  beforeEach(() => {
    mockedGet.mockReset();
    mockedPost.mockReset();
  });

  it('maps address resources to the fields expected by CheckoutPage', async () => {
    mockedGet.mockResolvedValue({
      data: {
        data: [
          {
            id: 7,
            address: '42 Temple Street',
            country_id: 101,
            state_id: 31,
            city_id: 4,
            country_name: 'India',
            state_name: 'Tamil Nadu',
            city_name: 'Chennai',
            postal_code: '600001',
            phone: '9876543210',
            set_default: 1,
          },
        ],
      },
    } as any);

    const response = await checkoutAdapter.getAddresses();

    expect(response.data.data[0]).toEqual(expect.objectContaining({
      id: 7,
      recipient_name: '',
      line_1: '42 Temple Street',
      city: 'Chennai',
      state: 'Tamil Nadu',
      postal_code: '600001',
      country_code: 'IN',
      is_default: true,
    }));
  });

  it('calls the storefront checkout summary bridge and keeps snake_case totals', async () => {
    mockedPost.mockResolvedValue({
      data: {
        success: true,
        data: {
          subtotal: 500,
          discount_amount: 0,
          shipping_cost: 60,
          tax_amount: 89.6,
          grand_total: 649.6,
        },
      },
    } as any);

    const response = await checkoutAdapter.checkoutSummary({ address_id: 1, shipping_method_id: 1 });

    expect(mockedPost).toHaveBeenCalledWith('/checkout/summary', {
      address_id: 1,
      shipping_method_id: 1,
    });
    expect(response.data).toEqual({
      subtotal: 500,
      discount_amount: 0,
      shipping_cost: 60,
      tax_amount: 89.6,
      grand_total: 649.6,
      _raw: {
        subtotal: 500,
        discount_amount: 0,
        shipping_cost: 60,
        tax_amount: 89.6,
        grand_total: 649.6,
      },
    });
  });

  it('creates Razorpay intents through the dedicated storefront payments endpoint', async () => {
    mockedPost.mockResolvedValue({
      data: {
        success: true,
        data: {
          order_id: 55,
          order_number: 'ORD-55',
          gateway: 'razorpay',
          razorpay_order_id: 'order_razor_123',
          razorpay_key_id: 'rzp_test_key',
          amount: 64960,
          currency: 'INR',
        },
      },
    } as any);

    const response = await checkoutAdapter.createPaymentIntent({
      gateway: 'razorpay',
      shipping_address_id: 7,
      shipping_method_id: 1,
      billing_same_as_shipping: true,
    });

    expect(mockedPost).toHaveBeenCalledWith('/payments/intent', {
      gateway: 'razorpay',
      shipping_address_id: 7,
      shipping_method_id: 1,
      billing_same_as_shipping: true,
    });
    expect(response.data).toEqual(expect.objectContaining({
      order_id: 55,
      order_number: 'ORD-55',
      razorpay_order_id: 'order_razor_123',
      razorpay_key_id: 'rzp_test_key',
      amount: 64960,
      currency: 'INR',
    }));
  });

  it('confirms payments through the storefront bridge instead of the legacy callback URL', async () => {
    mockedPost.mockResolvedValue({
      data: {
        success: true,
        data: {
          order_id: 55,
          status: 'confirmed',
          payment: {
            status: 'captured',
          },
        },
      },
    } as any);

    const response = await checkoutAdapter.confirmPayment({
      order_id: 55,
      gateway_payment_id: 'pay_123',
      gateway_order_id: 'order_123',
      signature: 'sig_123',
    });

    expect(mockedPost).toHaveBeenCalledWith('/payments/confirm', {
      order_id: 55,
      gateway_payment_id: 'pay_123',
      gateway_order_id: 'order_123',
      signature: 'sig_123',
    });
    expect(response.data).toEqual(expect.objectContaining({
      order_id: 55,
      status: 'confirmed',
      payment: { status: 'captured' },
    }));
  });
});
