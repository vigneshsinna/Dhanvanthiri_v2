import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { accountAdapter } from '@/lib/headless';

const wishlistKeys = {
  list: ['wishlist'] as const,
};

export function useWishlistQuery(enabled = true) {
  return useQuery({
    queryKey: wishlistKeys.list,
    enabled,
    queryFn: async () => {
      const res = await accountAdapter.getWishlist();
      return res;
    },
  });
}

export function useAddToWishlistMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { product_id: number; variant_id?: number | null; slug: string }) => {
      const res = await accountAdapter.addToWishlist(payload);
      return res;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: wishlistKeys.list }),
  });
}

export function useRemoveFromWishlistMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, slug }: { id: number; slug: string }) => {
      const res = await accountAdapter.removeFromWishlist(id, slug);
      return res;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: wishlistKeys.list }),
  });
}
