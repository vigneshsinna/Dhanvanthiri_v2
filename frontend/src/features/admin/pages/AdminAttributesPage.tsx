import { useState } from 'react';
import {
  useAdminAttributesQuery,
  useAdminCreateAttributeMutation,
  useAdminUpdateAttributeMutation,
  useAdminDeleteAttributeMutation,
} from '@/features/admin/api';
import { PageLoader } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Search, Plus, X } from 'lucide-react';

interface Attribute {
  id: number;
  name: string;
  slug: string;
  type: string;
  options: string[] | null;
  is_filterable: boolean;
  sort_order: number;
  created_at: string;
}

export function AdminAttributesPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const { data, isLoading } = useAdminAttributesQuery({ search, page, paginate: 1 });
  const createMut = useAdminCreateAttributeMutation();
  const updateMut = useAdminUpdateAttributeMutation();
  const deleteMut = useAdminDeleteAttributeMutation();

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({
    name: '',
    type: 'text',
    options: '' as string,
    is_filterable: false,
    sort_order: 0,
  });

  const attributes: Attribute[] = data?.data?.data ?? data?.data ?? [];
  const pagination = data?.data?.meta ?? data?.data;

  const openCreate = () => {
    setEditId(null);
    setForm({ name: '', type: 'text', options: '', is_filterable: false, sort_order: 0 });
    setShowForm(true);
  };

  const openEdit = (a: Attribute) => {
    setEditId(a.id);
    setForm({
      name: a.name,
      type: a.type,
      options: a.options?.join(', ') ?? '',
      is_filterable: a.is_filterable,
      sort_order: a.sort_order,
    });
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: form.name,
      type: form.type,
      options: form.options ? form.options.split(',').map((o) => o.trim()).filter(Boolean) : [],
      is_filterable: form.is_filterable,
      sort_order: form.sort_order,
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
        <h1 className="text-2xl font-bold">Product Attributes</h1>
        <Button onClick={openCreate}>
          <Plus className="mr-1 h-4 w-4" /> New Attribute
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search attributes..."
          className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-xl border bg-white p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{editId ? 'Edit' : 'New'} Attribute</h2>
            <button type="button" onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Attribute Name</label>
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
                <option value="text">Text</option>
                <option value="select">Select</option>
                <option value="color">Color</option>
                <option value="number">Number</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-slate-700">Options (comma separated, for select type)</label>
              <input
                type="text"
                placeholder="e.g. Small, Medium, Large"
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
                value={form.options}
                onChange={(e) => setForm({ ...form, options: e.target.value })}
              />
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
                id="attrFilterable"
                checked={form.is_filterable}
                onChange={(e) => setForm({ ...form, is_filterable: e.target.checked })}
                className="h-4 w-4 rounded border-slate-300"
              />
              <label htmlFor="attrFilterable" className="text-sm font-medium text-slate-700">Filterable on storefront</label>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button type="submit" disabled={createMut.isPending || updateMut.isPending}>
              {editId ? 'Save Changes' : 'Create Attribute'}
            </Button>
          </div>
        </form>
      )}

      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="border-b bg-slate-50 text-xs font-semibold uppercase text-slate-500">
            <tr>
              <th className="px-6 py-3">Name</th>
              <th className="px-6 py-3">Slug</th>
              <th className="px-6 py-3">Type</th>
              <th className="px-6 py-3">Options</th>
              <th className="px-6 py-3">Filterable</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {attributes.map((a) => (
              <tr key={a.id} className="hover:bg-slate-50">
                <td className="px-6 py-3 font-medium text-slate-900">{a.name}</td>
                <td className="px-6 py-3">
                  <code className="rounded bg-slate-100 px-1 py-0.5 text-xs text-slate-500">{a.slug}</code>
                </td>
                <td className="px-6 py-3 capitalize">{a.type}</td>
                <td className="px-6 py-3">
                  {a.options && a.options.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {a.options.slice(0, 3).map((o) => (
                        <Badge key={o} variant="default">{o}</Badge>
                      ))}
                      {a.options.length > 3 && <Badge variant="default">+{a.options.length - 3}</Badge>}
                    </div>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>
                <td className="px-6 py-3">
                  <Badge variant={a.is_filterable ? 'success' : 'default'}>
                    {a.is_filterable ? 'Yes' : 'No'}
                  </Badge>
                </td>
                <td className="px-6 py-3 text-right">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(a)}>Edit</Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600"
                    onClick={() => { if (confirm('Delete this attribute?')) deleteMut.mutate(a.id); }}
                  >
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
            {attributes.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-500">No attributes found.</td>
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
