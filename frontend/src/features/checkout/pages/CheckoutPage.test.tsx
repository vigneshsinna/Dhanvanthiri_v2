import userEvent from '@testing-library/user-event';
import { fireEvent } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen } from '@/test/test-utils';
import { CheckoutPage } from './CheckoutPage';

const guestValidateMutateAsync = vi.fn();
let cartQueryState = {
  data: null as any,
  isLoading: false,
  isFetching: false,
};

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

vi.mock('@/features/checkout/api', () => ({
  useAddressesQuery: () => ({
    data: {
      data: {
        data: [
          {
            id: 1,
            recipient_name: 'Lakshmi',
            phone: '9876543210',
            line_1: '12 Temple Street',
            city: 'Chennai',
            state: 'Tamil Nadu',
            postal_code: '600001',
            country_code: 'IN',
            is_default: true,
          },
        ],
      },
    },
    isLoading: false,
  }),
  useCreateAddressMutation: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useCheckoutSummaryMutation: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useCreatePaymentIntentMutation: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useConfirmPaymentMutation: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useGuestValidateCheckoutMutation: () => ({ mutateAsync: guestValidateMutateAsync, isPending: false }),
  useGuestCheckoutSummaryMutation: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useGuestCreatePaymentIntentMutation: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useGuestConfirmPaymentMutation: () => ({ mutateAsync: vi.fn(), isPending: false }),
  usePaymentMethodsQuery: () => ({
    data: {
      data: {
        data: [
          { code: 'razorpay', name: 'Razorpay', description: 'Pay securely', is_enabled: true },
          { code: 'phonepe', name: 'PhonePe', description: 'Pay with PhonePe', is_enabled: true },
          { code: 'cash_on_delivery', name: 'Cash on Delivery', description: 'Pay later', is_enabled: true },
        ],
      },
    },
    isLoading: false,
  }),
}));

vi.mock('@/features/cart/api', () => ({
  useCartQuery: () => cartQueryState,
  useShippingRatesQuery: () => ({
    data: {
      data: {
        data: [
          {
            id: 10,
            name: 'Standard Shipping',
            cost: 60,
            estimated_days_min: 2,
            estimated_days_max: 4,
          },
        ],
      },
    },
    isLoading: false,
  }),
}));

describe('CheckoutPage', () => {
  beforeEach(() => {
    guestValidateMutateAsync.mockReset();
    cartQueryState = { data: null, isLoading: false, isFetching: false };
  });

  it('renders without crashing when checkout collections are wrapped in nested data payloads', () => {
    renderWithProviders(<CheckoutPage />, {
      preloadedState: {
        auth: {
          isAuthenticated: true,
          accessToken: 'token',
          user: { id: 7, name: 'Lakshmi', email: 'lakshmi@example.com', role: 'customer' },
        },
        cart: {
          items: [],
          coupon: null,
          subtotal: 399,
          discountAmount: 0,
          shippingCost: 60,
          taxAmount: 0,
          grandTotal: 459,
          itemCount: 1,
          cartToken: null,
        },
        checkout: {
          step: 'address',
          shippingAddressId: 1,
          billingAddressId: null,
          shippingMethodId: 10,
          billingSameAsShipping: true,
          gateway: 'razorpay',
          orderId: null,
          orderNumber: null,
          razorpayOrderId: null,
          guestCheckoutToken: null,
          guestOrderAccessToken: null,
          guestOrderAccessExpiresAt: null,
          isProcessing: false,
          error: null,
        },
      },
    });

    expect(screen.getByText(/shipping address/i)).toBeInTheDocument();
    expect(screen.getByText(/lakshmi/i)).toBeInTheDocument();
  });

  it('shows backend guest checkout validation field errors instead of a generic message', async () => {
    const user = userEvent.setup();
    guestValidateMutateAsync.mockRejectedValueOnce({
      response: {
        data: {
          message: 'Validation failed',
          errors: {
            temp_user_id: ['A guest cart is required before checkout can continue.'],
          },
        },
      },
    });

    renderWithProviders(<CheckoutPage />, {
      preloadedState: {
        auth: {
          isAuthenticated: false,
          accessToken: null,
          user: null,
        },
        cart: {
          items: [],
          coupon: null,
          subtotal: 179,
          discountAmount: 0,
          shippingCost: 0,
          taxAmount: 0,
          grandTotal: 179,
          itemCount: 1,
          cartToken: null,
        },
        checkout: {
          step: 'address',
          shippingAddressId: null,
          billingAddressId: null,
          shippingMethodId: 1,
          billingSameAsShipping: true,
          gateway: 'razorpay',
          orderId: null,
          orderNumber: null,
          razorpayOrderId: null,
          guestCheckoutToken: null,
          guestOrderAccessToken: null,
          guestOrderAccessExpiresAt: null,
          isProcessing: false,
          error: null,
        },
      },
    });

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'buyer@example.com' } });
    fireEvent.change(screen.getByLabelText(/^phone$/i), { target: { value: '9876543210' } });
    fireEvent.change(screen.getByLabelText(/recipient name/i), { target: { value: 'Buyer' } });
    fireEvent.change(screen.getByLabelText(/address line 1/i), { target: { value: '42 Temple Street' } });
    fireEvent.change(screen.getByLabelText(/city/i), { target: { value: 'Chennai' } });
    fireEvent.change(screen.getByLabelText(/state/i), { target: { value: 'Tamil Nadu' } });
    fireEvent.change(screen.getByLabelText(/postal code/i), { target: { value: '600001' } });
    await user.click(screen.getByRole('button', { name: /continue to payment/i }));

    expect(await screen.findByText(/guest cart is required before checkout can continue/i)).toBeInTheDocument();
    expect(screen.queryByText(/^validation failed$/i)).not.toBeInTheDocument();
  });

  it('filters checkout payment methods to Razorpay and PhonePe only', async () => {
    renderWithProviders(<CheckoutPage />, {
      preloadedState: {
        auth: {
          isAuthenticated: false,
          accessToken: null,
          user: null,
        },
        cart: {
          items: [],
          coupon: null,
          subtotal: 179,
          discountAmount: 0,
          shippingCost: 0,
          taxAmount: 0,
          grandTotal: 179,
          itemCount: 1,
          cartToken: 'guest-cart-token',
        },
        checkout: {
          step: 'payment',
          shippingAddressId: null,
          billingAddressId: null,
          shippingMethodId: 1,
          billingSameAsShipping: true,
          gateway: 'razorpay',
          orderId: null,
          orderNumber: null,
          razorpayOrderId: null,
          guestCheckoutToken: 'guest-checkout-token',
          guestOrderAccessToken: null,
          guestOrderAccessExpiresAt: null,
          isProcessing: false,
          error: null,
        },
      },
    });

    expect((await screen.findAllByText(/razorpay/i)).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/phonepe/i).length).toBeGreaterThan(0);
    expect(screen.queryByText(/cash on delivery/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/\bcod\b/i)).not.toBeInTheDocument();
  });

  it('waits for persisted guest cart rehydration before showing the empty cart state', () => {
    cartQueryState = { data: null, isLoading: true, isFetching: true };

    renderWithProviders(<CheckoutPage />, {
      preloadedState: {
        auth: {
          isAuthenticated: false,
          accessToken: null,
          user: null,
        },
        cart: {
          items: [],
          coupon: null,
          subtotal: 0,
          discountAmount: 0,
          shippingCost: null,
          taxAmount: null,
          grandTotal: 0,
          itemCount: 0,
          cartToken: 'persisted-guest-token',
        },
        checkout: {
          step: 'address',
          shippingAddressId: null,
          billingAddressId: null,
          shippingMethodId: null,
          billingSameAsShipping: true,
          gateway: 'razorpay',
          orderId: null,
          orderNumber: null,
          razorpayOrderId: null,
          guestCheckoutToken: null,
          guestOrderAccessToken: null,
          guestOrderAccessExpiresAt: null,
          isProcessing: false,
          error: null,
        },
      },
    });

    expect(screen.queryByText(/your cart is empty/i)).not.toBeInTheDocument();
  });
});
