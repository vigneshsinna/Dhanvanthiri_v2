import { Link } from 'react-router-dom';
import { getLocalizedText, getStorefrontLocale } from '@/lib/storefrontLocale';

export function NotFoundPage() {
  const currentLocale = getStorefrontLocale();
  const t = (en: string, ta: string) => getLocalizedText(currentLocale, { en, ta });

  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
      <h1 className="text-2xl font-semibold">404</h1>
      <p className="mt-2 text-sm text-slate-600">{t('Page Not Found', 'பக்கம் கிடைக்கவில்லை')}</p>
      <p className="mt-1 text-sm text-slate-500">{t("Sorry, we couldn't find the page you're looking for.", 'மன்னிக்கவும், நீங்கள் தேடும் பக்கத்தை கண்டுபிடிக்க முடியவில்லை.')}</p>
      <div className="mt-4 flex justify-center gap-3">
        <Link to="/" className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">{t('Go Home', 'முகப்புக்கு செல்')}</Link>
        <Link to="/products" className="rounded-lg border border-brand-600 px-4 py-2 text-sm font-medium text-brand-700 hover:bg-brand-50">{t('Browse Products', 'பொருட்களைப் பாருங்கள்')}</Link>
      </div>
    </div>
  );
}
