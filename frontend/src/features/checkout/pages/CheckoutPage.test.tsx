import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen } from '@/test/test-utils';
import { CheckoutPage } from './CheckoutPage';

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
  useGuestValidateCheckoutMutation: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useGuestCheckoutSummaryMutation: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useGuestCreatePaymentIntentMutation: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useGuestConfirmPaymentMutation: () => ({ mutateAsync: vi.fn(), isPending: false }),
  usePaymentMethodsQuery: () => ({
    data: {
      data: {
        data: [
          { code: 'razorpay', name: 'Razorpay', description: 'Pay securely', is_enabled: true },
        ],
      },
    },
    isLoading: false,
  }),
}));

vi.mock('@/features/cart/api', () => ({
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
});
