import { useState } from 'react';
import { useAdminBannersQuery, useAdminCreateBannerMutation, useAdminUpdateBannerMutation, useAdminDeleteBannerMutation } from '@/features/admin/api';
import { PageLoader } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { fromBannerRecord, getEmptyBannerForm, toBannerPayload, type BannerRecord, type BannerFormValue } from '@/features/admin/lib/bannerForm';

interface Banner extends BannerRecord {
  title: string;
}

export function AdminBannersPage() {
  const { data, isLoading } = useAdminBannersQuery();
  const createMut = useAdminCreateBannerMutation();
  const updateMut = useAdminUpdateBannerMutation();
  const deleteMut = useAdminDeleteBannerMutation();

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [formLocale, setFormLocale] = useState<'en' | 'ta'>('en');
  const [form, setForm] = useState<BannerFormValue>(getEmptyBannerForm());

  const banners: Banner[] = data?.data?.data ?? data?.data ?? [];

  const openCreate = () => {
    setEditId(null);
    setForm(getEmptyBannerForm());
    setFormLocale('en');
    setShowForm(true);
  };

  const openEdit = (banner: Banner) => {
    setEditId(banner.id);
    setForm(fromBannerRecord(banner));
    setFormLocale('en');
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = toBannerPayload(form);

    if (editId) {
      updateMut.mutate({ id: editId, ...payload }, { onSuccess: () => setShowForm(false) });
      return;
    }

    createMut.mutate(payload, { onSuccess: () => setShowForm(false) });
  };

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Banners</h1>
          <p className="mt-1 text-sm text-slate-500">Manage hero banners and promotional sliders</p>
        </div>
        <Button onClick={openCreate}>+ New Banner</Button>
      </div>

      {showForm ? (
        <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{editId ? 'Edit' : 'New'} Banner</h2>
            <div className="flex gap-1 rounded bg-slate-100 p-1">
              <button type="button" onClick={() => setFormLocale('en')} className={`rounded px-3 py-1 text-xs font-semibold ${formLocale === 'en' ? 'bg-white shadow' : 'text-slate-500'}`}>English</button>
              <button type="button" onClick={() => setFormLocale('ta')} className={`rounded px-3 py-1 text-xs font-semibold ${formLocale === 'ta' ? 'bg-white shadow' : 'text-slate-500'}`}>தமிழ்</button>
            </div>
          </div>
          <Input label="Internal Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input label={`Title (${formLocale.toUpperCase()})`} value={form.title[formLocale] ?? ''} onChange={(e) => setForm({ ...form, title: { ...form.title, [formLocale]: e.target.value } })} required={formLocale === 'en'} />
          <Input label={`Subtitle (${formLocale.toUpperCase()})`} value={form.subtitle[formLocale] ?? ''} onChange={(e) => setForm({ ...form, subtitle: { ...form.subtitle, [formLocale]: e.target.value } })} />
          <Input label={`CTA Text (${formLocale.toUpperCase()})`} value={form.cta_text[formLocale] ?? ''} onChange={(e) => setForm({ ...form, cta_text: { ...form.cta_text, [formLocale]: e.target.value } })} />
          <Input label="CTA URL" value={form.cta_url} onChange={(e) => setForm({ ...form, cta_url: e.target.value })} placeholder="/products" />
          <Input label="Desktop Image URL / Path" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} placeholder="/storage/banners/home-hero.jpg" required />
          <Input label="Mobile Image URL / Path" value={form.image_mobile} onChange={(e) => setForm({ ...form, image_mobile: e.target.value })} placeholder="/storage/banners/home-hero-mobile.jpg" />
          <select className="rounded-lg border border-slate-300 px-3 py-2 text-sm" value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })}>
            <option value="home_hero">Home Hero</option>
            <option value="home_secondary">Home Secondary</option>
            <option value="catalog_top">Catalog Top</option>
            <option value="sidebar">Sidebar</option>
          </select>
          <Input label="Sort Order" type="number" value={String(form.sort_order)} onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value, 10) || 0 })} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
            Active
          </label>
          <div className="flex gap-2">
            <Button type="submit" loading={createMut.isPending || updateMut.isPending}>{editId ? 'Update' : 'Create'}</Button>
            <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </form>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {banners.map((banner) => {
          const imagePath = banner.image ?? banner.image_url ?? '';
          const imageSource = imagePath.startsWith('http')
            ? imagePath
            : `${(import.meta as any).env.VITE_API_BASE_URL?.replace('/api', '') || ''}${imagePath}`;

          return (
            <div key={banner.id} className="overflow-hidden rounded-xl border bg-white">
              <img src={imageSource} alt={banner.title} className="h-40 w-full object-cover" />
              <div className="space-y-2 p-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-slate-900">{banner.title}</h3>
                  <Badge variant={banner.is_active ? 'success' : 'default'}>{banner.is_active ? 'Active' : 'Inactive'}</Badge>
                </div>
                <p className="text-xs text-slate-500">{banner.name}</p>
                <p className="text-xs text-slate-500">Position: {banner.position} · Order: {banner.sort_order}</p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => openEdit(banner)}>Edit</Button>
                  <Button size="sm" variant="danger" onClick={() => { if (confirm('Delete this banner?')) deleteMut.mutate(banner.id); }}>Delete</Button>
                </div>
              </div>
            </div>
          );
        })}
        {banners.length === 0 ? <p className="col-span-full py-8 text-center text-slate-400">No banners yet</p> : null}
      </div>
    </div>
  );
}
