import { useState } from 'react';
import {
  useAdminSizeChartsQuery,
  useAdminCreateSizeChartMutation,
  useAdminUpdateSizeChartMutation,
  useAdminDeleteSizeChartMutation,
} from '@/features/admin/api';
import { useAdminCategoriesQuery } from '@/features/admin/api';
import { PageLoader } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Search, Plus, X, Trash2 } from 'lucide-react';

interface SizeChart {
  id: number;
  name: string;
  category_id: number | null;
  category?: { id: number; name: string };
  headers: string[];
  rows: string[][];
  is_active: boolean;
  created_at: string;
}

interface Category {
  id: number;
  name: string;
}

export function AdminSizeChartsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const { data, isLoading } = useAdminSizeChartsQuery({ search, page, paginate: 1 });
  const { data: catData } = useAdminCategoriesQuery();
  const createMut = useAdminCreateSizeChartMutation();
  const updateMut = useAdminUpdateSizeChartMutation();
  const deleteMut = useAdminDeleteSizeChartMutation();

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({
    name: '',
    category_id: '' as string | number,
    headers: ['Size', 'Chest', 'Waist'],
    rows: [['S', '', '']] as string[][],
    is_active: true,
  });

  const sizeCharts: SizeChart[] = data?.data?.data ?? data?.data ?? [];
  const pagination = data?.data?.meta ?? data?.data;
  const categories: Category[] = catData?.data?.data ?? catData?.data ?? [];

  const openCreate = () => {
    setEditId(null);
    setForm({
      name: '',
      category_id: '',
      headers: ['Size', 'Chest', 'Waist'],
      rows: [['', '', '']],
      is_active: true,
    });
    setShowForm(true);
  };

  const openEdit = (sc: SizeChart) => {
    setEditId(sc.id);
    setForm({
      name: sc.name,
      category_id: sc.category_id ?? '',
      headers: sc.headers,
      rows: sc.rows,
      is_active: sc.is_active,
    });
    setShowForm(true);
  };

  const updateHeader = (idx: number, value: string) => {
    const h = [...form.headers];
    h[idx] = value;
    setForm({ ...form, headers: h });
  };

  const addColumn = () => {
    setForm({
      ...form,
      headers: [...form.headers, ''],
      rows: form.rows.map((r) => [...r, '']),
    });
  };

  const removeColumn = (idx: number) => {
    if (form.headers.length <= 1) return;
    setForm({
      ...form,
      headers: form.headers.filter((_, i) => i !== idx),
      rows: form.rows.map((r) => r.filter((_, i) => i !== idx)),
    });
  };

  const updateCell = (rowIdx: number, colIdx: number, value: string) => {
    const newRows = form.rows.map((r, ri) =>
      ri === rowIdx ? r.map((c, ci) => (ci === colIdx ? value : c)) : r
    );
    setForm({ ...form, rows: newRows });
  };

  const addRow = () => {
    setForm({ ...form, rows: [...form.rows, new Array(form.headers.length).fill('')] });
  };

  const removeRow = (idx: number) => {
    if (form.rows.length <= 1) return;
    setForm({ ...form, rows: form.rows.filter((_, i) => i !== idx) });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: form.name,
      category_id: form.category_id || null,
      headers: form.headers,
      rows: form.rows,
      is_active: form.is_active,
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
        <h1 className="text-2xl font-bold">Size Charts</h1>
        <Button onClick={openCreate}>
          <Plus className="mr-1 h-4 w-4" /> New Size Chart
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search size charts..."
          className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-xl border bg-white p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{editId ? 'Edit' : 'New'} Size Chart</h2>
            <button type="button" onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Chart Name</label>
              <input
                required
                type="text"
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Category (optional)</label>
              <select
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
                value={form.category_id}
                onChange={(e) => setForm({ ...form, category_id: e.target.value })}
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="scActive"
                checked={form.is_active}
                onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                className="h-4 w-4 rounded border-slate-300"
              />
              <label htmlFor="scActive" className="text-sm font-medium text-slate-700">Active</label>
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-medium text-slate-700">Chart Table</label>
              <Button type="button" variant="outline" size="sm" onClick={addColumn}>+ Column</Button>
            </div>
            <div className="overflow-x-auto rounded border">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    {form.headers.map((h, i) => (
                      <th key={i} className="border-b px-2 py-1.5">
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            className="w-full rounded border border-slate-300 px-2 py-1 text-xs font-semibold"
                            value={h}
                            onChange={(e) => updateHeader(i, e.target.value)}
                          />
                          {form.headers.length > 1 && (
                            <button type="button" onClick={() => removeColumn(i)} className="text-slate-400 hover:text-red-500">
                              <X className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      </th>
                    ))}
                    <th className="w-8 border-b" />
                  </tr>
                </thead>
                <tbody>
                  {form.rows.map((row, ri) => (
                    <tr key={ri}>
                      {row.map((cell, ci) => (
                        <td key={ci} className="border-b px-2 py-1">
                          <input
                            type="text"
                            className="w-full rounded border border-slate-200 px-2 py-1 text-xs"
                            value={cell}
                            onChange={(e) => updateCell(ri, ci, e.target.value)}
                          />
                        </td>
                      ))}
                      <td className="border-b px-1">
                        {form.rows.length > 1 && (
                          <button type="button" onClick={() => removeRow(ri)} className="text-slate-400 hover:text-red-500">
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Button type="button" variant="outline" size="sm" className="mt-2" onClick={addRow}>+ Row</Button>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button type="submit" disabled={createMut.isPending || updateMut.isPending}>
              {editId ? 'Save Changes' : 'Create Size Chart'}
            </Button>
          </div>
        </form>
      )}

      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="border-b bg-slate-50 text-xs font-semibold uppercase text-slate-500">
            <tr>
              <th className="px-6 py-3">Name</th>
              <th className="px-6 py-3">Category</th>
              <th className="px-6 py-3">Columns</th>
              <th className="px-6 py-3">Rows</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {sizeCharts.map((sc) => (
              <tr key={sc.id} className="hover:bg-slate-50">
                <td className="px-6 py-3 font-medium text-slate-900">{sc.name}</td>
                <td className="px-6 py-3">{sc.category?.name ?? <span className="text-slate-400">All</span>}</td>
                <td className="px-6 py-3">{sc.headers?.length ?? 0}</td>
                <td className="px-6 py-3">{sc.rows?.length ?? 0}</td>
                <td className="px-6 py-3">
                  <Badge variant={sc.is_active ? 'success' : 'default'}>{sc.is_active ? 'Active' : 'Hidden'}</Badge>
                </td>
                <td className="px-6 py-3 text-right">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(sc)}>Edit</Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600"
                    onClick={() => { if (confirm('Delete this size chart?')) deleteMut.mutate(sc.id); }}
                  >
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
            {sizeCharts.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-500">No size charts found.</td>
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
