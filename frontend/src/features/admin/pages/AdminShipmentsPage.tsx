import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useAdminShipmentsQuery, useAdminUpdateShipmentMutation } from '@/features/admin/api';
import { AdminPageHeader } from '@/features/admin/components/AdminPageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { PageLoader } from '@/components/ui/Spinner';

const shipmentStatusVariant = (status: string) => {
  const map: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
    draft: 'default',
    created: 'info',
    label_generated: 'info',
    dispatched: 'info',
    in_transit: 'info',
    out_for_delivery: 'warning',
    delivered: 'success',
    delivery_failed: 'danger',
    returned_to_origin: 'danger',
  };
  return map[status] ?? 'default';
};

export function AdminShipmentsPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  const { data, isLoading } = useAdminShipmentsQuery({
    page,
    per_page: 20,
    status: statusFilter || undefined,
    search: search || undefined,
  });
  const updateShipment = useAdminUpdateShipmentMutation();

  const shipments: any[] = data?.data?.data ?? [];
  const meta = data?.data?.meta ?? { current_page: 1, last_page: 1, total: 0 };

  if (isLoading) return <PageLoader />;

  return (
    <section className="space-y-6">
      <AdminPageHeader
        eyebrow="OMS"
        title="Shipments"
        description="Track all shipments, update delivery statuses, and manage dispatch operations."
      />

      <div className="flex flex-wrap gap-2">
        <input
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm max-w-sm"
          placeholder="Search by tracking # or order #..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
        <select
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
        >
          <option value="">All Statuses</option>
          <option value="created">Created</option>
          <option value="dispatched">Dispatched</option>
          <option value="in_transit">In Transit</option>
          <option value="out_for_delivery">Out for Delivery</option>
          <option value="delivered">Delivered</option>
          <option value="delivery_failed">Delivery Failed</option>
          <option value="returned_to_origin">Returned to Origin</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Shipment ID</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Order</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Carrier</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Tracking #</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Status</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">ETA</th>
              <th className="px-4 py-3 text-right font-medium text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {shipments.map((shipment: any) => (
              <tr key={shipment.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-950">#{shipment.id}</td>
                <td className="px-4 py-3">
                  <Link to={`/admin/orders/${shipment.order_id}`} className="text-sm font-medium text-brand-700 hover:underline">
                    {shipment.order?.order_number ?? `Order #${shipment.order_id}`}
                  </Link>
                </td>
                <td className="px-4 py-3 text-slate-600">{shipment.carrier}</td>
                <td className="px-4 py-3 text-slate-600">
                  {shipment.tracking_url ? (
                    <a href={shipment.tracking_url} target="_blank" rel="noopener noreferrer" className="text-brand-700 hover:underline">
                      {shipment.tracking_number}
                    </a>
                  ) : shipment.tracking_number}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={shipmentStatusVariant(shipment.status)}>
                    {(shipment.status ?? '').replace(/_/g, ' ')}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-slate-600 text-xs">
                  {shipment.estimated_delivery_at ? new Date(shipment.estimated_delivery_at).toLocaleDateString('en-IN') : '-'}
                </td>
                <td className="px-4 py-3 text-right">
                  {shipment.status === 'created' && (
                    <Button size="sm" variant="outline" className="mr-1" onClick={() => updateShipment.mutate({ id: shipment.id, status: 'dispatched' })}>
                      Dispatch
                    </Button>
                  )}
                  {shipment.status === 'in_transit' && (
                    <Button size="sm" variant="outline" className="mr-1" onClick={() => updateShipment.mutate({ id: shipment.id, status: 'out_for_delivery' })}>
                      Out for Delivery
                    </Button>
                  )}
                  {shipment.status === 'out_for_delivery' && (
                    <Button size="sm" variant="outline" onClick={() => updateShipment.mutate({ id: shipment.id, status: 'delivered' })}>
                      Mark Delivered
                    </Button>
                  )}
                  <Link to={`/admin/orders/${shipment.order_id}`} className="ml-1 inline-flex rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
                    Details
                  </Link>
                </td>
              </tr>
            ))}
            {shipments.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-400">No shipments found.</td>
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
