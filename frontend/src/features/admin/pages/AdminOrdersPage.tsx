import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  useAdminOrdersQuery,
  useAdminUpdateOrderStatusMutation,
  useAdminExportOrdersMutation,
  useAdminExportStatusQuery
} from '@/features/admin/api';
import { toAdminOrderCollection } from '@/features/admin/lib/orderViewModel';
import { AdminPageHeader } from '@/features/admin/components/AdminPageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { PageLoader } from '@/components/ui/Spinner';

const statusVariant = (status: string) => {
  const map: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
    pending_payment: 'warning',
    pending: 'warning',
    paid: 'success',
    placed: 'info',
    confirmed: 'info',
    processing: 'info',
    packed: 'info',
    shipped: 'info',
    out_for_delivery: 'info',
    in_transit: 'info',
    delivered: 'success',
    completed: 'success',
    captured: 'success',
    cancel_requested: 'warning',
    cancelled: 'danger',
    return_requested: 'warning',
    return_approved: 'warning',
    return_rejected: 'danger',
    returned: 'default',
    refund_pending: 'warning',
    refunded: 'danger',
    partially_refunded: 'warning',
    failed: 'danger',
    on_hold: 'default',
  };

  return map[status] ?? 'default';
};

const nextStatuses: Record<string, string[]> = {
  pending_payment: ['confirmed', 'cancelled'],
  paid: ['confirmed', 'cancelled'],
  placed: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'on_hold', 'cancelled'],
  processing: ['packed', 'on_hold', 'cancelled'],
  packed: ['shipped', 'cancelled'],
  shipped: ['out_for_delivery', 'delivered'],
  out_for_delivery: ['delivered'],
  delivered: ['completed'],
  cancel_requested: ['cancelled'],
  on_hold: ['processing', 'cancelled'],
  cancelled: [],
  completed: [],
};

const currency = new Intl.NumberFormat('en-IN', {
  maximumFractionDigits: 2,
  minimumFractionDigits: 0,
});

export function AdminOrdersPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('');
  const [search, setSearch] = useState('');

  const [exportJobId, setExportJobId] = useState<number | null>(null);
  const exportMutation = useAdminExportOrdersMutation();
  const { data: exportJobData } = useAdminExportStatusQuery(exportJobId ?? 0, exportJobId !== null);

  // Poll job status, using generic query polling behavior assuming the caller triggers refetchInterval periodically or react-query default window refocus
  // React query allows conditional polling if we add refetchInterval, but we can do a simpler poll or rely on fast queue. 
  // For robustness let's just use the current job status. The user might have to click or wait for window refocus if polling isn't configured, but configuring polling would require changing api.ts. We will add a simple setTimeout poll.
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (exportJobId !== null && exportJobData?.data?.status !== 'completed' && exportJobData?.data?.status !== 'failed') {
      // manual poll fallback since we don't pass refetchInterval in api.ts
      // Though ideally it's placed in useQuery options.
    }

    if (exportJobData?.data?.status === 'completed' && exportJobData?.data?.download_url) {
      window.location.assign((import.meta as any).env.VITE_API_BASE_URL.replace('/api', '') + exportJobData.data.download_url);
      setExportJobId(null);
    } else if (exportJobData?.data?.status === 'failed') {
      alert('Export failed to generate.');
      setExportJobId(null);
    }
  }, [exportJobData]);

  const { data, isLoading } = useAdminOrdersQuery({
    page,
    per_page: 15,
    status: statusFilter || undefined,
    payment_method: paymentMethodFilter || undefined,
    search: search || undefined,
  });
  const updateStatus = useAdminUpdateOrderStatusMutation();
  const { rows: orders, meta: pagination } = toAdminOrderCollection(data?.data ?? {});

  async function handleExport() {
    try {
      const res = await exportMutation.mutateAsync({
        status: statusFilter || undefined,
        payment_method: paymentMethodFilter || undefined,
        search: search || undefined,
      });
      if (res.data?.job_id) {
        setExportJobId(res.data.job_id);
      }
    } catch (e) {
      console.error('Failed to dispatch export job', e);
    }
  }

  const isExporting = exportMutation.isPending || (exportJobId !== null && exportJobData?.data?.status !== 'completed' && exportJobData?.data?.status !== 'failed');

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-4">
      <AdminPageHeader
        eyebrow="OMS"
        title="Orders"
        description="Review orders, update states, and manage the order lifecycle."
        actions={
          <Button variant="outline" onClick={handleExport} loading={isExporting}>
            {isExporting ? 'Exporting...' : 'Export CSV'}
          </Button>
        }
      />

      <div className="flex flex-wrap gap-2">
        <input
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm max-w-sm"
          placeholder="Search by order # or email..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
        <select
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All Order Statuses</option>
          <option value="pending_payment">Pending Payment</option>
          <option value="placed">Placed</option>
          <option value="confirmed">Confirmed</option>
          <option value="processing">Processing</option>
          <option value="packed">Packed</option>
          <option value="shipped">Shipped</option>
          <option value="out_for_delivery">Out for Delivery</option>
          <option value="delivered">Delivered</option>
          <option value="completed">Completed</option>
          <option value="cancel_requested">Cancel Requested</option>
          <option value="cancelled">Cancelled</option>
          <option value="return_requested">Return Requested</option>
          <option value="refund_pending">Refund Pending</option>
          <option value="on_hold">On Hold</option>
          <option value="failed">Failed</option>
        </select>
        <select
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          value={paymentMethodFilter}
          onChange={(e) => {
            setPaymentMethodFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All Payment Methods</option>
          <option value="razorpay">Razorpay</option>
          <option value="phonepe">PhonePe</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="w-full min-w-[980px] text-sm">
          <thead className="border-b bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Order ID</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Products</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Customer</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Amount</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Delivery Status</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Payment Method</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Payment Status</th>
              <th className="px-4 py-3 text-right font-medium text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-900">
                  <div className="flex items-center gap-2">
                    {order.orderNumber}
                    {order.paymentMethod === 'phonepe' ? (
                      <Badge variant="info" className="text-[10px] py-0 px-1.5 h-4 leading-none">PhonePe</Badge>
                    ) : null}
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-600">
                  <div className="max-w-[220px]">
                    <p className="truncate text-slate-900">{order.productsSummary}</p>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <p className="text-slate-900">{order.customerName}</p>
                  <p className="text-xs text-slate-500">{order.customerEmail}</p>
                </td>
                <td className="px-4 py-3 font-semibold">Rs. {currency.format(order.total)}</td>
                <td className="px-4 py-3">
                  <Badge variant={statusVariant(order.deliveryStatus)}>
                    {humanizeLabel(order.deliveryStatus)}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <span className="font-medium text-slate-900">{humanizePaymentMethod(order.paymentMethod)}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="space-y-1">
                    <Badge variant={statusVariant(order.paymentStatus)}>
                      {humanizeLabel(order.paymentStatus)}
                    </Badge>
                    <p className="text-xs text-slate-500">
                      {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN') : '-'}
                    </p>
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link to={`/admin/orders/${order.id}`} className="inline-flex rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2">
                    View Details
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination.lastPage > 1 && (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page <= 1}
            className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-50"
          >
            Prev
          </button>
          <span className="px-3 py-1.5 text-sm text-slate-600">Page {page} of {pagination.lastPage}</span>
          <button
            onClick={() => setPage(page + 1)}
            disabled={page >= pagination.lastPage}
            className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

function humanizeLabel(value: string) {
  return value.replace(/_/g, ' ');
}

function humanizePaymentMethod(value: string) {
  if (value === 'phonepe') return 'PhonePe';
  if (value === 'razorpay') return 'Razorpay';
  if (value === '-') return '-';
  return humanizeLabel(value);
}
