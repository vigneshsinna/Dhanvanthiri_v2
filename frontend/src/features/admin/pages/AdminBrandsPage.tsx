import { useState } from 'react';
import { useAdminBrandsQuery, useAdminCreateBrandMutation, useAdminUpdateBrandMutation, useAdminDeleteBrandMutation } from '@/features/admin/api';
import { PageLoader } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { ImagePlus, X } from 'lucide-react';

interface Brand {
    id: number;
    name: string;
    name_translations?: Record<string, string>;
    slug: string;
    logo: string | null;
    is_active: boolean;
    updated_at: string;
}

export function AdminBrandsPage() {
    const { data, isLoading } = useAdminBrandsQuery();
    const createMut = useAdminCreateBrandMutation();
    const updateMut = useAdminUpdateBrandMutation();
    const deleteMut = useAdminDeleteBrandMutation();

    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState<number | null>(null);
    const [formLocale, setFormLocale] = useState<'en' | 'ta'>('en');
    const [form, setForm] = useState({ name: { en: '', ta: '' }, logo: '', is_active: true });

    const brands: Brand[] = data?.data ?? [];

    const openCreate = () => {
        setEditId(null);
        setForm({ name: { en: '', ta: '' }, logo: '', is_active: true });
        setFormLocale('en');
        setShowForm(true);
    };
    const openEdit = (b: Brand) => {
        setEditId(b.id);
        setForm({
            name: { en: b.name_translations?.en ?? b.name, ta: b.name_translations?.ta ?? '' },
            logo: b.logo ?? '',
            is_active: b.is_active
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
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Brands</h1>
                <Button onClick={openCreate}>+ New Brand</Button>
            </div>

            {showForm && (
                <form onSubmit={handleSubmit} className="rounded-xl border bg-white p-6 space-y-4 mb-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold">{editId ? 'Edit' : 'New'} Brand</h2>
                        <div className="flex gap-1 rounded bg-slate-100 p-1">
                            <button type="button" onClick={() => setFormLocale('en')} className={`rounded px-3 py-1 text-xs font-semibold ${formLocale === 'en' ? 'bg-white shadow' : 'text-slate-500'}`}>English</button>
                            <button type="button" onClick={() => setFormLocale('ta')} className={`rounded px-3 py-1 text-xs font-semibold ${formLocale === 'ta' ? 'bg-white shadow' : 'text-slate-500'}`}>தமிழ்</button>
                        </div>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-4">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700">Brand Name ({formLocale.toUpperCase()})</label>
                                <input required={formLocale === 'en'} type="text" className="w-full rounded-lg border border-slate-300 px-3 py-2" value={form.name[formLocale]} onChange={e => setForm({ ...form, name: { ...form.name, [formLocale]: e.target.value } })} />
                            </div>

                            <div className="flex items-center gap-2 mt-6">
                                <input type="checkbox" id="brandActive" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-600" />
                                <label htmlFor="brandActive" className="text-sm font-medium text-slate-700">Active Brand</label>
                            </div>
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-slate-700">Logo Image URL</label>
                            {form.logo ? (
                                <div className="relative mt-2 inline-block">
                                    <img src={form.logo} alt="Preview" className="h-24 w-24 object-contain rounded border bg-slate-50 p-1" />
                                    <button type="button" onClick={() => setForm({ ...form, logo: '' })} className="absolute -right-2 -top-2 rounded-full bg-white text-red-500 shadow hover:text-red-700">
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>
                            ) : (
                                <div className="flex h-24 w-24 items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50">
                                    <ImagePlus className="h-8 w-8 text-slate-400" />
                                </div>
                            )}
                            <input type="text" placeholder="https://..." className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={form.logo} onChange={e => setForm({ ...form, logo: e.target.value })} />
                        </div>
                    </div>

                    <div className="flex gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                        <Button type="submit" disabled={createMut.isPending || updateMut.isPending}>
                            {editId ? 'Save Changes' : 'Create Brand'}
                        </Button>
                    </div>
                </form>
            )}

            <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm text-slate-600">
                    <thead className="border-b bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                        <tr>
                            <th className="px-6 py-3">Logo</th>
                            <th className="px-6 py-3">Brand Name</th>
                            <th className="px-6 py-3">Slug</th>
                            <th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                        {brands.map((b) => (
                            <tr key={b.id} className="hover:bg-slate-50">
                                <td className="px-6 py-3">
                                    {b.logo ? (
                                        <img src={b.logo} alt={b.name} className="h-10 w-10 rounded border bg-white object-contain p-0.5" />
                                    ) : (
                                        <div className="flex h-10 w-10 items-center justify-center rounded bg-slate-100 text-xs font-medium text-slate-400">N/A</div>
                                    )}
                                </td>
                                <td className="px-6 py-3 font-medium text-slate-900">{b.name}</td>
                                <td className="px-6 py-3"><code className="rounded bg-slate-100 px-1 py-0.5 text-xs text-slate-500">{b.slug}</code></td>
                                <td className="px-6 py-3">
                                    <Badge variant={b.is_active ? 'success' : 'default'}>{b.is_active ? 'Active' : 'Hidden'}</Badge>
                                </td>
                                <td className="px-6 py-3 text-right">
                                    <Button variant="ghost" size="sm" onClick={() => openEdit(b)}>Edit</Button>
                                    <Button variant="ghost" size="sm" className="text-red-600" onClick={() => { if (confirm('Are you sure?')) deleteMut.mutate(b.id) }}>Delete</Button>
                                </td>
                            </tr>
                        ))}
                        {brands.length === 0 && (
                            <tr>
                                <td colSpan={5} className="p-8 text-center text-slate-500">No brands found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
