import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useProductQueriesQuery, useSubmitProductQueryMutation, useCrossSellsQuery } from '@/features/catalog/api';
import { useAddCartItemMutation } from '@/features/cart/api';
import { useAppSelector } from '@/lib/utils/hooks';
import { unwrapCollection } from '@/lib/collections';
import { resolveProductImageUrl } from '@/lib/productImage';
import { ChevronDown, ChevronUp, MessageCircleQuestion, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/Button';

// ──────────────────────────────────────
// Q&A Accordion
// ──────────────────────────────────────

interface QAItem {
    id: number;
    question: string;
    answer: string;
    customer_name: string;
    answered_at: string;
}

export function ProductQASection({ productId }: { productId: number }) {
    const { data } = useProductQueriesQuery(productId);
    const submitMut = useSubmitProductQueryMutation(productId);
    const { isAuthenticated } = useAppSelector((s) => s.auth);

    const [showForm, setShowForm] = useState(false);
    const [question, setQuestion] = useState('');
    const [name, setName] = useState('');
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [submitted, setSubmitted] = useState(false);

    const queries = unwrapCollection<QAItem>(data);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!question.trim()) return;
        submitMut.mutate(
            { question, customer_name: name || undefined },
            {
                onSuccess: () => {
                    setQuestion('');
                    setName('');
                    setShowForm(false);
                    setSubmitted(true);
                },
            }
        );
    };

    return (
        <div className="mt-12">
            <div className="flex items-center justify-between mb-6">
                <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900">
                    <MessageCircleQuestion className="h-5 w-5 text-brand-600" />
                    Questions & Answers
                    {queries.length > 0 && (
                        <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-semibold text-brand-700">
                            {queries.length}
                        </span>
                    )}
                </h2>
                <Button size="sm" variant="outline" onClick={() => setShowForm(!showForm)}>
                    Ask a Question
                </Button>
            </div>

            {submitted && !showForm && (
                <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                    Thank you! Your question has been submitted and will be answered shortly.
                </div>
            )}

            {showForm && (
                <form onSubmit={handleSubmit} className="mb-6 rounded-xl border bg-white p-5 shadow-sm space-y-3">
                    {!isAuthenticated && (
                        <input
                            type="text"
                            placeholder="Your name (optional)"
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    )}
                    <textarea
                        placeholder="Write your question about this product..."
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm min-h-[80px]"
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        required
                    />
                    <div className="flex gap-2">
                        <Button type="submit" size="sm" disabled={submitMut.isPending}>
                            {submitMut.isPending ? 'Submitting...' : 'Submit Question'}
                        </Button>
                        <Button type="button" size="sm" variant="ghost" onClick={() => setShowForm(false)}>
                            Cancel
                        </Button>
                    </div>
                </form>
            )}

            {queries.length > 0 ? (
                <div className="space-y-2">
                    {queries.map((q) => (
                        <div key={q.id} className="rounded-xl border bg-white overflow-hidden">
                            <button
                                onClick={() => setExpandedId(expandedId === q.id ? null : q.id)}
                                className="flex w-full items-start justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                            >
                                <div className="flex-1 pr-4">
                                    <p className="font-medium text-slate-900 text-sm">Q: {q.question}</p>
                                    <p className="text-xs text-slate-500 mt-1">
                                        Asked by {q.customer_name} • {q.answered_at}
                                    </p>
                                </div>
                                {expandedId === q.id ? (
                                    <ChevronUp className="h-4 w-4 text-slate-400 flex-shrink-0 mt-1" />
                                ) : (
                                    <ChevronDown className="h-4 w-4 text-slate-400 flex-shrink-0 mt-1" />
                                )}
                            </button>
                            {expandedId === q.id && (
                                <div className="border-t bg-brand-50/50 px-4 py-3">
                                    <p className="text-sm text-slate-700">
                                        <span className="font-semibold text-brand-700">A: </span>
                                        {q.answer}
                                    </p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                !showForm && !submitted && (
                    <div className="rounded-xl border border-dashed bg-slate-50 p-8 text-center text-sm text-slate-500">
                        No questions yet. Be the first to ask!
                    </div>
                )
            )}
        </div>
    );
}

// ──────────────────────────────────────
// Frequently Bought Together Carousel
// ──────────────────────────────────────

interface CrossSellProduct {
    id: number;
    name: string;
    slug: string;
    price: number;
    primary_image_url?: string;
    images?: { path: string; is_primary: boolean }[];
    variants?: { id: number; stock_quantity: number }[];
}

export function FrequentlyBoughtTogether({ productId }: { productId: number }) {
    const { data } = useCrossSellsQuery(productId);
    const addToCart = useAddCartItemMutation();

    const crossSells = unwrapCollection<CrossSellProduct>(data);

    if (crossSells.length === 0) return null;

    const handleAdd = (product: CrossSellProduct) => {
        const variant = product.variants?.[0];
        addToCart.mutate({ product_id: product.id, variant_id: variant?.id, quantity: 1 });
    };

    return (
        <div className="mt-12">
            <h2 className="mb-6 flex items-center gap-2 text-xl font-bold text-slate-900">
                <ShoppingBag className="h-5 w-5 text-brand-600" />
                Frequently Bought Together
            </h2>
            <div className="flex gap-4 overflow-x-auto pb-4 -mx-2 px-2 snap-x">
                {crossSells.map((p) => {
                    const images = unwrapCollection<{ path: string; is_primary: boolean }>(p.images);
                    const imageUrl = resolveProductImageUrl({
                        primaryImageUrl: p.primary_image_url,
                        imagePaths: [images.find((i) => i.is_primary)?.path, images[0]?.path],
                        productName: p.name,
                        productSlug: p.slug,
                        productId: p.id,
                    });
                    return (
                        <div
                            key={p.id}
                            className="flex-shrink-0 w-48 snap-start rounded-xl border bg-white shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                        >
                            <Link to={`/products/${p.slug}`}>
                                <div className="aspect-square bg-slate-50 overflow-hidden">
                                    {imageUrl ? (
                                        <img src={imageUrl} alt={p.name} className="h-full w-full object-cover" />
                                    ) : (
                                        <div className="flex h-full items-center justify-center text-4xl text-slate-300">🫙</div>
                                    )}
                                </div>
                            </Link>
                            <div className="p-3">
                                <Link to={`/products/${p.slug}`}>
                                    <p className="text-sm font-medium text-slate-900 line-clamp-2 hover:text-brand-700 transition-colors">
                                        {p.name}
                                    </p>
                                </Link>
                                <div className="mt-2 flex items-center justify-between">
                                    <span className="font-bold text-slate-900">₹{p.price}</span>
                                    <button
                                        onClick={() => handleAdd(p)}
                                        className="rounded-lg bg-brand-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-brand-700 transition-colors"
                                    >
                                        + Add
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
