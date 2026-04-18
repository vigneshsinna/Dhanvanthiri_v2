import { useState } from 'react';
import {
  useAdminWarrantiesQuery,
  useAdminCreateWarrantyMutation,
  useAdminUpdateWarrantyMutation,
  useAdminDeleteWarrantyMutation,
} from '@/features/admin/api';
import { PageLoader } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Search, Plus, X, ShieldCheck } from 'lucide-react';

interface Warranty {
  id: number;
  name: string;
  type: 'manufacturer' | 'extended' | 'store';
  duration_days: number;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

const WARRANTY_TYPES = [
  { value: 'manufacturer', label: 'Manufacturer' },
  { value: 'extended', label: 'Extended' },
  { value: 'store', label: 'Store' },
] as const;

function formatDuration(days: number): string {
  if (days >= 365 && days % 365 === 0) return `${days / 365} year${days / 365 > 1 ? 's' : ''}`;
  if (days >= 30 && days % 30 === 0) return `${days / 30} month${days / 30 > 1 ? 's' : ''}`;
  return `${days} day${days > 1 ? 's' : ''}`;
}

export function AdminWarrantiesPage() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const { data, isLoading } = useAdminWarrantiesQuery({ search, type: typeFilter || undefined, page, paginate: 1 });
  const createMut = useAdminCreateWarrantyMutation();
  const updateMut = useAdminUpdateWarrantyMutation();
  const deleteMut = useAdminDeleteWarrantyMutation();

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({
    name: '',
    type: 'manufacturer' as string,
    duration_days: 365,
    description: '',
    is_active: true,
  });

  const warranties: Warranty[] = data?.data?.data ?? data?.data ?? [];
  const pagination = data?.data?.meta ?? data?.data;

  const openCreate = () => {
    setEditId(null);
    setForm({ name: '', type: 'manufacturer', duration_days: 365, description: '', is_active: true });
    setShowForm(true);
  };

  const openEdit = (w: Warranty) => {
    setEditId(w.id);
    setForm({
      name: w.name,
      type: w.type,
      duration_days: w.duration_days,
      description: w.description ?? '',
      is_active: w.is_active,
    });
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...form,
      description: form.description || null,
    };
    if (editId) {
      updateMut.mutate({ id: editId, ...payload }, { onSuccess: () => setShowForm(false) });
    } else {
      createMut.mutate(payload, { onSuccess: () => setShowForm(false) });
    }
  };

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Warranties</h1>
        <Button onClick={openCreate}>
          <Plus className="mr-1 h-4 w-4" /> New Warranty
        </Button>
      </div>

      <div className="flex gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search warranties..."
            className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
        >
          <option value="">All Types</option>
          {WARRANTY_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-xl border bg-white p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{editId ? 'Edit' : 'New'} Warranty</h2>
            <button type="button" onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Warranty Name</label>
              <input
                required
                type="text"
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Type</label>
              <select
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                {WARRANTY_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Duration (days)</label>
              <input
                required
                type="number"
                min={1}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
                value={form.duration_days}
                onChange={(e) => setForm({ ...form, duration_days: parseInt(e.target.value) || 0 })}
              />
              <span className="mt-1 block text-xs text-slate-500">
                = {formatDuration(form.duration_days)}
              </span>
            </div>
            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="warrantyActive"
                checked={form.is_active}
                onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                className="h-4 w-4 rounded border-slate-300"
              />
              <label htmlFor="warrantyActive" className="text-sm font-medium text-slate-700">Active</label>
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-slate-700">Description (optional)</label>
              <textarea
                rows={3}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button type="submit" disabled={createMut.isPending || updateMut.isPending}>
              {editId ? 'Save Changes' : 'Create Warranty'}
            </Button>
          </div>
        </form>
      )}

      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="border-b bg-slate-50 text-xs font-semibold uppercase text-slate-500">
            <tr>
              <th className="px-6 py-3">Name</th>
              <th className="px-6 py-3">Type</th>
              <th className="px-6 py-3">Duration</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {warranties.map((w) => (
              <tr key={w.id} className="hover:bg-slate-50">
                <td className="px-6 py-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-green-500" />
                    <span className="font-medium text-slate-900">{w.name}</span>
                  </div>
                </td>
                <td className="px-6 py-3 capitalize">{w.type}</td>
                <td className="px-6 py-3">{formatDuration(w.duration_days)}</td>
                <td className="px-6 py-3">
                  <Badge variant={w.is_active ? 'success' : 'default'}>{w.is_active ? 'Active' : 'Hidden'}</Badge>
                </td>
                <td className="px-6 py-3 text-right">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(w)}>Edit</Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600"
                    onClick={() => { if (confirm('Delete this warranty?')) deleteMut.mutate(w.id); }}
                  >
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
            {warranties.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-500">No warranties found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {pagination?.last_page > 1 && (
        <div className="flex items-center justify-between pt-2">
          <span className="text-sm text-slate-500">
            Page {pagination.current_page} of {pagination.last_page} ({pagination.total} items)
          </span>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
            <Button variant="outline" size="sm" disabled={page >= pagination.last_page} onClick={() => setPage(page + 1)}>Next</Button>
          </div>
        </div>
      )}
    </div>
  );
}
