import { useState } from 'react';
import {
  useAdminCustomersQuery,
  useAdminCustomerQuery,
  useAdminToggleCustomerStatusMutation,
  useAdminBanCustomerMutation,
  useAdminUnbanCustomerMutation,
  useAdminUpdateCustomerMutation,
} from '@/features/admin/api';
import { PageLoader } from '@/components/ui/Spinner';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ShieldBan, ShieldCheck, Eye, UserCog, X, Search, ChevronLeft, ChevronRight } from 'lucide-react';

interface Customer {
  id: number;
  name: string;
  email: string;
  phone?: string;
  orders_count: number;
  total_spent: number;
  status: string;
  is_banned?: boolean;
  ban_reason?: string;
  created_at: string;
}

type ModalState =
  | { type: 'none' }
  | { type: 'view'; id: number }
  | { type: 'ban'; id: number; name: string }
  | { type: 'edit'; customer: Customer };

export function AdminCustomersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [modal, setModal] = useState<ModalState>({ type: 'none' });

  const { data, isLoading } = useAdminCustomersQuery({
    page,
    per_page: 15,
    search: search || undefined,
    status: statusFilter || undefined,
  });
  const toggleStatusMut = useAdminToggleCustomerStatusMutation();
  const banMut = useAdminBanCustomerMutation();
  const unbanMut = useAdminUnbanCustomerMutation();
  const updateMut = useAdminUpdateCustomerMutation();

  const customers: Customer[] = data?.data?.data ?? data?.data ?? [];
  const pagination = data?.data?.meta ?? data?.meta ?? null;

  if (isLoading) return <PageLoader />;

  const statusBadge = (c: Customer) => {
    if (c.is_banned) return <Badge variant="danger">Banned</Badge>;
    if (c.status === 'active') return <Badge variant="success">Active</Badge>;
    return <Badge variant="warning">{c.status}</Badge>;
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Customers</h1>
        <span className="text-sm text-slate-500">{pagination?.total ?? customers.length} total</span>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="banned">Banned</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Customer</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Phone</th>
              <th className="px-4 py-3 text-center font-medium text-slate-600">Orders</th>
              <th className="px-4 py-3 text-right font-medium text-slate-600">Total Spent</th>
              <th className="px-4 py-3 text-center font-medium text-slate-600">Status</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Joined</th>
              <th className="px-4 py-3 text-right font-medium text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {customers.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-900">{c.name}</p>
                  <p className="text-xs text-slate-500">{c.email}</p>
                </td>
                <td className="px-4 py-3 text-slate-600">{c.phone ?? '—'}</td>
                <td className="px-4 py-3 text-center font-medium">{c.orders_count}</td>
                <td className="px-4 py-3 text-right font-semibold">₹{Number(c.total_spent || 0).toLocaleString('en-IN')}</td>
                <td className="px-4 py-3 text-center">{statusBadge(c)}</td>
                <td className="px-4 py-3 text-slate-600 text-xs">{new Date(c.created_at).toLocaleDateString('en-IN')}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => setModal({ type: 'view', id: c.id })}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                      title="View details"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setModal({ type: 'edit', customer: c })}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                      title="Edit"
                    >
                      <UserCog className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => toggleStatusMut.mutate(c.id)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-blue-600"
                      title={c.status === 'active' ? 'Deactivate' : 'Activate'}
                    >
                      <ShieldCheck className="h-4 w-4" />
                    </button>
                    {c.is_banned ? (
                      <button
                        onClick={() => unbanMut.mutate(c.id)}
                        className="rounded-lg p-1.5 text-green-500 hover:bg-green-50 hover:text-green-700"
                        title="Unban"
                      >
                        <ShieldCheck className="h-4 w-4" />
                      </button>
                    ) : (
                      <button
                        onClick={() => setModal({ type: 'ban', id: c.id, name: c.name })}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                        title="Ban"
                      >
                        <ShieldBan className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {customers.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-400">No customers found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && pagination.last_page > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1} className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm disabled:opacity-40">
            <ChevronLeft className="h-4 w-4" /> Prev
          </button>
          <span className="px-3 py-1.5 text-sm text-slate-600">Page {page} of {pagination.last_page}</span>
          <button onClick={() => setPage(page + 1)} disabled={page >= pagination.last_page} className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm disabled:opacity-40">
            Next <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Modals */}
      {modal.type === 'view' && <CustomerDetailModal id={modal.id} onClose={() => setModal({ type: 'none' })} />}
      {modal.type === 'ban' && (
        <BanModal
          name={modal.name}
          onConfirm={(reason) => {
            banMut.mutate({ id: modal.id, reason }, { onSuccess: () => setModal({ type: 'none' }) });
          }}
          onClose={() => setModal({ type: 'none' })}
          loading={banMut.isPending}
        />
      )}
      {modal.type === 'edit' && (
        <EditCustomerModal
          customer={modal.customer}
          onSave={(data) => {
            updateMut.mutate({ id: modal.customer.id, ...data }, { onSuccess: () => setModal({ type: 'none' }) });
          }}
          onClose={() => setModal({ type: 'none' })}
          loading={updateMut.isPending}
        />
      )}
    </div>
  );
}

/* ── Customer Detail Modal ── */
function CustomerDetailModal({ id, onClose }: { id: number; onClose: () => void }) {
  const { data, isLoading } = useAdminCustomerQuery(id);
  const customer = data?.data;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Customer Details</h2>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-slate-100"><X className="h-5 w-5" /></button>
        </div>
        {isLoading ? (
          <p className="py-8 text-center text-slate-400">Loading...</p>
        ) : customer ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Detail label="Name" value={customer.name} />
              <Detail label="Email" value={customer.email} />
              <Detail label="Phone" value={customer.phone ?? '—'} />
              <Detail label="Status" value={customer.status} />
              <Detail label="Total Orders" value={customer.orders_count ?? customer.total_orders ?? 0} />
              <Detail label="Total Spent" value={`₹${Number(customer.total_spent || 0).toLocaleString('en-IN')}`} />
              <Detail label="Reviews" value={customer.reviews_count ?? 0} />
              <Detail label="Wishlist Items" value={customer.wishlist_count ?? 0} />
            </div>
            {customer.ban_reason && (
              <div className="rounded-lg bg-red-50 p-3">
                <p className="text-xs font-medium text-red-700">Ban Reason</p>
                <p className="mt-1 text-sm text-red-800">{customer.ban_reason}</p>
              </div>
            )}
            {customer.recent_orders?.length > 0 && (
              <div>
                <p className="mb-2 text-sm font-medium text-slate-700">Recent Orders</p>
                <div className="space-y-1">
                  {customer.recent_orders.slice(0, 5).map((o: { id: number; order_number: string; grand_total: number; status: string }) => (
                    <div key={o.id} className="flex justify-between rounded-lg bg-slate-50 px-3 py-2 text-xs">
                      <span className="font-medium">{o.order_number}</span>
                      <span>₹{Number(o.grand_total || 0).toLocaleString('en-IN')}</span>
                      <Badge variant={o.status === 'delivered' ? 'success' : 'info'}>{o.status}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="py-8 text-center text-slate-400">Customer not found</p>
        )}
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-xs font-medium text-slate-400">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-slate-900">{value}</p>
    </div>
  );
}

/* ── Ban Modal ── */
function BanModal({ name, onConfirm, onClose, loading }: { name: string; onConfirm: (reason: string) => void; onClose: () => void; loading: boolean }) {
  const [reason, setReason] = useState('');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-semibold text-slate-900">Ban Customer</h2>
        <p className="mt-1 text-sm text-slate-500">Are you sure you want to ban <strong>{name}</strong>?</p>
        <textarea
          className="mt-4 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          rows={3}
          placeholder="Reason for banning (required)..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onConfirm(reason)} disabled={!reason.trim() || loading} loading={loading} className="bg-red-600 hover:bg-red-700">
            Ban Customer
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ── Edit Customer Modal ── */
function EditCustomerModal({ customer, onSave, onClose, loading }: { customer: Customer; onSave: (data: { name: string; email: string; phone?: string }) => void; onClose: () => void; loading: boolean }) {
  const [form, setForm] = useState({ name: customer.name, email: customer.email, phone: customer.phone ?? '' });
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Edit Customer</h2>
        <div className="space-y-3">
          <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onSave(form)} loading={loading}>Save</Button>
        </div>
      </div>
    </div>
  );
}
