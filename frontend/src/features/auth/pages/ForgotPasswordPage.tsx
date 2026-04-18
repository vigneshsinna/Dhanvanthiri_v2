import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForgotPasswordMutation } from '@/features/auth/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { getLocalizedText, getStorefrontLocale } from '@/lib/storefrontLocale';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const mutation = useForgotPasswordMutation();
  const currentLocale = getStorefrontLocale();
  const t = (en: string, ta: string) => getLocalizedText(currentLocale, { en, ta });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await mutation.mutateAsync({ email });
      setSent(true);
    } catch {
      setError(t('Could not send reset link. Please check your email.', 'மீட்டமைப்பு இணைப்பை அனுப்ப முடியவில்லை. உங்கள் மின்னஞ்சலை சரிபார்க்கவும்.'));
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link to="/" className="text-2xl font-bold text-brand-700">Dhanvanthiri Foods</Link>
        </div>
        <div className="rounded-xl bg-white p-6 shadow-lg">
          <h1 className="mb-2 text-xl font-semibold">{t('Forgot Password', 'கடவுச்சொல் மறந்ததா?')}</h1>
          {sent ? (
            <div className="space-y-4">
              <div className="rounded-lg bg-green-50 p-3 text-sm text-green-700">
                {t('If an account with that email exists, we\'ve sent a password reset link.', 'அந்த மின்னஞ்சலில் கணக்கு இருந்தால், கடவுச்சொல் மீட்டமைப்பு இணைப்பு அனுப்பப்பட்டுள்ளது.')}
              </div>
              <Link to="/login" className="block text-center text-sm text-brand-700 hover:underline">{t('Back to login', 'உள்நுழைவுக்கு திரும்ப')}</Link>
            </div>
          ) : (
            <>
              <p className="mb-4 text-sm text-slate-600">{t("Enter your email and we'll send you a reset link.", 'உங்கள் மின்னஞ்சலை உள்ளிடுங்கள், மீட்டமைப்பு இணைப்பு அனுப்புவோம்.')}</p>
              {error && <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input label={t('Email', 'மின்னஞ்சல்')} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                <Button type="submit" className="w-full" loading={mutation.isPending}>{t('Send Reset Link', 'மீட்டமைப்பு இணைப்பை அனுப்பு')}</Button>
              </form>
              <p className="mt-4 text-center text-sm text-slate-600">
                <Link to="/login" className="text-brand-700 hover:underline">{t('Back to login', 'உள்நுழைவுக்கு திரும்ப')}</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
