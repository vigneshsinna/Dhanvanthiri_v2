import React, { useState } from 'react';
import { useAdminPopupsQuery, useAdminCreatePopupMutation, useAdminUpdatePopupMutation, useAdminDeletePopupMutation } from '../api';
import { Pencil, Trash2, Plus } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

interface Popup {
    id: number;
    name: string;
    image: string;
    image_translations?: Record<string, string>;
    description?: string;
    description_translations?: Record<string, string>;
    cta_url?: string;
    delay_seconds: number;
    is_active: boolean;
    starts_at?: string;
    ends_at?: string;
    created_at: string;
}

export function AdminPopupsPage() {
    const { data, isLoading } = useAdminPopupsQuery();
    const createMut = useAdminCreatePopupMutation();
    const updateMut = useAdminUpdatePopupMutation();
    const deleteMut = useAdminDeletePopupMutation();

    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState<number | null>(null);
    const [formLocale, setFormLocale] = useState<'en' | 'ta'>('en');
    const [form, setForm] = useState({
        name: '',
        image: { en: '', ta: '' },
        description: { en: '', ta: '' },
        cta_url: '',
        delay_seconds: 3,
        starts_at: '',
        ends_at: '',
        is_active: true,
    });

    const popups: Popup[] = data?.data ?? [];

    const openCreate = () => {
        setEditId(null);
        setForm({
            name: '',
            image: { en: '', ta: '' },
            description: { en: '', ta: '' },
            cta_url: '',
            delay_seconds: 3,
            starts_at: '',
            ends_at: '',
            is_active: true,
        });
        setFormLocale('en');
        setShowForm(true);
    };

    const openEdit = (p: Popup) => {
        setEditId(p.id);
        setForm({
            name: p.name,
            image: { en: p.image_translations?.en ?? p.image ?? '', ta: p.image_translations?.ta ?? '' },
            description: { en: p.description_translations?.en ?? p.description ?? '', ta: p.description_translations?.ta ?? '' },
            cta_url: p.cta_url ?? '',
            delay_seconds: p.delay_seconds,
            starts_at: p.starts_at ? new Date(p.starts_at).toISOString().slice(0, 16) : '',
            ends_at: p.ends_at ? new Date(p.ends_at).toISOString().slice(0, 16) : '',
            is_active: p.is_active,
        });
        setFormLocale('en');
        setShowForm(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const payload = { ...form };

        if (editId) updateMut.mutate({ id: editId, ...payload }, { onSuccess: () => setShowForm(false) });
        else createMut.mutate(payload, { onSuccess: () => setShowForm(false) });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-slate-900">Promotional Popups</h1>
                <Button onClick={openCreate} className="flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    <span>Add Popup</span>
                </Button>
            </div>

            {showForm && (
                <form onSubmit={handleSubmit} className="rounded-xl border bg-white p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold">{editId ? 'Edit' : 'New'} Popup</h2>
                        <div className="flex gap-1 rounded bg-slate-100 p-1">
                            <button type="button" onClick={() => setFormLocale('en')} className={`rounded px-3 py-1 text-xs font-semibold ${formLocale === 'en' ? 'bg-white shadow' : 'text-slate-500'}`}>English</button>
                            <button type="button" onClick={() => setFormLocale('ta')} className={`rounded px-3 py-1 text-xs font-semibold ${formLocale === 'ta' ? 'bg-white shadow' : 'text-slate-500'}`}>தமிழ்</button>
                        </div>
                    </div>
                    <Input label="Internal Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                    <Input
                        label={`Image URL (${formLocale.toUpperCase()})`}
                        value={form.image[formLocale] ?? ''}
                        onChange={(e) => setForm({ ...form, image: { ...form.image, [formLocale]: e.target.value } })}
                        required={formLocale === 'en'}
                        placeholder="URL to external image or uploaded file"
                    />
                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">Description ({formLocale.toUpperCase()})</label>
                        <textarea
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm min-h-[80px]"
                            value={form.description[formLocale] ?? ''}
                            onChange={(e) => setForm({ ...form, description: { ...form.description, [formLocale]: e.target.value } })}
                        />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Input label="CTA URL" value={form.cta_url} onChange={(e) => setForm({ ...form, cta_url: e.target.value })} />
                        <Input label="Delay (Seconds)" type="number" value={form.delay_seconds} onChange={(e) => setForm({ ...form, delay_seconds: Number(e.target.value) })} />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Input label="Starts At" type="datetime-local" value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} />
                        <Input label="Ends At" type="datetime-local" value={form.ends_at} onChange={(e) => setForm({ ...form, ends_at: e.target.value })} />
                    </div>
                    <label className="flex items-center gap-2">
                        <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
                        <span className="text-sm font-medium">Is Active</span>
                    </label>
                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="outline" type="button" onClick={() => setShowForm(false)}>Cancel</Button>
                        <Button type="submit" disabled={createMut.isPending || updateMut.isPending}>Save</Button>
                    </div>
                </form>
            )}

            <div className="rounded-xl border bg-white overflow-hidden">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
                        <tr>
                            <th className="px-4 py-3">Internal Name</th>
                            <th className="px-4 py-3">Image</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                        {isLoading && <tr><td colSpan={4} className="px-4 py-4 text-center text-slate-500">Loading...</td></tr>}
                        {!isLoading && popups.map((popup) => (
                            <tr key={popup.id}>
                                <td className="px-4 py-3 text-sm font-medium">{popup.name}</td>
                                <td className="px-4 py-3 text-sm"><img src={popup.image_translations?.en ?? popup.image} alt="Preview" className="h-10 w-auto rounded object-cover" /></td>
                                <td className="px-4 py-3 text-sm">
                                    {popup.is_active ? <span className="text-green-600">Active</span> : <span className="text-slate-500">Inactive</span>}
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <button onClick={() => openEdit(popup)} className="p-1 text-slate-400 hover:text-brand-600"><Pencil className="h-4 w-4" /></button>
                                    <button onClick={() => { if (confirm('Delete popup?')) deleteMut.mutate(popup.id); }} className="ml-2 p-1 text-slate-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
