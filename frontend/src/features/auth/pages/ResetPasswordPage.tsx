import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useResetPasswordMutation } from '@/features/auth/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { getLocalizedText, getStorefrontLocale } from '@/lib/storefrontLocale';

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const resetMut = useResetPasswordMutation();
  const token = searchParams.get('token') || '';
  const emailParam = searchParams.get('email') || '';

  const [form, setForm] = useState({ email: emailParam, password: '', password_confirmation: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const currentLocale = getStorefrontLocale();
  const t = (en: string, ta: string) => getLocalizedText(currentLocale, { en, ta });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.password_confirmation) {
      setError(t('Passwords do not match', 'கடவுச்சொல்கள் பொருந்தவில்லை'));
      return;
    }
    setError('');
    try {
      await resetMut.mutateAsync({ token, ...form });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch {
      setError(t('Reset failed. The link may have expired.', 'மீட்டமைப்பு தோல்வி. இணைப்பு காலாவதியாகி இருக்கலாம்.'));
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link to="/" className="text-2xl font-bold text-brand-700">Dhanvanthiri Foods</Link>
        </div>
        <div className="rounded-xl bg-white p-6 shadow-lg">
          <h1 className="mb-4 text-xl font-semibold">{t('Reset Password', 'கடவுச்சொல் மீட்டமை')}</h1>
          {success ? (
            <div className="rounded-lg bg-green-50 p-3 text-sm text-green-700">
              {t('Password reset successfully! Redirecting to login...', 'கடவுச்சொல் வெற்றிகரமாக மீட்டமைக்கப்பட்டது! உள்நுழைவுக்கு திருப்பி விடப்படுகிறது...')}
            </div>
          ) : (
            <>
              {error && <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input label={t('Email', 'மின்னஞ்சல்')} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                <Input label={t('New Password', 'புதிய கடவுச்சொல்')} type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
                <Input label={t('Confirm Password', 'கடவுச்சொல்லை உறுதிப்படுத்து')} type="password" value={form.password_confirmation} onChange={(e) => setForm({ ...form, password_confirmation: e.target.value })} required />
                <Button type="submit" className="w-full" loading={resetMut.isPending}>{t('Reset Password', 'கடவுச்சொல் மீட்டமை')}</Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
