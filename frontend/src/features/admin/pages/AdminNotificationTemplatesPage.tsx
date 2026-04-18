import React, { useState } from 'react';
import { useAdminNotificationTemplatesQuery, useAdminUpdateNotificationTemplateMutation } from '../api';
import { Pencil } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { RichTextEditor } from '@/components/ui/RichTextEditor';

interface NotificationTemplate {
    id: number;
    type: string;
    context: string;
    subject: Record<string, string>;
    content: Record<string, string>;
    variables?: string[];
    is_active: boolean;
}

export function AdminNotificationTemplatesPage() {
    const { data, isLoading } = useAdminNotificationTemplatesQuery();
    const updateMut = useAdminUpdateNotificationTemplateMutation();

    const [editId, setEditId] = useState<number | null>(null);
    const [formLocale, setFormLocale] = useState<'en' | 'ta'>('en');
    const [form, setForm] = useState({
        subject: { en: '', ta: '' },
        content: { en: '', ta: '' },
        is_active: true,
    });

    const templates = getNotificationTemplates(data);

    const openEdit = (t: NotificationTemplate) => {
        setEditId(t.id);
        setForm({
            subject: { en: t.subject?.en ?? '', ta: t.subject?.ta ?? '' },
            content: { en: t.content?.en ?? '', ta: t.content?.ta ?? '' },
            is_active: t.is_active,
        });
        setFormLocale('en');
    };

    const currentEditingTemplate = editId ? templates.find(t => t.id === editId) : null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editId) return;

        updateMut.mutate({
            id: editId,
            ...form,
        }, {
            onSuccess: () => setEditId(null)
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-slate-900">Notification Templates</h1>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Left Column: Template List */}
                <div className="lg:col-span-1 rounded-xl border bg-white overflow-hidden shadow-sm h-[calc(100vh-200px)] overflow-y-auto">
                    {isLoading && <div className="p-4 text-center text-slate-500">Loading...</div>}
                    <div className="divide-y divide-slate-100">
                        {templates.map(t => (
                            <button
                                key={t.id}
                                onClick={() => openEdit(t)}
                                aria-label={`${t.type} ${t.context.replace(/_/g, ' ')}`}
                                className={`w-full text-left p-4 hover:bg-slate-50 transition-colors ${editId === t.id ? 'bg-brand-50 border-l-4 border-brand-600' : 'border-l-4 border-transparent'}`}
                            >
                                <div className="flex items-start justify-between">
                                    <div>
                                        <span className={`text-xs font-semibold uppercase tracking-wider ${t.type === 'email' ? 'text-blue-600' : 'text-purple-600'}`}>
                                            {t.type}
                                        </span>
                                        <p className="mt-1 text-sm font-medium text-slate-900 capitalize">{t.context.replace(/_/g, ' ')}</p>
                                    </div>
                                    {!t.is_active && <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-600">Inactive</span>}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Right Column: Editor */}
                <div className="lg:col-span-2">
                    {editId && currentEditingTemplate ? (
                        <form onSubmit={handleSubmit} className="rounded-xl border bg-white p-6 shadow-sm">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-lg font-semibold text-slate-900 capitalize">{currentEditingTemplate.context.replace(/_/g, ' ')} Template</h2>
                                    <p className="text-sm text-slate-500">Delivery via {currentEditingTemplate.type.toUpperCase()}</p>
                                </div>
                                <div className="flex gap-1 rounded bg-slate-100 p-1">
                                    <button type="button" onClick={() => setFormLocale('en')} className={`rounded px-3 py-1 text-xs font-semibold ${formLocale === 'en' ? 'bg-white shadow' : 'text-slate-500'}`}>English</button>
                                    <button type="button" onClick={() => setFormLocale('ta')} className={`rounded px-3 py-1 text-xs font-semibold ${formLocale === 'ta' ? 'bg-white shadow' : 'text-slate-500'}`}>தமிழ்</button>
                                </div>
                            </div>

                            {currentEditingTemplate.variables && currentEditingTemplate.variables.length > 0 && (
                                <div className="mb-6 p-4 rounded-lg bg-blue-50 border border-blue-100">
                                    <h3 className="text-xs font-semibold uppercase tracking-wider text-blue-800 mb-2">Available Variables</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {currentEditingTemplate.variables.map(v => (
                                            <span key={v} className="inline-flex items-center rounded bg-white px-2 py-1 text-xs font-medium text-blue-700 shadow-sm">
                                                {v}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="space-y-4">
                                <Input
                                    label={`Subject / Title (${formLocale.toUpperCase()})`}
                                    value={form.subject[formLocale] ?? ''}
                                    onChange={(e) => setForm({ ...form, subject: { ...form.subject, [formLocale]: e.target.value } })}
                                    required={formLocale === 'en'}
                                />

                                <div>
                                    <label className="mb-1 block text-sm font-medium text-slate-700">Content ({formLocale.toUpperCase()})</label>
                                    {currentEditingTemplate.type === 'email' ? (
                                        <RichTextEditor
                                            value={form.content[formLocale] ?? ''}
                                            onChange={(html) => setForm({ ...form, content: { ...form.content, [formLocale]: html } })}
                                            placeholder="Write your email content here..."
                                            minHeight="250px"
                                        />
                                    ) : (
                                        <textarea
                                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm min-h-[250px]"
                                            value={form.content[formLocale] ?? ''}
                                            onChange={(e) => setForm({ ...form, content: { ...form.content, [formLocale]: e.target.value } })}
                                            required={formLocale === 'en'}
                                            placeholder="SMS text content..."
                                        />
                                    )}
                                    <p className="text-xs text-slate-500 mt-1">Use <code>{`{{ variable }}`}</code> syntax for inserting variables.</p>
                                </div>

                                <label className="flex items-center gap-2 pt-2">
                                    <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
                                    <span className="text-sm font-medium text-slate-700">Enable this template</span>
                                </label>

                                <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-slate-100">
                                    <Button variant="outline" type="button" onClick={() => setEditId(null)}>Cancel</Button>
                                    <Button type="submit" disabled={updateMut.isPending}>Save Template</Button>
                                </div>
                            </div>
                        </form>
                    ) : (
                        <div className="flex h-full min-h-[400px] items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50">
                            <div className="text-center text-slate-500">
                                <Pencil className="mx-auto h-8 w-8 text-slate-400 mb-3" />
                                <p>Select a template from the list to edit</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function getNotificationTemplates(payload: unknown): NotificationTemplate[] {
    if (!payload || typeof payload !== 'object') {
        return [];
    }

    const root = payload as {
        data?: NotificationTemplate[] | {
            data?: NotificationTemplate[];
        };
    };

    if (Array.isArray(root.data)) {
        return root.data;
    }

    if (root.data && typeof root.data === 'object' && Array.isArray(root.data.data)) {
        return root.data.data;
    }

    return [];
}
