import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { cartAdapter } from '@/lib/headless';
import { queryKeys } from '@/lib/query/keys';
import { store } from '@/app/store';
import { setCart } from './store/cartSlice';

export function useCartQuery() {
  return useQuery({
    queryKey: queryKeys.cart.current,
    queryFn: async () => {
      const res = await cartAdapter.getCart();
      // Sync cart state to Redux
      store.dispatch(setCart(res.data as any));
      return res;
    },
  });
}

export function useAddCartItemMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { product_id: number; variant_id?: number; quantity: number }) => {
      const res = await cartAdapter.addItem(payload);
      return res;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.cart.current });
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
  return useQuery({
    queryKey: [...queryKeys.cart.shippingRates(addressId), state ?? ''],
    enabled: !!addressId || !!state,
    queryFn: async () => {
      const res = await cartAdapter.shippingRates(addressId, state);
      return res;
    },
  });
}
