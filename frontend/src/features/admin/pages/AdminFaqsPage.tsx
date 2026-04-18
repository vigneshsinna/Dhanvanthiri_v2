import { useState } from 'react';
import { useAdminFaqsQuery, useAdminCreateFaqMutation, useAdminUpdateFaqMutation, useAdminDeleteFaqMutation } from '@/features/admin/api';
import { PageLoader } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface FAQ {
  id: number;
  question: string;
  answer: string;
  question_translations?: Record<string, string>;
  answer_translations?: Record<string, string>;
  category: string;
  sort_order: number;
  is_active: boolean;
}

export function AdminFaqsPage() {
  const { data, isLoading } = useAdminFaqsQuery();
  const createMut = useAdminCreateFaqMutation();
  const updateMut = useAdminUpdateFaqMutation();
  const deleteMut = useAdminDeleteFaqMutation();

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [formLocale, setFormLocale] = useState<'en' | 'ta'>('en');
  const [form, setForm] = useState({
    question: { en: '', ta: '' },
    answer: { en: '', ta: '' },
    category: 'General', sort_order: 0, is_active: true
  });

  const faqs: FAQ[] = data?.data?.data ?? data?.data ?? [];

  const openCreate = () => {
    setEditId(null);
    setForm({ question: { en: '', ta: '' }, answer: { en: '', ta: '' }, category: 'General', sort_order: 0, is_active: true });
    setFormLocale('en');
    setShowForm(true);
  };
  const openEdit = (f: FAQ) => {
    setEditId(f.id);
    setForm({
      question: { en: f.question_translations?.en ?? f.question, ta: f.question_translations?.ta ?? '' },
      answer: { en: f.answer_translations?.en ?? f.answer, ta: f.answer_translations?.ta ?? '' },
      category: f.category, sort_order: f.sort_order, is_active: f.is_active
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

  // Group by category
  const grouped: Record<string, FAQ[]> = {};
  faqs.forEach((f) => {
    if (!grouped[f.category]) grouped[f.category] = [];
    grouped[f.category].push(f);
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">FAQs</h1>
        <Button onClick={openCreate}>+ New FAQ</Button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-xl border bg-white p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{editId ? 'Edit' : 'New'} FAQ</h2>
            <div className="flex gap-1 rounded bg-slate-100 p-1">
              <button type="button" onClick={() => setFormLocale('en')} className={`rounded px-3 py-1 text-xs font-semibold ${formLocale === 'en' ? 'bg-white shadow' : 'text-slate-500'}`}>English</button>
              <button type="button" onClick={() => setFormLocale('ta')} className={`rounded px-3 py-1 text-xs font-semibold ${formLocale === 'ta' ? 'bg-white shadow' : 'text-slate-500'}`}>தமிழ்</button>
            </div>
          </div>
          <Input label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required />
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Question ({formLocale.toUpperCase()})</label>
            <textarea
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm min-h-[60px]"
              value={form.question[formLocale]}
              onChange={(e) => setForm({ ...form, question: { ...form.question, [formLocale]: e.target.value } })}
              required={formLocale === 'en'}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Answer ({formLocale.toUpperCase()})</label>
            <textarea
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm min-h-[120px]"
              value={form.answer[formLocale]}
              onChange={(e) => setForm({ ...form, answer: { ...form.answer, [formLocale]: e.target.value } })}
              required={formLocale === 'en'}
            />
          </div>
          <Input label="Sort Order" type="number" value={String(form.sort_order)} onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
            Active
          </label>
          <div className="flex gap-2">
            <Button type="submit" loading={createMut.isPending || updateMut.isPending}>
              {editId ? 'Update' : 'Create'}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </form>
      )}

      {Object.entries(grouped).map(([category, items]) => (
        <div key={category} className="rounded-xl border bg-white">
          <h3 className="border-b bg-slate-50 px-4 py-3 font-semibold text-slate-700">{category}</h3>
          <div className="divide-y">
            {items.map((f) => (
              <div key={f.id} className="px-4 py-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">{f.question}</p>
                    <p className="mt-1 text-sm text-slate-600">{f.answer}</p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button size="sm" variant="outline" onClick={() => openEdit(f)}>Edit</Button>
                    <Button size="sm" variant="danger" onClick={() => { if (confirm('Delete?')) deleteMut.mutate(f.id); }}>Delete</Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {faqs.length === 0 && (
        <p className="py-8 text-center text-slate-400">No FAQs yet</p>
      )}
    </div>
  );
}
