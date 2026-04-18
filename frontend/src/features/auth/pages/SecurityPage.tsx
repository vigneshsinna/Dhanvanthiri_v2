import { useState } from 'react';
import { useChangePasswordMutation } from '@/features/auth/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Link } from 'react-router-dom';
import { getLocalizedText, getStorefrontLocale } from '@/lib/storefrontLocale';

export function SecurityPage() {
  const currentLocale = getStorefrontLocale();
  const t = (en: string, ta: string) => getLocalizedText(currentLocale, { en, ta });
  const changePwdMut = useChangePasswordMutation();
  const [form, setForm] = useState({ current_password: '', password: '', password_confirmation: '' });
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg('');
    setError('');
    if (form.password !== form.password_confirmation) {
      setError('Passwords do not match');
      return;
    }
    try {
      await changePwdMut.mutateAsync(form);
      setMsg(t('Password updated successfully', 'கடவுச்சொல் வெற்றிகரமாக புதுப்பிக்கப்பட்டது'));
      setForm({ current_password: '', password: '', password_confirmation: '' });
    } catch (err: unknown) {
      const apiMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to change password.';
      setError(apiMsg);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t('Security', 'பாதுகாப்பு')}</h1>
        <Link to="/profile" className="text-sm text-brand-700 hover:underline">{t('Back to Profile', 'சுயவிவரத்திற்கு திரும்பு')}</Link>
      </div>

      <div className="rounded-xl border bg-white p-6">
        <h2 className="mb-4 text-lg font-medium">{t('Change Password', 'கடவுச்சொல்லை மாற்று')}</h2>
        {msg && <div className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">{msg}</div>}
        {error && <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label={t('Current Password', 'தற்போதைய கடவுச்சொல்')}
            type="password"
            value={form.current_password}
            onChange={(e) => setForm({ ...form, current_password: e.target.value })}
            required
          />
          <Input
            label={t('New Password', 'புதிய கடவுச்சொல்')}
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
          <p className="text-xs text-slate-500">Min 8 characters, 1 uppercase letter, 1 number</p>
          <Input
            label={t('Confirm New Password', 'புதிய கடவுச்சொல்லை உறுதிப்படுத்து')}
            type="password"
            value={form.password_confirmation}
            onChange={(e) => setForm({ ...form, password_confirmation: e.target.value })}
            required
          />
          <Button type="submit" loading={changePwdMut.isPending}>{changePwdMut.isPending ? t('Updating...', 'புதுப்பிக்கிறது...') : t('Update Password', 'கடவுச்சொல்லை புதுப்பி')}</Button>
        </form>
      </div>
    </div>
  );
}
