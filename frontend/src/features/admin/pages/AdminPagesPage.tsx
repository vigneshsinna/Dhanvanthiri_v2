import { useState } from 'react';
import { useAdminPagesQuery, useAdminCreatePageMutation, useAdminUpdatePageMutation, useAdminDeletePageMutation } from '@/features/admin/api';
import { PageLoader } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { RichTextEditor } from '@/components/ui/RichTextEditor';

interface CMSPage {
  id: number;
  title: string;
  title_translations?: Record<string, string>;
  slug: string;
  content?: string;
  content_translations?: Record<string, string>;
  excerpt?: string | null;
  excerpt_translations?: Record<string, string>;
  effective_date?: string | null;
  meta_title?: string | null;
  meta_title_translations?: Record<string, string>;
  meta_description?: string | null;
  meta_description_translations?: Record<string, string>;
  status: string;
  updated_at: string;
}

export function AdminPagesPage() {
  const { data, isLoading } = useAdminPagesQuery();
  const createMut = useAdminCreatePageMutation();
  const updateMut = useAdminUpdatePageMutation();
  const deleteMut = useAdminDeletePageMutation();

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [formLocale, setFormLocale] = useState<'en' | 'ta'>('en');
  const [form, setForm] = useState({
    title: { en: '', ta: '' },
    slug: '',
    content: { en: '', ta: '' },
    excerpt: { en: '', ta: '' },
    effective_date: '',
    status: 'draft' as string,
    meta_title: { en: '', ta: '' },
    meta_description: { en: '', ta: '' },
  });

  const pages: CMSPage[] = data?.data?.data ?? data?.data ?? [];

  const openCreate = () => {
    setEditId(null);
    setForm({
      title: { en: '', ta: '' },
      slug: '',
      content: { en: '', ta: '' },
      excerpt: { en: '', ta: '' },
      effective_date: '',
      status: 'draft',
      meta_title: { en: '', ta: '' },
      meta_description: { en: '', ta: '' },
    });
    setFormLocale('en');
    setShowForm(true);
  };

  const openEdit = (p: CMSPage) => {
    setEditId(p.id);
    setForm({
      title: { en: p.title_translations?.en ?? p.title, ta: p.title_translations?.ta ?? '' },
      slug: p.slug,
      content: { en: p.content_translations?.en ?? p.content ?? '', ta: p.content_translations?.ta ?? '' },
      excerpt: { en: p.excerpt_translations?.en ?? p.excerpt ?? '', ta: p.excerpt_translations?.ta ?? '' },
      effective_date: p.effective_date ?? '',
      status: p.status,
      meta_title: { en: p.meta_title_translations?.en ?? p.meta_title ?? '', ta: p.meta_title_translations?.ta ?? '' },
      meta_description: { en: p.meta_description_translations?.en ?? p.meta_description ?? '', ta: p.meta_description_translations?.ta ?? '' },
    });
    setFormLocale('en');
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
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Pages</h1>
          <p className="mt-1 text-sm text-slate-500">Create and edit static pages for your storefront</p>
        </div>
        <Button onClick={openCreate}>+ New Page</Button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{editId ? 'Edit' : 'New'} Page</h2>
            <div className="flex gap-1 rounded bg-slate-100 p-1">
              <button type="button" onClick={() => setFormLocale('en')} className={`rounded px-3 py-1 text-xs font-semibold ${formLocale === 'en' ? 'bg-white shadow' : 'text-slate-500'}`}>English</button>
              <button type="button" onClick={() => setFormLocale('ta')} className={`rounded px-3 py-1 text-xs font-semibold ${formLocale === 'ta' ? 'bg-white shadow' : 'text-slate-500'}`}>தமிழ்</button>
            </div>
          </div>
          <Input label={`Title (${formLocale.toUpperCase()})`} value={form.title[formLocale] ?? ''} onChange={(e) => setForm({ ...form, title: { ...form.title, [formLocale]: e.target.value } })} required={formLocale === 'en'} />
          <Input label="Slug (URL)" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="privacy-policy" />
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Summary ({formLocale.toUpperCase()})</label>
            <textarea
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm min-h-[90px]"
              value={form.excerpt[formLocale] ?? ''}
              onChange={(e) => setForm({ ...form, excerpt: { ...form.excerpt, [formLocale]: e.target.value } })}
            />
          </div>
          <Input
            label="Effective Date"
            type="date"
            value={form.effective_date}
            onChange={(e) => setForm({ ...form, effective_date: e.target.value })}
          />
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Content ({formLocale.toUpperCase()})</label>
            <RichTextEditor
              value={form.content[formLocale] ?? ''}
              onChange={(html) => setForm({ ...form, content: { ...form.content, [formLocale]: html } })}
              placeholder="Write your page content here..."
              minHeight="250px"
            />
          </div>
          <Input label={`Meta Title (${formLocale.toUpperCase()})`} value={form.meta_title[formLocale] ?? ''} onChange={(e) => setForm({ ...form, meta_title: { ...form.meta_title, [formLocale]: e.target.value } })} />
          <Input label={`Meta Description (${formLocale.toUpperCase()})`} value={form.meta_description[formLocale] ?? ''} onChange={(e) => setForm({ ...form, meta_description: { ...form.meta_description, [formLocale]: e.target.value } })} />
          <select
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
          <div className="flex gap-2">
            <Button type="submit" loading={createMut.isPending || updateMut.isPending}>
              {editId ? 'Update' : 'Create'}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </form>
      )}

      <div className="overflow-hidden rounded-xl border bg-white">
        <table className="w-full text-sm">
          <thead className="border-b bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Title</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Slug</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Status</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Updated</th>
              <th className="px-4 py-3 text-right font-medium text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {pages.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-900">{p.title}</td>
                <td className="px-4 py-3 font-mono text-xs text-slate-500">{p.slug}</td>
                <td className="px-4 py-3">
                  <Badge variant={p.status === 'published' ? 'success' : 'default'}>{p.status}</Badge>
                </td>
                <td className="px-4 py-3 text-slate-600">{new Date(p.updated_at).toLocaleDateString('en-IN')}</td>
                <td className="px-4 py-3 text-right space-x-1">
                  <Button size="sm" variant="outline" onClick={() => openEdit(p)}>Edit</Button>
                  <Button size="sm" variant="danger" onClick={() => { if (confirm('Delete this page?')) deleteMut.mutate(p.id); }}>Delete</Button>
                </td>
              </tr>
            ))}
            {pages.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">No pages yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
