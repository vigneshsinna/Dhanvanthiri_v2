import { useState, useEffect } from 'react';
import { useMeQuery, useUpdateProfileMutation, useUploadAvatarMutation } from '@/features/auth/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PageLoader } from '@/components/ui/Spinner';
import { Link } from 'react-router-dom';
import { getLocalizedText, getStorefrontLocale } from '@/lib/storefrontLocale';

export function ProfilePage() {
  const currentLocale = getStorefrontLocale();
  const t = (en: string, ta: string) => getLocalizedText(currentLocale, { en, ta });
  const { data: meData, isLoading } = useMeQuery();
  const updateMut = useUpdateProfileMutation();
  const avatarMut = useUploadAvatarMutation();
  const user = meData?.data;

  const [form, setForm] = useState({ name: '', email: '', phone: '' });
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (user) setForm({ name: user.name || '', email: user.email || '', phone: user.phone || '' });
  }, [user]);

  if (isLoading) return <PageLoader />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg('');
    try {
      await updateMut.mutateAsync(form);
      setMsg(t('Profile updated successfully', 'சுயவிவரம் வெற்றிகரமாக புதுப்பிக்கப்பட்டது') + '!');
    } catch {
      setMsg('Update failed.');
    }
  };

  const handleAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await avatarMut.mutateAsync(file);
      setMsg('Avatar updated!');
    } catch {
      setMsg('Avatar upload failed.');
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t('My Profile', 'என் சுயவிவரம்')}</h1>
        <Link to="/profile/security" className="text-sm text-brand-700 hover:underline">{t('Security Settings', 'பாதுகாப்பு அமைப்புகள்')}</Link>
      </div>

      {/* Avatar */}
      <div className="rounded-xl border bg-white p-6">
        <h2 className="mb-4 text-lg font-medium">Profile Photo</h2>
        <div className="flex items-center gap-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-100 text-2xl font-bold text-brand-700">
            {user?.name?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div>
            <label className="cursor-pointer rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200">
              Change Photo
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatar} />
            </label>
          </div>
        </div>
      </div>

      {/* Profile Form */}
      <div className="rounded-xl border bg-white p-6">
        <h2 className="mb-4 text-lg font-medium">{t('Personal Information', 'தனிப்பட்ட தகவல்')}</h2>
        {msg && (
          <div className={`mb-4 rounded-lg p-3 text-sm ${msg.includes('failed') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
            {msg}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label={t('Full Name', 'முழு பெயர்')} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input label={t('Email', 'மின்னஞ்சல்')} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <Input label={t('Phone', 'தொலைபேசி')} type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <Button type="submit" loading={updateMut.isPending}>{updateMut.isPending ? t('Saving...', 'சேமிக்கிறது...') : t('Save Changes', 'மாற்றங்களை சேமி')}</Button>
        </form>
      </div>
    </div>
  );
}
