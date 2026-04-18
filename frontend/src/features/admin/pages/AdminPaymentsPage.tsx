import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAdminPaymentsQuery } from '@/features/admin/api';
import { AdminPageHeader } from '@/features/admin/components/AdminPageHeader';
import { Badge } from '@/components/ui/Badge';
import { PageLoader } from '@/components/ui/Spinner';

const currency = new Intl.NumberFormat('en-IN', {
  maximumFractionDigits: 2,
  minimumFractionDigits: 0,
});

const STATUS_COLORS: Record<string, 'success' | 'warning' | 'info' | 'danger'> = {
  captured: 'success',
  confirmed: 'success',
  pending: 'warning',
  failed: 'danger',
  refunded: 'info',
};

export function AdminPaymentsPage() {
  const [gateway, setGateway] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [page, setPage] = useState(1);

  const params: Record<string, unknown> = { page, per_page: 20 };
  if (gateway) params.gateway = gateway;
  if (status) params.status = status;

  const { data, isLoading } = useAdminPaymentsQuery(params);
  const rows = data?.data?.data ?? data?.data ?? [];
  const pagination = data?.data?.meta ?? data?.meta;

  if (isLoading && !rows.length) return <PageLoader />;

  return (
    <section className="space-y-6">
      <AdminPageHeader
        eyebrow="OMS"
        title="Payments"
        description="Review captured transactions and jump from a payment back to its source order."
      />

      {/* Filters */}
      <div className="flex items-center gap-3">
        <select
          value={gateway}
          onChange={(e) => { setGateway(e.target.value); setPage(1); }}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
        >
          <option value="">All Gateways</option>
          <option value="razorpay">Razorpay</option>
          <option value="cod">Cash on Delivery</option>
        </select>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
        >
          <option value="">All Statuses</option>
          <option value="captured">Captured</option>
          <option value="confirmed">Confirmed</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
          <option value="refunded">Refunded</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Payment</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Order</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Gateway</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Amount</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Status</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Date</th>
              <th className="px-4 py-3 text-right font-medium text-slate-600">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">No payments found.</td></tr>
            )}
            {rows.map((row: any) => (
              <tr key={row.id}>
                <td className="px-4 py-3 font-medium text-slate-950">#{row.id}</td>
                <td className="px-4 py-3 text-slate-600">
                  {row.order_number ? `#${row.order_number}` : `Order #${row.order_id}`}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={row.gateway === 'cod' ? 'warning' : 'info'}>
                    {row.gateway === 'cod' ? 'COD' : 'Razorpay'}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-slate-950">₹{currency.format(row.amount)}</td>
                <td className="px-4 py-3">
                  <Badge variant={STATUS_COLORS[row.status] ?? 'warning'}>{row.status}</Badge>
                </td>
                <td className="px-4 py-3 text-slate-500 text-xs">
                  {row.created_at ? new Date(row.created_at).toLocaleDateString('en-IN') : '—'}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link to={`/admin/orders/${row.order_id}`} className="text-sm font-medium text-brand-700 hover:underline">
                    Open order
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && pagination.last_page > 1 && (
        <div className="flex items-center justify-between text-sm text-slate-500">
          <span>Page {pagination.current_page} of {pagination.last_page} ({pagination.total} payments)</span>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded border px-3 py-1 disabled:opacity-40">Prev</button>
            <button disabled={page >= pagination.last_page} onClick={() => setPage(page + 1)} className="rounded border px-3 py-1 disabled:opacity-40">Next</button>
          </div>
        </div>
      )}
    </section>
  );
}
