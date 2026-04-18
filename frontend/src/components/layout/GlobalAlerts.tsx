import React from 'react';
import { unwrapCmsCollection, useActiveAlertsQuery } from '@/features/cms/api';

export function GlobalAlerts() {
    const { data } = useActiveAlertsQuery();
    const alerts = unwrapCmsCollection<any>(data);
    const currentLocale = localStorage.getItem('dhanvanthiri_locale') || 'en';

    if (alerts.length === 0) return null;

    return (
        <div className="flex flex-col w-full z-50 relative">
            {alerts.map((alert: any) => {
                const message = alert.message_translations?.[currentLocale] || alert.message;

                const content = (
                    <div
                        key={alert.id}
                        className={`w-full px-4 py-2 text-center text-xs sm:text-sm font-medium ${alert.bg_color || 'bg-brand-800'} ${alert.text_color || 'text-brand-100'}`}
                    >
                        {message}
                    </div>
                );

                if (alert.cta_url) {
                    return (
                        <a key={alert.id} href={alert.cta_url} className="block w-full hover:opacity-90 transition-opacity">
                            {content}
                        </a>
                    );
                }

                return content;
            })}
        </div>
    );
}
