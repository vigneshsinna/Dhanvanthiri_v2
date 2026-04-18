import React, { useState } from 'react';
import { useAdminContactMessagesQuery, useAdminUpdateContactMessageMutation, useAdminDeleteContactMessageMutation } from '../api';
import { Trash2, Eye, MailCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ContactMessage {
    id: number;
    name: string;
    email: string;
    phone?: string;
    subject?: string;
    message: string;
    is_read: boolean;
    notes?: string;
    created_at: string;
}

export function AdminContactMessagesPage() {
    const [page, setPage] = useState(1);
    const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');

    const queryParams: any = { page };
    if (filter !== 'all') queryParams.status = filter;

    const { data, isLoading } = useAdminContactMessagesQuery(queryParams);
    const updateMut = useAdminUpdateContactMessageMutation();
    const deleteMut = useAdminDeleteContactMessageMutation();

    const [viewMessage, setViewMessage] = useState<ContactMessage | null>(null);

    const messages: ContactMessage[] = data?.data ?? [];
    const meta = data?.meta;

    const handleMarkAsRead = (msg: ContactMessage) => {
        updateMut.mutate({ id: msg.id, notes: msg.notes });
    };

    const handleView = (msg: ContactMessage) => {
        setViewMessage(msg);
        if (!msg.is_read) {
            handleMarkAsRead(msg); // Auto-mark read
        }
    };

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Contact Messages</h1>
                    <p className="mt-1 text-sm text-slate-500">View and respond to customer enquiries</p>
                </div>
                <div className="flex bg-slate-100 rounded-lg p-1">
                    {['all', 'unread', 'read'].map((f) => (
                        <button
                            key={f}
                            onClick={() => { setFilter(f as any); setPage(1); }}
                            className={`px-4 py-1.5 text-sm font-medium rounded-md capitalize ${filter === f ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {viewMessage && (
                <div className="rounded-xl border bg-white p-6 space-y-4">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-lg font-semibold">{viewMessage.subject || 'No Subject'}</h2>
                            <p className="text-sm text-slate-500">From: {viewMessage.name} &lt;{viewMessage.email}&gt; {viewMessage.phone && `| ${viewMessage.phone}`}</p>
                            <p className="text-xs text-slate-400 mt-1">{new Date(viewMessage.created_at).toLocaleString()}</p>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => setViewMessage(null)}>Close</Button>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-lg text-slate-800 text-sm whitespace-pre-wrap">
                        {viewMessage.message}
                    </div>
                </div>
            )}

            <div className="rounded-xl border bg-white overflow-hidden">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
                        <tr>
                            <th className="px-4 py-3">Sender</th>
                            <th className="px-4 py-3">Subject</th>
                            <th className="px-4 py-3">Date</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                        {isLoading && <tr><td colSpan={5} className="px-4 py-4 text-center text-slate-500">Loading...</td></tr>}
                        {!isLoading && messages.map((msg) => (
                            <tr key={msg.id} className={!msg.is_read ? 'bg-blue-50/50' : ''}>
                                <td className="px-4 py-3 text-sm">
                                    <div className="font-medium text-slate-900">{msg.name}</div>
                                    <div className="text-slate-500 text-xs">{msg.email}</div>
                                </td>
                                <td className="px-4 py-3 text-sm text-slate-700 truncate max-w-[200px]">{msg.subject || '-'}</td>
                                <td className="px-4 py-3 text-sm text-slate-500">{new Date(msg.created_at).toLocaleDateString()}</td>
                                <td className="px-4 py-3 text-sm">
                                    {msg.is_read ? <span className="text-slate-500">Read</span> : <span className="text-brand-600 font-medium">Unread</span>}
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <button onClick={() => handleView(msg)} className="p-1 text-slate-400 hover:text-brand-600 mr-2" title="View"><Eye className="h-4 w-4" /></button>
                                    {!msg.is_read && (
                                        <button onClick={() => handleMarkAsRead(msg)} className="p-1 text-slate-400 hover:text-green-600 mr-2" title="Mark as Read"><MailCheck className="h-4 w-4" /></button>
                                    )}
                                    <button onClick={() => { if (confirm('Delete message?')) deleteMut.mutate(msg.id); }} className="p-1 text-slate-400 hover:text-red-600" title="Delete"><Trash2 className="h-4 w-4" /></button>
                                </td>
                            </tr>
                        ))}
                        {!isLoading && messages.length === 0 && (
                            <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">No messages found.</td></tr>
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
