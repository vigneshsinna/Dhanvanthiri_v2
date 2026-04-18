import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { loginSchema, type LoginInput } from '@/features/auth/schemas/loginSchema';
import { useAppDispatch } from '@/lib/utils/hooks';
import { setCredentials } from '@/features/auth/store/authSlice';
import { useLoginMutation } from '@/features/auth/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useState } from 'react';
import type { UserRole } from '@/features/auth/store/authSlice';
import { getLocalizedText, getStorefrontLocale } from '@/lib/storefrontLocale';

function getPostLoginDestination(role: UserRole, from?: string): string {
  if (role === 'admin' || role === 'super_admin') {
    return from?.startsWith('/admin') ? from : '/admin';
  }

  if (from) {
    return from;
  }

  return '/products';
}

export function LoginPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const loginMut = useLoginMutation();
  const [serverError, setServerError] = useState('');
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname;
  const currentLocale = getStorefrontLocale();
  const t = (en: string, ta: string) => getLocalizedText(currentLocale, { en, ta });

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (values: LoginInput) => {
    setServerError('');
    try {
      const res = await loginMut.mutateAsync(values);
      const data = res.data ?? res;
      dispatch(setCredentials({
        user: data.user,
        accessToken: data.access_token,
      }));
      navigate(getPostLoginDestination(data.user.role, from), { replace: true });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || t('Login failed. Please try again.', 'உள்நுழைவு தோல்வி. மீண்டும் முயற்சிக்கவும்.');
      setServerError(msg);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link to="/" className="text-2xl font-bold text-brand-700">Dhanvanthiri Foods</Link>
          <p className="mt-2 text-sm text-slate-600">{t('Sign in to your account', 'உங்கள் கணக்கில் உள்நுழையுங்கள்')}</p>
        </div>
        <div className="rounded-xl bg-white p-6 shadow-lg">
          {serverError && (
            <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{serverError}</div>
          )}
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <Input label={t('Email', 'மின்னஞ்சல்')} type="email" error={errors.email?.message} {...register('email')} />
            <Input label={t('Password', 'கடவுச்சொல்')} type="password" error={errors.password?.message} {...register('password')} />
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input type="checkbox" className="rounded border-slate-300" /> {t('Remember me', 'என்னை நினைவில் வை')}
              </label>
              <Link to="/forgot-password" className="text-sm text-brand-700 hover:underline">{t('Forgot password?', 'கடவுச்சொல் மறந்துவிட்டதா?')}</Link>
            </div>
            <Button type="submit" className="w-full" loading={isSubmitting}>{t('Sign in', 'உள்நுழைய')}</Button>
          </form>
          <p className="mt-6 text-center text-sm text-slate-600">
            {t("Don't have an account?", 'கணக்கு இல்லையா?')}{' '}
            <Link to="/register" className="font-medium text-brand-700 hover:underline">{t('Create one', 'புதிய கணக்கு')}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
