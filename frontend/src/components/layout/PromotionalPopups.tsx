import React, { useEffect, useState } from 'react';
import { unwrapCmsCollection, useActivePopupsQuery } from '@/features/cms/api';
import { X } from 'lucide-react';

export function PromotionalPopups() {
    const { data } = useActivePopupsQuery();
    const popups = unwrapCmsCollection<any>(data);

    const [activePopup, setActivePopup] = useState<any | null>(null);
    const [isDismissed, setIsDismissed] = useState(false);

    const currentLocale = localStorage.getItem('dhanvanthiri_locale') || 'en';

    useEffect(() => {
        if (popups.length === 0 || isDismissed) return;

        // Try to find a popup that hasn't been seen recently
        const availablePopup = popups.find((p: any) => {
            const lastSeen = localStorage.getItem(`popup_seen_${p.id}`);
            // Show again after 24 hours
            if (!lastSeen) return true;
            if (Date.now() - parseInt(lastSeen, 10) > 24 * 60 * 60 * 1000) return true;
            return false;
        });

        if (availablePopup) {
            const timer = setTimeout(() => {
                setActivePopup(availablePopup);
            }, (availablePopup.delay_seconds || 3) * 1000);

            return () => clearTimeout(timer);
        }
    }, [popups, isDismissed]);

    const handleDismiss = () => {
        if (activePopup) {
            localStorage.setItem(`popup_seen_${activePopup.id}`, Date.now().toString());
        }
        setIsDismissed(true);
        setActivePopup(null);
    };

    if (!activePopup) return null;

    const image = activePopup.image_translations?.[currentLocale] || activePopup.image;
    const desc = activePopup.description_translations?.[currentLocale] || activePopup.description;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm transition-opacity">
            <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
                <button
                    onClick={handleDismiss}
                    className="absolute right-3 top-3 z-10 rounded-full bg-black/20 p-1.5 text-white backdrop-blur-md transition-colors hover:bg-black/40"
                    aria-label="Close"
                >
                    <X className="h-5 w-5" />
                </button>

                {image && (
                    <div className="aspect-[16/9] w-full bg-slate-100">
                        {activePopup.cta_url ? (
                            <a href={activePopup.cta_url} onClick={handleDismiss} className="block h-full w-full">
                                <img src={image} alt={activePopup.name} className="h-full w-full object-cover" />
                            </a>
                        ) : (
                            <img src={image} alt={activePopup.name} className="h-full w-full object-cover" />
                        )}
                    </div>
                )}

                {(desc || (activePopup.cta_url && !image)) && (
                    <div className="p-6 text-center">
                        <h3 className="mb-2 text-xl font-bold text-slate-900">{activePopup.name}</h3>
                        {desc && <p className="mb-6 text-slate-600">{desc}</p>}

                        {activePopup.cta_url && !image && (
                            <a
                                href={activePopup.cta_url}
                                onClick={handleDismiss}
                                className="inline-block rounded-xl bg-brand-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-brand-700"
                            >
                                Shop Now
                            </a>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
