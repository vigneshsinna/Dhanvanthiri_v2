import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { accountAdapter } from '@/lib/headless';
import { queryKeys } from '@/lib/query/keys';

export function useOrdersQuery(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: queryKeys.orders.list(params),
    queryFn: async () => {
      const res = await accountAdapter.getOrders(params);
      return res;
    },
  });
}

export function useOrderQuery(orderNumber: string) {
  return useQuery({
    queryKey: queryKeys.orders.detail(orderNumber),
    enabled: !!orderNumber,
    queryFn: async () => {
      const res = await accountAdapter.getOrder(orderNumber);
      return res;
    },
  });
}

export function useOrderTrackingQuery(orderId: number) {
  return useQuery({
    queryKey: queryKeys.orders.tracking(orderId),
    enabled: !!orderId,
    queryFn: async () => {
      const res = await accountAdapter.getOrderTracking(orderId);
      return res;
    },
  });
}

export function useCancelOrderMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ orderId, reason }: { orderId: number; reason: string }) => {
      const res = await accountAdapter.cancelOrder({ orderId, reason });
      return res;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.orders.list() });
    },
  });
}

export function useReturnRequestMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ orderId, ...payload }: {
      orderId: number;
      reason: string;
      description?: string;
      refund_type?: 'original_payment' | 'store_credit' | 'exchange';
      items?: { order_item_id: number; quantity: number; reason: string; condition?: 'unopened' | 'like_new' | 'used' | 'damaged' }[];
    }) => {
      const res = await accountAdapter.returnRequest({ orderId, ...payload });
      return res;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.orders.list() });
    },
  });
}

export function useGuestOrderTrackingMutation() {
  return useMutation({
    mutationFn: async (payload: { order_number: string } & ({ email: string } | { phone: string } | { email: string; phone: string })) => {
      const res = await accountAdapter.guestOrderTracking(payload);
      return res;
    },
  });
}

export function useReOrderMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (orderId: number) => {
      const res = await accountAdapter.reOrder(orderId);
      return res;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cart'] });
    },
  });
}

export function useDownloadInvoiceMutation() {
  return useMutation({
    mutationFn: async (orderId: number) => {
      const res = await accountAdapter.downloadInvoice(orderId);
      // Trigger browser download
      const blob = res.data instanceof Blob ? res.data : new Blob([res.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${orderId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      return res;
    },
  });
}
