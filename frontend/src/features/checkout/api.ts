import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { store } from '@/app/store';
import { checkoutAdapter } from '@/lib/headless';
import { queryKeys } from '@/lib/query/keys';

export interface PaymentMethod {
  code: string;
  name: string;
  description: string;
  is_enabled: boolean;
  is_default: boolean;
  type: 'online' | 'offline';
}

type CheckoutState = ReturnType<typeof store.getState>;
type CartState = CheckoutState['cart'];

export interface CreatePaymentIntentPayload {
  gateway: string;
  shipping_address_id: number;
  shipping_method_id: number;
  billing_same_as_shipping: boolean;
  billing_address_id?: number;
  notes?: string;
}

export interface GuestCreatePaymentIntentPayload {
  gateway: string;
  guest_email: string;
  guest_phone: string;
  shipping_address: {
    recipient_name: string;
    phone: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postal_code: string;
    country_code: string;
  };
  shipping_method_id?: number;
}

export function usePaymentMethodsQuery() {
  return useQuery({
    queryKey: ['paymentMethods'],
    queryFn: async () => {
      const res = await checkoutAdapter.getPaymentMethods();
      return res;
    },
    staleTime: 60_000,
  });
}

export function useAddressesQuery() {
  return useQuery({
    queryKey: queryKeys.checkout.addresses,
    queryFn: async () => {
      const res = await checkoutAdapter.getAddresses();
      return res;
    },
  });
}

export function useCreateAddressMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      label?: string;
      recipient_name: string;
      phone: string;
      line1: string;
      line2?: string;
      city: string;
      state: string;
      postal_code: string;
      country_code: string;
      is_default?: boolean;
    }) => {
      const res = await checkoutAdapter.createAddress(payload);
      return res;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.checkout.addresses }),
  });
}

export function useCheckoutSummaryMutation() {
  return useMutation({
    mutationFn: async (payload: { address_id: number; shipping_method_id: number }) => {
      const res = await checkoutAdapter.checkoutSummary(payload);
      return res;
    },
  });
}

export function useValidateCheckoutMutation() {
  return useMutation({
    mutationFn: async (payload: { address_id: number; shipping_method_id: number }) => {
      const res = await checkoutAdapter.validateCheckout(payload);
      return res;
    },
  });
}

export function useCreatePaymentIntentMutation() {
  return useMutation({
    mutationFn: async (payload: CreatePaymentIntentPayload) => {
      const res = await checkoutAdapter.createPaymentIntent(payload);
      return res;
    },
  });
}

export function useConfirmPaymentMutation() {
  return useMutation({
    mutationFn: async (payload: {
      order_id: number;
      gateway_payment_id: string;
      gateway_order_id: string;
      signature: string;
      cart_token?: string;
    }) => {
      const res = await checkoutAdapter.confirmPayment(payload);
      return res;
    },
  });
}

export function useOrderPaymentQuery(orderId: number | null) {
  return useQuery({
    queryKey: ['payment', orderId],
    enabled: !!orderId,
    queryFn: async () => {
      const res = await checkoutAdapter.getOrderPayment(orderId!);
      return res;
    },
  });
}

// --- Guest Checkout APIs ---

export function useGuestValidateCheckoutMutation() {
  return useMutation({
    mutationFn: async (payload: {
      guest_email: string;
      guest_phone: string;
      recipient_name?: string;
      phone?: string;
      line1?: string;
      line2?: string;
      city?: string;
      state?: string;
      postal_code?: string;
      country_code?: string;
      shipping_method_id?: number;
    }) => {
      const res = await checkoutAdapter.guestValidateCheckout(payload);
      return res;
    },
  });
}

export function useGuestCheckoutSummaryMutation() {
  return useMutation({
    mutationFn: async (payload: { shipping_method_id?: number; state?: string }) => {
      const res = await checkoutAdapter.guestCheckoutSummary(payload);
      return res;
    },
  });
}

export function useGuestCreatePaymentIntentMutation() {
  return useMutation({
    mutationFn: async (payload: GuestCreatePaymentIntentPayload) => {
      const res = await checkoutAdapter.guestCreatePaymentIntent(payload);
      return res;
    },
  });
}

export function useGuestConfirmPaymentMutation() {
  return useMutation({
    mutationFn: async (payload: {
      order_id: number;
      gateway_payment_id: string;
      gateway_order_id: string;
      signature: string;
      cart_token?: string;
    }) => {
      const res = await checkoutAdapter.guestConfirmPayment(payload);
      return res;
    },
  });
}
