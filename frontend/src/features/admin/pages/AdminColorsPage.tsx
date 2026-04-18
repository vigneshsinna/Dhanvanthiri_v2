import { useState } from 'react';
import {
  useAdminColorsQuery,
  useAdminCreateColorMutation,
  useAdminUpdateColorMutation,
  useAdminDeleteColorMutation,
} from '@/features/admin/api';
import { PageLoader } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Search, Plus, X } from 'lucide-react';

interface ProductColor {
  id: number;
  name: string;
  hex_code: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export function AdminColorsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const { data, isLoading } = useAdminColorsQuery({ search, page, paginate: 1 });
  const createMut = useAdminCreateColorMutation();
  const updateMut = useAdminUpdateColorMutation();
  const deleteMut = useAdminDeleteColorMutation();

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({
    name: '',
    hex_code: '#000000',
    sort_order: 0,
    is_active: true,
  });

  const colors: ProductColor[] = data?.data?.data ?? data?.data ?? [];
  const pagination = data?.data?.meta ?? data?.data;

  const openCreate = () => {
    setEditId(null);
    setForm({ name: '', hex_code: '#000000', sort_order: 0, is_active: true });
    setShowForm(true);
  };

  const openEdit = (c: ProductColor) => {
    setEditId(c.id);
    setForm({
      name: c.name,
      hex_code: c.hex_code,
      sort_order: c.sort_order,
      is_active: c.is_active,
    });
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editId) {
      updateMut.mutate({ id: editId, ...form }, { onSuccess: () => setShowForm(false) });
    } else {
      createMut.mutate(form, { onSuccess: () => setShowForm(false) });
    }
  };

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Product Colors</h1>
        <Button onClick={openCreate}>
          <Plus className="mr-1 h-4 w-4" /> New Color
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search colors..."
          className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-xl border bg-white p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{editId ? 'Edit' : 'New'} Color</h2>
            <button type="button" onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Color Name</label>
              <input
                required
                type="text"
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Hex Code</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  className="h-10 w-14 cursor-pointer rounded border border-slate-300 p-1"
                  value={form.hex_code}
                  onChange={(e) => setForm({ ...form, hex_code: e.target.value })}
                />
                <input
                  required
                  type="text"
                  pattern="^#[0-9A-Fa-f]{6}$"
                  placeholder="#FF0000"
                  className="flex-1 rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm"
                  value={form.hex_code}
                  onChange={(e) => setForm({ ...form, hex_code: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Sort Order</label>
              <input
                type="number"
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
                value={form.sort_order}
                onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="colorActive"
                checked={form.is_active}
                onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                className="h-4 w-4 rounded border-slate-300"
              />
              <label htmlFor="colorActive" className="text-sm font-medium text-slate-700">Active</label>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button type="submit" disabled={createMut.isPending || updateMut.isPending}>
              {editId ? 'Save Changes' : 'Create Color'}
            </Button>
          </div>
        </form>
      )}

      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="border-b bg-slate-50 text-xs font-semibold uppercase text-slate-500">
            <tr>
              <th className="px-6 py-3">Preview</th>
              <th className="px-6 py-3">Name</th>
              <th className="px-6 py-3">Hex Code</th>
              <th className="px-6 py-3">Order</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {colors.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50">
                <td className="px-6 py-3">
                  <div
                    className="h-8 w-8 rounded-full border-2 border-slate-200"
                    style={{ backgroundColor: c.hex_code }}
                    title={c.hex_code}
                  />
                </td>
                <td className="px-6 py-3 font-medium text-slate-900">{c.name}</td>
                <td className="px-6 py-3">
                  <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-mono text-slate-600">{c.hex_code}</code>
                </td>
                <td className="px-6 py-3">{c.sort_order}</td>
                <td className="px-6 py-3">
                  <Badge variant={c.is_active ? 'success' : 'default'}>{c.is_active ? 'Active' : 'Hidden'}</Badge>
                </td>
                <td className="px-6 py-3 text-right">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(c)}>Edit</Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600"
                    onClick={() => { if (confirm('Delete this color?')) deleteMut.mutate(c.id); }}
                  >
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
            {colors.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-500">No colors found.</td>
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
