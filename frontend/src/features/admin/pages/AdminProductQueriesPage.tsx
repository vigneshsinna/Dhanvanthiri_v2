import { useState } from 'react';
import {
    useAdminProductQueriesQuery,
    useAdminAnswerQueryMutation,
    useAdminRejectQueryMutation,
    useAdminDeleteQueryMutation,
} from '@/features/admin/api';
import { PageLoader } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

interface PQuery {
    id: number;
    question: string;
    answer: string | null;
    status: 'pending' | 'answered' | 'rejected';
    customer_name: string | null;
    customer_email: string | null;
    product: { id: number; name: string; slug: string } | null;
    user: { id: number; name: string; email: string } | null;
    created_at: string;
    answered_at: string | null;
}

export function AdminProductQueriesPage() {
    const [statusFilter, setStatusFilter] = useState<string>('');
    const { data, isLoading } = useAdminProductQueriesQuery({ status: statusFilter || undefined });
    const answerMut = useAdminAnswerQueryMutation();
    const rejectMut = useAdminRejectQueryMutation();
    const deleteMut = useAdminDeleteQueryMutation();

    const [answeringId, setAnsweringId] = useState<number | null>(null);
    const [answerText, setAnswerText] = useState('');

    const queries: PQuery[] = data?.data?.data ?? data?.data ?? [];

    const handleAnswer = (id: number) => {
        if (!answerText.trim()) return;
        answerMut.mutate({ id, answer: answerText }, {
            onSuccess: () => { setAnsweringId(null); setAnswerText(''); },
        });
    };

    if (isLoading) return <PageLoader />;

    const statusColors: Record<string, 'success' | 'warning' | 'danger'> = {
        answered: 'success',
        pending: 'warning',
        rejected: 'danger',
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Product Q&A</h1>
                <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
                    {['', 'pending', 'answered', 'rejected'].map((s) => (
                        <button
                            key={s}
                            onClick={() => setStatusFilter(s)}
                            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${statusFilter === s ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            {s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All'}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-3">
                {queries.map((q) => (
                    <div key={q.id} className="rounded-xl border bg-white p-5 shadow-sm">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <Badge variant={statusColors[q.status] || 'warning'}>{q.status}</Badge>
                                    {q.product && (
                                        <span className="text-xs text-slate-500">
                                            on <span className="font-medium text-slate-700">{q.product.name}</span>
                                        </span>
                                    )}
                                </div>
                                <p className="font-medium text-slate-900">{q.question}</p>
                                <p className="mt-1 text-xs text-slate-500">
                                    By {q.customer_name || q.user?.name || 'Anonymous'} • {new Date(q.created_at).toLocaleDateString()}
                                </p>

                                {q.answer && (
                                    <div className="mt-3 rounded-lg bg-green-50 border border-green-100 p-3">
                                        <p className="text-sm font-medium text-green-800">Answer:</p>
                                        <p className="text-sm text-green-700">{q.answer}</p>
                                    </div>
                                )}

                                {answeringId === q.id && (
                                    <div className="mt-3 space-y-2">
                                        <textarea
                                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm min-h-[80px]"
                                            placeholder="Type your answer..."
                                            value={answerText}
                                            onChange={(e) => setAnswerText(e.target.value)}
                                        />
                                        <div className="flex gap-2">
                                            <Button size="sm" onClick={() => handleAnswer(q.id)} disabled={answerMut.isPending}>
                                                Submit Answer
                                            </Button>
                                            <Button size="sm" variant="ghost" onClick={() => { setAnsweringId(null); setAnswerText(''); }}>
                                                Cancel
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-shrink-0 gap-1">
                                {q.status === 'pending' && answeringId !== q.id && (
                                    <>
                                        <Button size="sm" variant="outline" onClick={() => { setAnsweringId(q.id); setAnswerText(q.answer || ''); }}>
                                            Answer
                                        </Button>
                                        <Button size="sm" variant="ghost" className="text-red-600" onClick={() => rejectMut.mutate(q.id)}>
                                            Reject
                                        </Button>
                                    </>
                                )}
                                {q.status === 'answered' && answeringId !== q.id && (
                                    <Button size="sm" variant="ghost" onClick={() => { setAnsweringId(q.id); setAnswerText(q.answer || ''); }}>
                                        Edit
                                    </Button>
                                )}
                                <Button size="sm" variant="ghost" className="text-red-600" onClick={() => { if (confirm('Delete this question?')) deleteMut.mutate(q.id); }}>
                                    Delete
                                </Button>
                            </div>
                        </div>
                    </div>
                ))}
                {queries.length === 0 && (
                    <div className="rounded-xl border border-dashed bg-white p-10 text-center text-slate-500">
                        No questions found.
                    </div>
                )}
            </div>
        </div>
    );
}
