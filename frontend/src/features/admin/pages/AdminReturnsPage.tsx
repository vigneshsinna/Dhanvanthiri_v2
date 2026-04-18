import { useState } from 'react';
import { useAdminReturnsQuery, useAdminUpdateReturnMutation } from '@/features/admin/api';
import { AdminPageHeader } from '@/features/admin/components/AdminPageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { PageLoader } from '@/components/ui/Spinner';

type ReturnRow = {
  id: number;
  status: string;
  reason?: string;
  created_at?: string;
  order?: { id?: number; order_number?: string; status?: string; grand_total?: number };
  user?: { name?: string; email?: string };
  items?: Array<{ product_name?: string; quantity?: number }>;
};

const returnStatusVariant = (status: string) => {
  const map: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
    requested: 'warning',
    pending: 'warning',
    under_review: 'info',
    approved: 'success',
    rejected: 'danger',
    pickup_scheduled: 'info',
    received: 'info',
    refund_pending: 'warning',
    refund_completed: 'success',
    closed: 'default',
    completed: 'success',
  };
  return map[status] ?? 'default';
};

/** Determine which next actions are available for a return status */
const nextReturnActions = (status: string): Array<{ status: string; label: string; variant: 'outline' | 'danger' }> => {
  switch (status) {
    case 'requested':
    case 'pending':
      return [
        { status: 'under_review', label: 'Start Review', variant: 'outline' },
        { status: 'approved', label: 'Approve', variant: 'outline' },
        { status: 'rejected', label: 'Reject', variant: 'danger' },
      ];
    case 'under_review':
      return [
        { status: 'approved', label: 'Approve', variant: 'outline' },
        { status: 'rejected', label: 'Reject', variant: 'danger' },
      ];
    case 'approved':
      return [
        { status: 'pickup_scheduled', label: 'Schedule Pickup', variant: 'outline' },
      ];
    case 'pickup_scheduled':
      return [
        { status: 'received', label: 'Mark Received', variant: 'outline' },
      ];
    case 'received':
      return [
        { status: 'refund_pending', label: 'Initiate Refund', variant: 'outline' },
        { status: 'completed', label: 'Complete', variant: 'outline' },
      ];
    case 'refund_pending':
      return [
        { status: 'refund_completed', label: 'Refund Done', variant: 'outline' },
      ];
    default:
      return [];
  }
};

export function AdminReturnsPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const { data, isLoading } = useAdminReturnsQuery({
    status: statusFilter || undefined,
    search: search || undefined,
    per_page: 20,
    page,
  });
  const updateReturn = useAdminUpdateReturnMutation();
  const rows: ReturnRow[] = data?.data?.data ?? data?.data ?? [];
  const meta = data?.data?.meta ?? { current_page: 1, last_page: 1, total: 0 };

  if (isLoading) return <PageLoader />;

  return (
    <section className="space-y-6">
      <AdminPageHeader
        eyebrow="OMS"
        title="Returns"
        description="Review, approve, and process return requests through the complete return lifecycle."
        actions={(
          <div className="flex gap-2">
            <input
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm max-w-xs"
              placeholder="Search by order # or customer..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm shadow-sm"
            >
              <option value="">All statuses</option>
              <option value="requested">Requested</option>
              <option value="under_review">Under Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="pickup_scheduled">Pickup Scheduled</option>
              <option value="received">Received</option>
              <option value="refund_pending">Refund Pending</option>
              <option value="refund_completed">Refund Completed</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        )}
      />

      <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Return</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Order</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Customer</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Reason</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Items</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Status</th>
              <th className="px-4 py-3 text-right font-medium text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((row) => (
              <tr key={row.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-950">#{row.id}</td>
                <td className="px-4 py-3 text-slate-600">{row.order?.order_number ?? '-'}</td>
                <td className="px-4 py-3">
                  <p className="text-slate-950">{row.user?.name ?? '-'}</p>
                  <p className="text-xs text-slate-500">{row.user?.email ?? ''}</p>
                </td>
                <td className="px-4 py-3 text-slate-600 max-w-[180px] truncate">{row.reason ?? '-'}</td>
                <td className="px-4 py-3 text-slate-600">{(row.items ?? []).length} items</td>
                <td className="px-4 py-3">
                  <Badge variant={returnStatusVariant(row.status)}>
                    {row.status.replace(/_/g, ' ')}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-1 flex-wrap">
                    {nextReturnActions(row.status).map((action) => (
                      <Button
                        key={action.status}
                        size="sm"
                        variant={action.variant}
                        onClick={() => updateReturn.mutate({ id: row.id, status: action.status })}
                      >
                        {action.label}
                      </Button>
                    ))}
                    {nextReturnActions(row.status).length === 0 && (
                      <span className="text-xs text-slate-400">
                        {row.created_at ? new Date(row.created_at).toLocaleDateString('en-IN') : '-'}
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-400">No return requests found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {meta.last_page > 1 && (
        <div className="flex justify-center gap-2">
          <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1} className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-50">
            Prev
          </button>
          <span className="px-3 py-1.5 text-sm text-slate-600">Page {page} of {meta.last_page}</span>
          <button onClick={() => setPage(page + 1)} disabled={page >= meta.last_page} className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-50">
            Next
          </button>
        </div>
      )}
    </section>
  );
}
