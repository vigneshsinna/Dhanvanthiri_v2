import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { registerSchema, type RegisterInput } from '@/features/auth/schemas/registerSchema';
import { useRegisterMutation } from '@/features/auth/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useState } from 'react';
import { getLocalizedText, getStorefrontLocale } from '@/lib/storefrontLocale';

export function RegisterPage() {
  const navigate = useNavigate();
  const registerMut = useRegisterMutation();
  const [serverError, setServerError] = useState('');
  const [success, setSuccess] = useState(false);
  const currentLocale = getStorefrontLocale();
  const t = (en: string, ta: string) => getLocalizedText(currentLocale, { en, ta });

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (values: RegisterInput) => {
    setServerError('');
    try {
      await registerMut.mutateAsync({
        name: values.name,
        email: values.email,
        password: values.password,
        password_confirmation: values.confirmPassword,
      });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || t('Registration failed.', 'பதிவு தோல்வி.');
      setServerError(msg);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link to="/" className="text-2xl font-bold text-brand-700">Dhanvanthiri Foods</Link>
          <p className="mt-2 text-sm text-slate-600">{t('Create your account', 'உங்கள் கணக்கை உருவாக்குங்கள்')}</p>
        </div>
        <div className="rounded-xl bg-white p-6 shadow-lg">
          {success && (
            <div className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">
              {t('Account created! Redirecting to login...', 'கணக்கு உருவாக்கப்பட்டது! உள்நுழைவுக்கு திருப்பி விடப்படுகிறது...')}
            </div>
          )}
          {serverError && (
            <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{serverError}</div>
          )}
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <Input label={t('Full Name', 'முழு பெயர்')} error={errors.name?.message} {...register('name')} />
            <Input label={t('Email', 'மின்னஞ்சல்')} type="email" error={errors.email?.message} {...register('email')} />
            <Input label={t('Password', 'கடவுச்சொல்')} type="password" error={errors.password?.message} {...register('password')} />
            <p className="text-xs text-slate-500">{t('Min 8 chars, 1 uppercase, 1 number', 'குறைந்தது 8 எழுத்துகள், 1 பெரிய எழுத்து, 1 எண்')}</p>
            <Input label={t('Confirm Password', 'கடவுச்சொல்லை உறுதிப்படுத்து')} type="password" error={errors.confirmPassword?.message} {...register('confirmPassword')} />
            <Button type="submit" className="w-full" loading={isSubmitting}>{t('Create Account', 'கணக்கு உருவாக்கு')}</Button>
          </form>
          <p className="mt-6 text-center text-sm text-slate-600">
            {t('Already have an account?', 'ஏற்கனவே கணக்கு உள்ளதா?')}{' '}
            <Link to="/login" className="font-medium text-brand-700 hover:underline">{t('Sign in', 'உள்நுழைய')}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
