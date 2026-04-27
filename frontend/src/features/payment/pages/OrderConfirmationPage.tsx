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
  const { gateway, orderNumber, guestCheckoutToken } = (location.state as {
    gateway?: string;
    orderNumber?: string;
    guestCheckoutToken?: string;
  } | null) ?? {};
  const isCod = gateway === 'cod' || gateway === 'cash_on_delivery';
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
      setClaimError(t('Password must be at least 6 characters.', 'கடவுச்சொல் குறைந்தது 6 எழுத்துகள் இருக்க வேண்டும்.'));
      return;
    }
    if (claimPassword !== claimConfirm) {
      setClaimError(t('Passwords do not match.', 'கடவுச்சொற்கள் பொருந்தவில்லை.'));
      return;
    }
    if (!guestCheckoutToken) {
      setClaimError(t('Session expired. Please contact support.', 'அமர்வு காலாவதியானது. ஆதரவைத் தொடர்பு கொள்ளுங்கள்.'));
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
        ✓
      </div>
      <h1 className="mt-4 text-2xl font-bold text-slate-900">{t('Order Confirmed!', 'ஆர்டர் உறுதியாகியது!')}</h1>
      {orderNumber && (
        <p className="mt-2 text-sm font-medium text-brand-600">
          {t('Order', 'ஆர்டர்')} #{orderNumber}
        </p>
      )}
      {isCod ? (
        <p className="mt-2 text-slate-600">
          {t(
            'Your order has been placed successfully. Payment will be collected upon delivery.',
            'உங்கள் ஆர்டர் வெற்றிகரமாக பதிவுசெய்யப்பட்டது. பணம் டெலிவரியின் போது வசூலிக்கப்படும்.'
          )}
        </p>
      ) : (
        <p className="mt-2 text-slate-600">
          {t(
            'Thank you for your purchase. Your order has been placed successfully and payment has been confirmed.',
            'உங்கள் கொள்முதலுக்கு நன்றி. உங்கள் ஆர்டர் வெற்றிகரமாக பதிவுசெய்யப்பட்டு பணம் உறுதியாகியது.'
          )}
        </p>
      )}
      {isCod && (
        <div className="mt-3 rounded-lg bg-amber-50 border border-amber-200 px-4 py-2 text-sm text-amber-700">
          {t('Please keep the exact amount ready for the delivery partner.', 'டெலிவரி நபருக்கு சரியான தொகையை தயாராக வைக்கவும்.')}
        </div>
      )}
      <p className="mt-2 text-sm text-slate-500">
        {t('You will receive an order confirmation email shortly.', 'உங்களுக்கு விரைவில் ஆர்டர் உறுதிப்படுத்தல் மின்னஞ்சல் வரும்.')}
      </p>

      {/* Guest Account Claim Section */}
      {!isAuthenticated && guestCheckoutToken && !claimSuccess && (
        <div className="mt-6 rounded-xl border border-brand-200 bg-brand-50 p-4 text-left">
          <h3 className="font-semibold text-brand-900">
            {t('Create an Account', 'கணக்கை உருவாக்கவும்')}
          </h3>
          <p className="mt-1 text-sm text-brand-700">
            {t(
              'Save your details for faster checkout next time and track all your orders in one place.',
              'அடுத்த முறை விரைவான செக்அவுட்டிற்கு உங்கள் விவரங்களைச் சேமிக்கவும், உங்கள் அனைத்து ஆர்டர்களையும் ஒரே இடத்தில் கண்காணிக்கவும்.'
            )}
          </p>

          {!showClaimForm ? (
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => setShowClaimForm(true)}
            >
              {t('Create Account', 'கணக்கை உருவாக்கு')}
            </Button>
          ) : (
            <form onSubmit={handleClaim} className="mt-3 space-y-3">
              <Input
                label={t('Set Password', 'கடவுச்சொல்லை அமைக்கவும்')}
                type="password"
                value={claimPassword}
                onChange={(e) => setClaimPassword(e.target.value)}
                required
                minLength={6}
              />
              <Input
                label={t('Confirm Password', 'கடவுச்சொல்லை உறுதிப்படுத்தவும்')}
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
                  {t('Set Password & Create Account', 'கடவுச்சொல்லை அமைத்து கணக்கை உருவாக்கு')}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => { setShowClaimForm(false); setClaimError(''); }}
                >
                  {t('Skip', 'தவிர்')}
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
            {t('Account created successfully!', 'கணக்கு வெற்றிகரமாக உருவாக்கப்பட்டது!')}
          </p>
          <p className="mt-1 text-sm text-green-700">
            {t(
              'You can now log in to track orders and manage your account.',
              'இப்போது நீங்கள் உள்நுழைந்து ஆர்டர்களை கண்காணிக்கலாம் மற்றும் கணக்கை நிர்வகிக்கலாம்.'
            )}
          </p>
          <Link to="/login" className="mt-2 inline-block text-sm font-semibold text-green-800 underline">
            {t('Sign In Now', 'இப்போது உள்நுழைக')}
          </Link>
        </div>
      )}

      <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
        {isAuthenticated ? (
          <Link to="/account/orders">
            <Button variant="primary">{t('View My Orders', 'என் ஆர்டர்களை பார்')}</Button>
          </Link>
        ) : (
          <Link to="/track-order">
            <Button variant="primary">{t('Track Order', 'ஆர்டரை கண்காணி')}</Button>
          </Link>
        )}
        <Link to="/products">
          <Button variant="outline">{t('Continue Shopping', 'தொடர்ந்து வாங்க')}</Button>
        </Link>
      </div>
    </div>
  );
}
