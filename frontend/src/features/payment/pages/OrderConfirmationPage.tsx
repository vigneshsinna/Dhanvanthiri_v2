import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAppSelector } from '@/lib/utils/hooks';
import { accountAdapter } from '@/lib/headless';
import { getLocalizedText, getStorefrontLocale } from '@/lib/storefrontLocale';

export function OrderConfirmationPage() {
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
  const location = useLocation();
  const { orderNumber, guestCheckoutToken } = (location.state as {
    orderNumber?: string;
    guestCheckoutToken?: string;
  } | null) ?? {};
  const currentLocale = getStorefrontLocale();
  const t = (en: string, ta: string) => getLocalizedText(currentLocale, { en, ta });

  // Guest claim flow state
  const [showClaimForm, setShowClaimForm] = useState(false);
  const [claimPassword, setClaimPassword] = useState('');
  const [claimConfirm, setClaimConfirm] = useState('');
  const [claimError, setClaimError] = useState('');
  const [claimSuccess, setClaimSuccess] = useState(false);

  const claimMutation = useMutation({
    mutationFn: async (payload: { guest_checkout_token: string; password: string; password_confirmation: string }) => {
      return accountAdapter.guestClaimAccount(payload);
    },
    onSuccess: () => {
      setClaimSuccess(true);
      setClaimError('');
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.response?.data?.errors?.password?.[0] || 'Account creation failed. Please try again.';
      setClaimError(msg);
    },
  });

  const handleClaim = (e: React.FormEvent) => {
    e.preventDefault();
    setClaimError('');

    if (claimPassword.length < 6) {
      setClaimError(t('Password must be at least 6 characters.', 'à®•à®Ÿà®µà¯à®šà¯à®šà¯Šà®²à¯ à®•à¯à®±à¯ˆà®¨à¯à®¤à®¤à¯ 6 à®Žà®´à¯à®¤à¯à®¤à¯à®•à®³à¯ à®‡à®°à¯à®•à¯à®• à®µà¯‡à®£à¯à®Ÿà¯à®®à¯.'));
      return;
    }
    if (claimPassword !== claimConfirm) {
      setClaimError(t('Passwords do not match.', 'à®•à®Ÿà®µà¯à®šà¯à®šà¯Šà®±à¯à®•à®³à¯ à®ªà¯Šà®°à¯à®¨à¯à®¤à®µà®¿à®²à¯à®²à¯ˆ.'));
      return;
    }
    if (!guestCheckoutToken) {
      setClaimError(t('Session expired. Please contact support.', 'à®…à®®à®°à¯à®µà¯ à®•à®¾à®²à®¾à®µà®¤à®¿à®¯à®¾à®©à®¤à¯. à®†à®¤à®°à®µà¯ˆà®¤à¯ à®¤à¯Šà®Ÿà®°à¯à®ªà¯ à®•à¯Šà®³à¯à®³à¯à®™à¯à®•à®³à¯.'));
      return;
    }

    claimMutation.mutate({
      guest_checkout_token: guestCheckoutToken,
      password: claimPassword,
      password_confirmation: claimConfirm,
    });
  };

  return (
    <div className="mx-auto max-w-lg rounded-xl border bg-white p-8 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl">
        âœ“
      </div>
      <h1 className="mt-4 text-2xl font-bold text-slate-900">{t('Order Confirmed!', 'à®†à®°à¯à®Ÿà®°à¯ à®‰à®±à¯à®¤à®¿à®¯à®¾à®•à®¿à®¯à®¤à¯!')}</h1>
      {orderNumber && (
        <p className="mt-2 text-sm font-medium text-brand-600">
          {t('Order', 'à®†à®°à¯à®Ÿà®°à¯')} #{orderNumber}
        </p>
      )}
      <p className="mt-2 text-slate-600">
        {t(
          'Thank you for your purchase. Your order has been placed successfully and payment has been confirmed.',
          'Payment confirmed.'
        )}
      </p>
      <p className="mt-2 text-sm text-slate-500">
        {t('You will receive an order confirmation email shortly.', 'à®‰à®™à¯à®•à®³à¯à®•à¯à®•à¯ à®µà®¿à®°à¯ˆà®µà®¿à®²à¯ à®†à®°à¯à®Ÿà®°à¯ à®‰à®±à¯à®¤à®¿à®ªà¯à®ªà®Ÿà¯à®¤à¯à®¤à®²à¯ à®®à®¿à®©à¯à®©à®žà¯à®šà®²à¯ à®µà®°à¯à®®à¯.')}
      </p>

      {/* Guest Account Claim Section */}
      {!isAuthenticated && guestCheckoutToken && !claimSuccess && (
        <div className="mt-6 rounded-xl border border-brand-200 bg-brand-50 p-4 text-left">
          <h3 className="font-semibold text-brand-900">
            {t('Create an Account', 'à®•à®£à®•à¯à®•à¯ˆ à®‰à®°à¯à®µà®¾à®•à¯à®•à®µà¯à®®à¯')}
          </h3>
          <p className="mt-1 text-sm text-brand-700">
            {t(
              'Save your details for faster checkout next time and track all your orders in one place.',
              'à®…à®Ÿà¯à®¤à¯à®¤ à®®à¯à®±à¯ˆ à®µà®¿à®°à¯ˆà®µà®¾à®© à®šà¯†à®•à¯à®…à®µà¯à®Ÿà¯à®Ÿà®¿à®±à¯à®•à¯ à®‰à®™à¯à®•à®³à¯ à®µà®¿à®µà®°à®™à¯à®•à®³à¯ˆà®šà¯ à®šà¯‡à®®à®¿à®•à¯à®•à®µà¯à®®à¯, à®‰à®™à¯à®•à®³à¯ à®…à®©à¯ˆà®¤à¯à®¤à¯ à®†à®°à¯à®Ÿà®°à¯à®•à®³à¯ˆà®¯à¯à®®à¯ à®’à®°à¯‡ à®‡à®Ÿà®¤à¯à®¤à®¿à®²à¯ à®•à®£à¯à®•à®¾à®£à®¿à®•à¯à®•à®µà¯à®®à¯.'
            )}
          </p>

          {!showClaimForm ? (
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => setShowClaimForm(true)}
            >
              {t('Create Account', 'à®•à®£à®•à¯à®•à¯ˆ à®‰à®°à¯à®µà®¾à®•à¯à®•à¯')}
            </Button>
          ) : (
            <form onSubmit={handleClaim} className="mt-3 space-y-3">
              <Input
                label={t('Set Password', 'à®•à®Ÿà®µà¯à®šà¯à®šà¯Šà®²à¯à®²à¯ˆ à®…à®®à¯ˆà®•à¯à®•à®µà¯à®®à¯')}
                type="password"
                value={claimPassword}
                onChange={(e) => setClaimPassword(e.target.value)}
                required
                minLength={6}
              />
              <Input
                label={t('Confirm Password', 'à®•à®Ÿà®µà¯à®šà¯à®šà¯Šà®²à¯à®²à¯ˆ à®‰à®±à¯à®¤à®¿à®ªà¯à®ªà®Ÿà¯à®¤à¯à®¤à®µà¯à®®à¯')}
                type="password"
                value={claimConfirm}
                onChange={(e) => setClaimConfirm(e.target.value)}
                required
                minLength={6}
              />
              {claimError && (
                <p className="text-sm text-red-600">{claimError}</p>
              )}
              <div className="flex gap-2">
                <Button type="submit" size="sm" loading={claimMutation.isPending}>
                  {t('Set Password & Create Account', 'à®•à®Ÿà®µà¯à®šà¯à®šà¯Šà®²à¯à®²à¯ˆ à®…à®®à¯ˆà®¤à¯à®¤à¯ à®•à®£à®•à¯à®•à¯ˆ à®‰à®°à¯à®µà®¾à®•à¯à®•à¯')}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => { setShowClaimForm(false); setClaimError(''); }}
                >
                  {t('Skip', 'à®¤à®µà®¿à®°à¯')}
                </Button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Claim success message */}
      {claimSuccess && (
        <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-4 text-left">
          <p className="font-semibold text-green-800">
            {t('Account created successfully!', 'à®•à®£à®•à¯à®•à¯ à®µà¯†à®±à¯à®±à®¿à®•à®°à®®à®¾à®• à®‰à®°à¯à®µà®¾à®•à¯à®•à®ªà¯à®ªà®Ÿà¯à®Ÿà®¤à¯!')}
          </p>
          <p className="mt-1 text-sm text-green-700">
            {t(
              'You can now log in to track orders and manage your account.',
              'à®‡à®ªà¯à®ªà¯‹à®¤à¯ à®¨à¯€à®™à¯à®•à®³à¯ à®‰à®³à¯à®¨à¯à®´à¯ˆà®¨à¯à®¤à¯ à®†à®°à¯à®Ÿà®°à¯à®•à®³à¯ˆ à®•à®£à¯à®•à®¾à®£à®¿à®•à¯à®•à®²à®¾à®®à¯ à®®à®±à¯à®±à¯à®®à¯ à®•à®£à®•à¯à®•à¯ˆ à®¨à®¿à®°à¯à®µà®•à®¿à®•à¯à®•à®²à®¾à®®à¯.'
            )}
          </p>
          <Link to="/login" className="mt-2 inline-block text-sm font-semibold text-green-800 underline">
            {t('Sign In Now', 'à®‡à®ªà¯à®ªà¯‹à®¤à¯ à®‰à®³à¯à®¨à¯à®´à¯ˆà®•')}
          </Link>
        </div>
      )}

      <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
        {isAuthenticated ? (
          <Link to="/account/orders">
            <Button variant="primary">{t('View My Orders', 'à®Žà®©à¯ à®†à®°à¯à®Ÿà®°à¯à®•à®³à¯ˆ à®ªà®¾à®°à¯')}</Button>
          </Link>
        ) : (
          <Link to="/track-order">
            <Button variant="primary">{t('Track Order', 'à®†à®°à¯à®Ÿà®°à¯ˆ à®•à®£à¯à®•à®¾à®£à®¿')}</Button>
          </Link>
        )}
        <Link to="/products">
          <Button variant="outline">{t('Continue Shopping', 'à®¤à¯Šà®Ÿà®°à¯à®¨à¯à®¤à¯ à®µà®¾à®™à¯à®•')}</Button>
        </Link>
      </div>
    </div>
  );
}
