import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type CheckoutStep = 'address' | 'payment' | 'processing' | 'confirmation';
type PaymentGateway = 'razorpay' | 'phonepe' | string;

interface CheckoutState {
  step: CheckoutStep;
  shippingAddressId: number | null;
  billingAddressId: number | null;
  billingSameAsShipping: boolean;
  shippingMethodId: number | null;
  gateway: PaymentGateway;
  orderId: number | null;
  orderNumber: string | null;
  razorpayOrderId: string | null;
  guestCheckoutToken: string | null;
  guestOrderAccessToken: string | null;
  guestOrderAccessExpiresAt: string | null;
  isProcessing: boolean;
  error: string | null;
}

const initialState: CheckoutState = {
  step: 'address',
  shippingAddressId: null,
  billingAddressId: null,
  billingSameAsShipping: true,
  shippingMethodId: null,
  gateway: 'razorpay',
  orderId: null,
  orderNumber: null,
  razorpayOrderId: null,
  guestCheckoutToken: null,
  guestOrderAccessToken: null,
  guestOrderAccessExpiresAt: null,
  isProcessing: false,
  error: null,
};

const slice = createSlice({
  name: 'checkout',
  initialState,
  reducers: {
    setStep: (state, action: PayloadAction<CheckoutStep>) => {
      state.step = action.payload;
    },
    setCheckoutData: (state, action: PayloadAction<Partial<CheckoutState>>) => {
      Object.assign(state, action.payload);
    },
    resetCheckout: () => initialState,
  },
});

export const { setStep, setCheckoutData, resetCheckout } = slice.actions;
export default slice.reducer;
