import React, { useState } from 'react';
import { useAdminSubscribersQuery, useAdminToggleSubscriberMutation, useAdminDeleteSubscriberMutation } from '../api';
import { Trash2, ToggleLeft, ToggleRight, Search } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface Subscriber {
    id: number;
    email: string;
    source?: string;
    is_active: boolean;
    unsubscribed_at?: string;
    created_at: string;
}

export function AdminSubscribersPage() {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');

    const queryParams: any = { page };
    if (filter !== 'all') queryParams.status = filter;
    if (search) queryParams.search = search;

    const { data, isLoading } = useAdminSubscribersQuery(queryParams);
    const toggleMut = useAdminToggleSubscriberMutation();
    const deleteMut = useAdminDeleteSubscriberMutation();

    const subscribers: Subscriber[] = data?.data ?? [];
    const meta = data?.meta;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h1 className="text-2xl font-bold text-slate-900">Newsletter Subscribers</h1>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search email..."
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                            className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-brand-500"
                        />
                    </div>
                    <div className="flex bg-slate-100 rounded-lg p-1 shrink-0">
                        {['all', 'active', 'inactive'].map((f) => (
                            <button
                                key={f}
                                onClick={() => { setFilter(f as any); setPage(1); }}
                                className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize ${filter === f ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="rounded-xl border bg-white overflow-hidden">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
                        <tr>
                            <th className="px-4 py-3">Email</th>
                            <th className="px-4 py-3">Source</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3">Subscribed On</th>
                            <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                        {isLoading && <tr><td colSpan={5} className="px-4 py-4 text-center text-slate-500">Loading...</td></tr>}
                        {!isLoading && subscribers.map((sub) => (
                            <tr key={sub.id}>
                                <td className="px-4 py-3 text-sm font-medium text-slate-900">{sub.email}</td>
                                <td className="px-4 py-3 text-sm text-slate-500 capitalize">{sub.source?.replace('_', ' ') || '-'}</td>
                                <td className="px-4 py-3 text-sm">
                                    {sub.is_active ?
                                        <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">Active</span>
                                        :
                                        <span className="inline-flex items-center rounded-full bg-slate-50 px-2 py-1 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-500/10">Unsubscribed</span>
                                    }
                                </td>
                                <td className="px-4 py-3 text-sm text-slate-500">{new Date(sub.created_at).toLocaleDateString()}</td>
                                <td className="px-4 py-3 text-right">
                                    <button onClick={() => toggleMut.mutate(sub.id)} className={`p-1 mr-2 ${sub.is_active ? 'text-brand-600' : 'text-slate-400'}`} title="Toggle Status">
                                        {sub.is_active ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5" />}
                                    </button>
                                    <button onClick={() => { if (confirm('Delete subscriber?')) deleteMut.mutate(sub.id); }} className="p-1 text-slate-400 hover:text-red-600" title="Delete">
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {!isLoading && subscribers.length === 0 && (
                            <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">No subscribers found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {meta && meta.last_page > 1 && (
                <div className="flex justify-between items-center mt-4">
                    <Button variant="outline" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
                    <span className="text-sm text-slate-500">Page {page} of {meta.last_page}</span>
                    <Button variant="outline" disabled={page === meta.last_page} onClick={() => setPage(p => p + 1)}>Next</Button>
                </div>
            )}
        </div>
    );
}
