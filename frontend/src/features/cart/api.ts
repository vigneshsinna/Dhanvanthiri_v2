import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { cartAdapter } from '@/lib/headless';
import { queryKeys } from '@/lib/query/keys';
import { store } from '@/app/store';
import { setCart, setCartToken } from './store/cartSlice';

export function syncCartStateFromResponse(res: any) {
  const cartPayload = res?.data?.data ?? res?.data ?? res;
  if (!cartPayload) {
    return;
  }

  const items = (cartPayload.items ?? []).map((item: any) => ({
    id: item.id,
    quantity: Number(item.quantity ?? 0),
    unitPrice: Number(item.unit_price ?? item.unitPrice ?? 0),
    lineTotal: Number(item.line_total ?? item.lineTotal ?? 0),
    product: item.product,
    variant: item.variant ?? null,
    isInStock: item.is_in_stock ?? item.isInStock ?? true,
  }));

  store.dispatch(setCart({
    items,
    coupon: cartPayload.coupon ?? null,
    subtotal: Number(cartPayload.subtotal ?? 0),
    discountAmount: Number(cartPayload.discount_amount ?? cartPayload.discountAmount ?? 0),
    shippingCost: cartPayload.shipping_cost ?? cartPayload.shippingCost ?? null,
    taxAmount: cartPayload.tax_amount ?? cartPayload.taxAmount ?? null,
    grandTotal: Number(cartPayload.grand_total ?? cartPayload.grandTotal ?? cartPayload.subtotal ?? 0),
    itemCount: Number(cartPayload.item_count ?? cartPayload.itemCount ?? items.reduce((sum: number, item: any) => sum + (item.quantity ?? 0), 0)),
  }));

  if (cartPayload.cart_token !== undefined) {
    store.dispatch(setCartToken(cartPayload.cart_token));
  }
}

export function useCartQuery() {
  return useQuery({
    queryKey: queryKeys.cart.current,
    queryFn: async () => {
      const res = await cartAdapter.getCart();
      syncCartStateFromResponse(res);
      return res;
    },
  });
}

export function useAddCartItemMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { product_id: number; variant_id?: number; variant?: string; quantity: number }) => {
      const res = await cartAdapter.addItem(payload);
      return res;
    },
    onSuccess: (res) => {
      syncCartStateFromResponse(res);
    },
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: queryKeys.cart.current });
    },
    onSettled: async () => {
      await qc.invalidateQueries({ queryKey: queryKeys.cart.current });
    },
  });
}

export function useUpdateCartItemMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ itemId, quantity }: { itemId: number; quantity: number }) => {
      const res = await cartAdapter.updateItem({ itemId, quantity });
      return res;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.cart.current }),
  });
}

export function useRemoveCartItemMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (itemId: number) => {
      const res = await cartAdapter.removeItem(itemId);
      return res;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.cart.current }),
  });
}

export function useClearCartMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await cartAdapter.clearCart();
      return res;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.cart.current }),
  });
}

export function useApplyCouponMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { code: string }) => {
      const res = await cartAdapter.applyCoupon(payload);
      return res;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.cart.current }),
  });
}

export function useRemoveCouponMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await cartAdapter.removeCoupon();
      return res;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.cart.current }),
  });
}

export function useShippingRatesQuery(addressId: number, state?: string) {
  const cartToken = store.getState().cart.cartToken ?? localStorage.getItem('cart_token') ?? '';

  return useQuery({
    queryKey: [...queryKeys.cart.shippingRates(addressId), state ?? '', cartToken],
    enabled: !!addressId || !!state || !!cartToken,
    queryFn: async () => {
      const res = await cartAdapter.shippingRates(addressId, state);
      return res;
    },
  });
}
