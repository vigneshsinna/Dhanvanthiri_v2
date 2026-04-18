import { useState } from 'react';
import { useAdminReviewsQuery, useAdminUpdateReviewMutation, useAdminDeleteReviewMutation, useAdminCreateCustomReviewMutation, useAdminProductsQuery } from '@/features/admin/api';
import { PageLoader } from '@/components/ui/Spinner';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Star, Plus, ChevronLeft, ChevronRight } from 'lucide-react';

interface Review {
  id: number;
  user_name: string;
  product_name: string;
  rating: number;
  title?: string;
  body: string;
  status: string;
  created_at: string;
  photos?: string[];
  is_custom?: boolean;
  custom_reviewer_name?: string;
}

const stars = (n: number) => '★'.repeat(n) + '☆'.repeat(5 - n);

export function AdminReviewsPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const { data, isLoading } = useAdminReviewsQuery({ page, per_page: 15, status: statusFilter || undefined });
  const updateMut = useAdminUpdateReviewMutation();
  const deleteMut = useAdminDeleteReviewMutation();
  const customMut = useAdminCreateCustomReviewMutation();

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ product_id: '', custom_reviewer_name: '', rating: 5, title: '', body: '' });

  const { data: productsData } = useAdminProductsQuery({ per_page: 100 });
  const products = productsData?.data?.data || [];

  const reviews: Review[] = data?.data?.data ?? data?.data ?? [];
  const pagination = data?.data?.meta ?? data?.meta ?? null;

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Reviews</h1>
          <p className="mt-1 text-sm text-slate-500">Moderate customer reviews and add custom testimonials</p>
        </div>
        <Button onClick={() => setShowModal(true)}><Plus className="mr-1.5 h-4 w-4" />Add Custom Review</Button>
      </div>

      <div className="flex gap-2">
        {['', 'pending', 'approved', 'rejected'].map((s) => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setPage(1); }}
            className={`rounded-lg px-4 py-2 text-sm font-medium capitalize transition ${statusFilter === s ? 'bg-brand-600 text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'}`}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {reviews.map((r) => (
          <div key={r.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="font-medium text-slate-900 flex items-center gap-2">
                  {r.is_custom ? (
                    <>
                      <span>{r.custom_reviewer_name}</span>
                      <Badge variant="info">Custom</Badge>
                    </>
                  ) : (
                    r.user_name
                  )}
                </div>
                <p className="text-xs text-slate-500">on <strong>{r.product_name}</strong> · {new Date(r.created_at).toLocaleDateString('en-IN')}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-amber-500 text-sm">{stars(r.rating)}</span>
                <Badge variant={r.status === 'approved' ? 'success' : r.status === 'rejected' ? 'danger' : 'warning'}>{r.status}</Badge>
              </div>
            </div>
            {r.title && <p className="mt-2 font-semibold text-slate-800">{r.title}</p>}
            <p className="mt-1 text-sm text-slate-600">{r.body}</p>

            {r.photos && r.photos.length > 0 && (
              <div className="mt-3 flex gap-2">
                {r.photos.map((photo, i) => {
                  const photoUrl = photo.startsWith('http') ? photo : `${(import.meta as any).env.VITE_API_BASE_URL?.replace('/api', '') || ''}${photo}`;
                  return (
                    <a href={photoUrl} target="_blank" rel="noopener noreferrer" key={i}>
                      <img src={photoUrl} alt="Review attached" className="h-12 w-12 rounded object-cover border" />
                    </a>
                  );
                })}
              </div>
            )}

            <div className="mt-3 flex gap-2">
              {r.status !== 'approved' && (
                <Button size="sm" onClick={() => updateMut.mutate({ id: r.id, status: 'approved' })}>Approve</Button>
              )}
              {r.status !== 'rejected' && (
                <Button size="sm" variant="outline" onClick={() => updateMut.mutate({ id: r.id, status: 'rejected' })}>Reject</Button>
              )}
              <Button size="sm" variant="danger" onClick={() => { if (confirm('Delete this review?')) deleteMut.mutate(r.id); }}>Delete</Button>
            </div>
          </div>
        ))}
        {reviews.length === 0 && (
          <p className="py-8 text-center text-slate-400">No reviews found</p>
        )}
      </div>

      {pagination && pagination.last_page > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1} className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm disabled:opacity-40"><ChevronLeft className="h-4 w-4" /> Prev</button>
          <span className="px-3 py-1.5 text-sm text-slate-600">Page {page} of {pagination.last_page}</span>
          <button onClick={() => setPage(page + 1)} disabled={page >= pagination.last_page} className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm disabled:opacity-40">Next <ChevronRight className="h-4 w-4" /></button>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-xl font-bold">Add Custom Review</h2>
            <form onSubmit={async (e) => {
              e.preventDefault();
              await customMut.mutateAsync({ ...form, product_id: Number(form.product_id) });
              setShowModal(false);
              setForm({ product_id: '', custom_reviewer_name: '', rating: 5, title: '', body: '' });
            }} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Product</label>
                <select required className="w-full rounded-lg border p-2" value={form.product_id} onChange={e => setForm({ ...form, product_id: e.target.value })}>
                  <option value="">Select a product...</option>
                  {products.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Reviewer Name</label>
                <input required className="w-full rounded-lg border p-2" value={form.custom_reviewer_name} onChange={e => setForm({ ...form, custom_reviewer_name: e.target.value })} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Rating (1-5)</label>
                <input type="number" min="1" max="5" required className="w-full rounded-lg border p-2" value={form.rating} onChange={e => setForm({ ...form, rating: Number(e.target.value) })} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Title (optional)</label>
                <input className="w-full rounded-lg border p-2" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Review Body</label>
                <textarea required rows={3} className="w-full rounded-lg border p-2" value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button type="submit" loading={customMut.isPending}>Submit Review</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
