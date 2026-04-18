import React, { useState } from 'react';
import { api } from '@/lib/api/client';

export function NewsletterSignup() {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setStatus('loading');
        try {
            const res = await api.post('/newsletter/subscribe', { email, source: 'footer' });
            setStatus('success');
            setMessage(res.data.message || 'Successfully subscribed!');
            setEmail('');
        } catch (error: any) {
            setStatus('error');
            setMessage(error.response?.data?.message || 'Failed to subscribe. Please try again.');
        }
    };

    return (
        <div className="bg-brand-50 border-t border-brand-100 py-12 px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-4xl text-center">
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl" style={{ fontFamily: "'Playfair Display', serif" }}>
                    Join Our Family
                </h2>
                <p className="mt-4 text-base leading-relaxed text-slate-600">
                    Subscribe to our newsletter for traditional recipes, exclusive offers, and behind-the-scenes stories from our kitchen.
                </p>
                <form onSubmit={handleSubmit} className="mt-6 flex flex-col sm:flex-row max-w-lg mx-auto gap-3">
                    <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email address"
                        disabled={status === 'loading' || status === 'success'}
                        className="flex-1 w-full rounded-xl border border-slate-300 px-4 py-3 placeholder-slate-400 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:opacity-60"
                    />
                    <button
                        type="submit"
                        disabled={status === 'loading' || status === 'success'}
                        className="rounded-xl bg-brand-700 px-6 py-3 font-semibold text-white shadow-sm transition-colors hover:bg-brand-800 disabled:bg-brand-400 w-full sm:w-auto shrink-0"
                    >
                        {status === 'loading' ? 'Subscribing...' : status === 'success' ? 'Subscribed!' : 'Subscribe'}
                    </button>
                </form>
                {message && (
                    <p className={`mt-3 text-sm font-medium ${status === 'success' ? 'text-green-600' : 'text-red-500'}`}>
                        {message}
                    </p>
                )}
            </div>
        </div>
    );
}
