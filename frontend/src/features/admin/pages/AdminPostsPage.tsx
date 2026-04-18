import { useState } from 'react';
import { useAdminPostsQuery, useAdminCreatePostMutation, useAdminUpdatePostMutation, useAdminDeletePostMutation } from '@/features/admin/api';
import { PageLoader } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { RichTextEditor } from '@/components/ui/RichTextEditor';

interface Post {
  id: number;
  title: string;
  title_translations?: Record<string, string>;
  slug: string;
  category?: string;
  status: string;
  excerpt?: string;
  excerpt_translations?: Record<string, string>;
  body?: string;
  content_translations?: Record<string, string>;
  published_at?: string;
  updated_at: string;
}

export function AdminPostsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useAdminPostsQuery({ page, per_page: 15 });
  const createMut = useAdminCreatePostMutation();
  const updateMut = useAdminUpdatePostMutation();
  const deleteMut = useAdminDeletePostMutation();

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [formLocale, setFormLocale] = useState<'en' | 'ta'>('en');
  const [form, setForm] = useState({ title: { en: '', ta: '' }, excerpt: { en: '', ta: '' }, body: { en: '', ta: '' }, category: '', status: 'draft' as string });

  const posts: Post[] = data?.data?.data ?? data?.data ?? [];
  const pagination = data?.data?.meta ?? data?.meta ?? null;

  const openCreate = () => {
    setEditId(null);
    setForm({ title: { en: '', ta: '' }, excerpt: { en: '', ta: '' }, body: { en: '', ta: '' }, category: '', status: 'draft' });
    setFormLocale('en');
    setShowForm(true);
  };
  const openEdit = (p: Post) => {
    setEditId(p.id);
    setForm({
      title: { en: p.title_translations?.en ?? p.title, ta: p.title_translations?.ta ?? '' },
      excerpt: { en: p.excerpt_translations?.en ?? p.excerpt ?? '', ta: p.excerpt_translations?.ta ?? '' },
      body: { en: p.content_translations?.en ?? p.body ?? '', ta: p.content_translations?.ta ?? '' },
      category: p.category ?? '',
      status: p.status
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
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Blog Posts</h1>
          <p className="mt-1 text-sm text-slate-500">Publish and manage blog content</p>
        </div>
        <Button onClick={openCreate}>+ New Post</Button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{editId ? 'Edit' : 'New'} Post</h2>
            <div className="flex gap-1 rounded bg-slate-100 p-1">
              <button type="button" onClick={() => setFormLocale('en')} className={`rounded px-3 py-1 text-xs font-semibold ${formLocale === 'en' ? 'bg-white shadow' : 'text-slate-500'}`}>English</button>
              <button type="button" onClick={() => setFormLocale('ta')} className={`rounded px-3 py-1 text-xs font-semibold ${formLocale === 'ta' ? 'bg-white shadow' : 'text-slate-500'}`}>தமிழ்</button>
            </div>
          </div>
          <Input label={`Title (${formLocale.toUpperCase()})`} value={form.title[formLocale] ?? ''} onChange={(e) => setForm({ ...form, title: { ...form.title, [formLocale]: e.target.value } })} required={formLocale === 'en'} />
          <Input label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Excerpt ({formLocale.toUpperCase()})</label>
            <textarea
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm min-h-[80px]"
              value={form.excerpt[formLocale] ?? ''}
              onChange={(e) => setForm({ ...form, excerpt: { ...form.excerpt, [formLocale]: e.target.value } })}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Body ({formLocale.toUpperCase()})</label>
            <RichTextEditor
              value={form.body[formLocale] ?? ''}
              onChange={(html) => setForm({ ...form, body: { ...form.body, [formLocale]: html } })}
              placeholder="Write your post content here..."
              minHeight="200px"
            />
          </div>
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
              <th className="px-4 py-3 text-left font-medium text-slate-600">Category</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Status</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Updated</th>
              <th className="px-4 py-3 text-right font-medium text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {posts.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-900">{p.title}</td>
                <td className="px-4 py-3 text-slate-600">{p.category ?? '-'}</td>
                <td className="px-4 py-3">
                  <Badge variant={p.status === 'published' ? 'success' : 'default'}>{p.status}</Badge>
                </td>
                <td className="px-4 py-3 text-slate-600">{new Date(p.updated_at).toLocaleDateString('en-IN')}</td>
                <td className="px-4 py-3 text-right space-x-1">
                  <Button size="sm" variant="outline" onClick={() => openEdit(p)}>Edit</Button>
                  <Button size="sm" variant="danger" onClick={() => { if (confirm('Delete this post?')) deleteMut.mutate(p.id); }}>Delete</Button>
                </td>
              </tr>
            ))}
            {posts.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">No posts yet</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {pagination && pagination.last_page > 1 && (
        <div className="flex justify-center gap-2">
          <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1} className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-50">Prev</button>
          <span className="px-3 py-1.5 text-sm text-slate-600">Page {page} of {pagination.last_page}</span>
          <button onClick={() => setPage(page + 1)} disabled={page >= pagination.last_page} className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-50">Next</button>
        </div>
      )}
    </div>
  );
}
