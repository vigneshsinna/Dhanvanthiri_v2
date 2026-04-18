import React, { useState } from 'react';
import { useAdminAlertsQuery, useAdminCreateAlertMutation, useAdminUpdateAlertMutation, useAdminDeleteAlertMutation } from '../api';
import { Pencil, Trash2, Plus } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

interface Alert {
    id: number;
    message: string;
    message_translations?: Record<string, string>;
    bg_color: string;
    text_color: string;
    cta_url?: string;
    is_active: boolean;
    starts_at?: string;
    ends_at?: string;
    created_at: string;
}

export function AdminAlertsPage() {
    const { data, isLoading } = useAdminAlertsQuery();
    const createMut = useAdminCreateAlertMutation();
    const updateMut = useAdminUpdateAlertMutation();
    const deleteMut = useAdminDeleteAlertMutation();

    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState<number | null>(null);
    const [formLocale, setFormLocale] = useState<'en' | 'ta'>('en');
    const [form, setForm] = useState({
        message: { en: '', ta: '' },
        bg_color: 'bg-brand-600',
        text_color: 'text-white',
        cta_url: '',
        starts_at: '',
        ends_at: '',
        is_active: true,
    });

    const alerts: Alert[] = data?.data ?? [];

    const openCreate = () => {
        setEditId(null);
        setForm({
            message: { en: '', ta: '' },
            bg_color: 'bg-brand-600',
            text_color: 'text-white',
            cta_url: '',
            starts_at: '',
            ends_at: '',
            is_active: true,
        });
        setFormLocale('en');
        setShowForm(true);
    };

    const openEdit = (a: Alert) => {
        setEditId(a.id);
        setForm({
            message: { en: a.message_translations?.en ?? a.message ?? '', ta: a.message_translations?.ta ?? '' },
            bg_color: a.bg_color,
            text_color: a.text_color,
            cta_url: a.cta_url ?? '',
            starts_at: a.starts_at ? new Date(a.starts_at).toISOString().slice(0, 16) : '',
            ends_at: a.ends_at ? new Date(a.ends_at).toISOString().slice(0, 16) : '',
            is_active: a.is_active,
        });
        setFormLocale('en');
        setShowForm(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const payload = {
            ...form,
            message: form.message,
        };

        if (editId) updateMut.mutate({ id: editId, ...payload }, { onSuccess: () => setShowForm(false) });
        else createMut.mutate(payload, { onSuccess: () => setShowForm(false) });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-slate-900">Site-wide Alerts</h1>
                <Button onClick={openCreate} className="flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    <span>Add Alert</span>
                </Button>
            </div>

            {showForm && (
                <form onSubmit={handleSubmit} className="rounded-xl border bg-white p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold">{editId ? 'Edit' : 'New'} Alert</h2>
                        <div className="flex gap-1 rounded bg-slate-100 p-1">
                            <button type="button" onClick={() => setFormLocale('en')} className={`rounded px-3 py-1 text-xs font-semibold ${formLocale === 'en' ? 'bg-white shadow' : 'text-slate-500'}`}>English</button>
                            <button type="button" onClick={() => setFormLocale('ta')} className={`rounded px-3 py-1 text-xs font-semibold ${formLocale === 'ta' ? 'bg-white shadow' : 'text-slate-500'}`}>தமிழ்</button>
                        </div>
                    </div>
                    <Input
                        label={`Message (${formLocale.toUpperCase()})`}
                        value={form.message[formLocale] ?? ''}
                        onChange={(e) => setForm({ ...form, message: { ...form.message, [formLocale]: e.target.value } })}
                        required={formLocale === 'en'}
                    />
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Input label="Background Tailwind Class" value={form.bg_color} onChange={(e) => setForm({ ...form, bg_color: e.target.value })} />
                        <Input label="Text Tailwind Class" value={form.text_color} onChange={(e) => setForm({ ...form, text_color: e.target.value })} />
                    </div>
                    <Input label="CTA URL (Optional Link)" value={form.cta_url} onChange={(e) => setForm({ ...form, cta_url: e.target.value })} />
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
                            <th className="px-4 py-3">Message (EN)</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3">Dates</th>
                            <th className="px-4 py-3">Link</th>
                            <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                        {isLoading && <tr><td colSpan={5} className="px-4 py-4 text-center text-slate-500">Loading...</td></tr>}
                        {!isLoading && alerts.map((alert) => (
                            <tr key={alert.id}>
                                <td className="px-4 py-3 text-sm max-w-xs truncate">{alert.message_translations?.en ?? alert.message}</td>
                                <td className="px-4 py-3 text-sm">
                                    {alert.is_active ? <span className="text-green-600">Active</span> : <span className="text-slate-500">Inactive</span>}
                                </td>
                                <td className="px-4 py-3 text-xs text-slate-500">
                                    {alert.starts_at ? new Date(alert.starts_at).toLocaleDateString() : 'N/A'} - {alert.ends_at ? new Date(alert.ends_at).toLocaleDateString() : 'Forever'}
                                </td>
                                <td className="px-4 py-3 text-xs text-slate-500 truncate max-w-[100px]">{alert.cta_url || '-'}</td>
                                <td className="px-4 py-3 text-right">
                                    <button onClick={() => openEdit(alert)} className="p-1 text-slate-400 hover:text-brand-600"><Pencil className="h-4 w-4" /></button>
                                    <button onClick={() => { if (confirm('Delete alert?')) deleteMut.mutate(alert.id); }} className="ml-2 p-1 text-slate-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
