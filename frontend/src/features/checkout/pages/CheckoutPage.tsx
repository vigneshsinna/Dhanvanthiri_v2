import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '@/lib/api/client';
import { useAppDispatch, useAppSelector } from '@/lib/utils/hooks';
import { setStep, setCheckoutData, resetCheckout } from '@/features/checkout/store/checkoutSlice';
import {
  useAddressesQuery,
  useCreateAddressMutation,
  useCheckoutSummaryMutation,
  useCreatePaymentIntentMutation,
  useConfirmPaymentMutation,
  useGuestValidateCheckoutMutation,
  useGuestCheckoutSummaryMutation,
  useGuestCreatePaymentIntentMutation,
  useGuestConfirmPaymentMutation,
  usePaymentMethodsQuery,
  type PaymentMethod,
} from '@/features/checkout/api';
import { useCartQuery, useShippingRatesQuery } from '@/features/cart/api';
import { clearCart } from '@/features/cart/store/cartSlice';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PageLoader } from '@/components/ui/Spinner';
import { unwrapCollection } from '@/lib/collections';
import { getLocalizedText, getStorefrontLocale } from '@/lib/storefrontLocale';

const ALLOWED_PAYMENT_METHODS = new Set(['razorpay', 'phonepe']);
const DEFAULT_PAYMENT_METHOD: PaymentMethod = {
  code: 'razorpay',
  name: 'Razorpay',
  description: 'Pay securely using Razorpay.',
  is_enabled: true,
  is_default: true,
  type: 'online',
};

interface Address {
  id: number;
  label?: string;
  recipient_name: string;
  phone: string;
  line_1: string;
  line_2?: string;
  city: string;
  state: string;
  postal_code: string;
  country_code: string;
  is_default: boolean;
}

interface ShippingRate {
  id: number;
  name: string;
  cost: number;
  estimated_days_min: number;
  estimated_days_max: number;
}

interface CheckoutTotals {
  subtotal: number;
  discount_amount: number;
  shipping_cost: number;
  tax_amount: number;
  grand_total: number;
}

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void };
  }
}

function unwrapData<T>(payload: any): T {
  if (!payload) return {} as T;
  if (payload.data?.data) return payload.data.data;
  if (payload.data) return payload.data;
  return payload;
}

function extractApiErrorMessage(err: unknown, fallback: string): string {
  const data = (err as { response?: { data?: any } })?.response?.data;
  const fields = data?.errors ?? data?.error?.fields;
  if (fields && typeof fields === 'object') {
    const messages = Object.values(fields)
      .flatMap((value) => Array.isArray(value) ? value : [value])
      .filter((value): value is string => typeof value === 'string' && value.trim().length > 0);
    if (messages.length > 0) {
      return messages.join(', ');
    }
  }

  return data?.message || fallback;
}

async function ensureRazorpayLoaded(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (typeof window.Razorpay !== 'undefined') return true;

  const existing = document.querySelector<HTMLScriptElement>('script[data-rzp-checkout="true"]');
  if (existing) {
    await new Promise<void>((resolve) => {
      if (typeof window.Razorpay !== 'undefined') {
        resolve();
        return;
      }
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => resolve(), { once: true });
    });
    return typeof window.Razorpay !== 'undefined';
  }

  return await new Promise<boolean>((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.setAttribute('data-rzp-checkout', 'true');
    script.onload = () => resolve(typeof window.Razorpay !== 'undefined');
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export function CheckoutPage() {
  const currentLocale = getStorefrontLocale();
  const t = (en: string, ta: string) => getLocalizedText(currentLocale, { en, ta });
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const checkout = useAppSelector((s) => s.checkout);
  const cart = useAppSelector((s) => s.cart);
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
  const { isLoading: loadingCart, isFetching: fetchingCart } = useCartQuery();

  const { data: addressData, isLoading: loadingAddresses } = useAddressesQuery();
  const addresses = isAuthenticated ? unwrapCollection<Address>(addressData) : [];

  const [guestInfo, setGuestInfo] = useState({
    guest_email: '',
    guest_phone: '',
    recipient_name: '',
    phone: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    postal_code: '',
    country_code: 'IN',
  });

  // Determine the shipping state for rate lookup
  const selectedAddress = addresses.find((a) => a.id === checkout.shippingAddressId);
  const shippingState = isAuthenticated ? (selectedAddress?.state ?? '') : guestInfo.state.trim();

  const { data: ratesData } = useShippingRatesQuery(
    checkout.shippingAddressId ?? 0,
    shippingState || undefined,
  );
  const shippingRates = unwrapCollection<ShippingRate>(ratesData);

  const { data: paymentMethodsData } = usePaymentMethodsQuery();
  const paymentMethods: PaymentMethod[] = useMemo(() => {
    const methods = unwrapCollection<PaymentMethod>(paymentMethodsData)
      .filter((m) => m.is_enabled && ALLOWED_PAYMENT_METHODS.has(String(m.code).toLowerCase()));
    return methods.length > 0 ? methods : [DEFAULT_PAYMENT_METHOD];
  }, [paymentMethodsData]);

  const { data: statesData } = useQuery({
    queryKey: ['states'],
    queryFn: async () => {
      const res = await api.get('/v2/states');
      return (res.data?.data ?? []) as Array<{ id: number; name: string; zone_id: number | null }>;
    },
    staleTime: 1000 * 60 * 60,
  });
  const statesList = statesData ?? [];

  const createAddress = useCreateAddressMutation();
  const summaryMut = useCheckoutSummaryMutation();
  const createPayment = useCreatePaymentIntentMutation();
  const confirmPayment = useConfirmPaymentMutation();

  const guestValidate = useGuestValidateCheckoutMutation();
  const guestSummaryMut = useGuestCheckoutSummaryMutation();
  const guestCreatePayment = useGuestCreatePaymentIntentMutation();
  const guestConfirmPayment = useGuestConfirmPaymentMutation();

  const [summary, setSummary] = useState<CheckoutTotals | null>(null);

  const [showNewAddress, setShowNewAddress] = useState(false);
  const [newAddr, setNewAddr] = useState({
    recipient_name: '',
    phone: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    postal_code: '',
    country_code: 'IN',
  });

  const guestAddressValid = useMemo(() => {
    return Boolean(
      guestInfo.guest_email.trim() &&
      guestInfo.guest_phone.trim() &&
      guestInfo.recipient_name.trim() &&
      guestInfo.line1.trim() &&
      guestInfo.city.trim() &&
      guestInfo.state.trim() &&
      guestInfo.postal_code.trim()
    );
  }, [guestInfo]);

  const displaySteps: Array<'address' | 'payment'> = ['address', 'payment'];

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }
    if (addresses.length > 0 && !checkout.shippingAddressId) {
      const def = addresses.find((a) => a.is_default) || addresses[0];
      dispatch(setCheckoutData({ shippingAddressId: def.id }));
    }
  }, [addresses, checkout.shippingAddressId, dispatch, isAuthenticated]);

  useEffect(() => {
    if (shippingRates.length === 0) {
      if (checkout.shippingMethodId) {
        dispatch(setCheckoutData({ shippingMethodId: null }));
      }
      return;
    }

  const sortedShippingRates = [...shippingRates].sort((a, b) => a.cost - b.cost);
  const selectedShippingRate =
    sortedShippingRates.find((rate) => rate.id === checkout.shippingMethodId) ?? sortedShippingRates[0] ?? null;
    const selectedRateStillAvailable = sortedShippingRates.some((rate) => rate.id === checkout.shippingMethodId);
    if (!selectedRateStillAvailable) {
      dispatch(setCheckoutData({ shippingMethodId: selectedShippingRate?.id ?? sortedShippingRates[0].id }));
    }
  }, [shippingRates, checkout.shippingMethodId, dispatch]);

  useEffect(() => {
    if (checkout.step !== 'payment') {
      return;
    }

    const run = async () => {
      try {
        if (isAuthenticated) {
          if (!checkout.shippingAddressId || !checkout.shippingMethodId) {
            return;
          }
          const res = await summaryMut.mutateAsync({
            address_id: checkout.shippingAddressId,
            shipping_method_id: checkout.shippingMethodId,
          });
          const d = unwrapData<CheckoutTotals>(res);
          setSummary(d);
        } else {
          const res = await guestSummaryMut.mutateAsync({
            shipping_method_id: checkout.shippingMethodId ?? undefined,
            state: guestInfo.state.trim() || undefined,
          });
          const d = unwrapData<CheckoutTotals>(res);
          setSummary(d);
        }
      } catch {
        setSummary(null);
      }
    };

    run();
  }, [checkout.step, checkout.shippingAddressId, checkout.shippingMethodId, isAuthenticated]);

  const handleNewAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await createAddress.mutateAsync(newAddr);
      dispatch(setCheckoutData({ shippingAddressId: unwrapData<{ id: number }>(res).id }));
      setShowNewAddress(false);
    } catch {
      // handled by API messages in existing UI patterns
    }
  };

  const parseIntentPayload = (intentResponse: unknown) => {
    const data = unwrapData<Record<string, unknown>>(intentResponse);
    const orderId = Number(data.order_id);
    const orderNumber = String(data.order_number ?? '');
    const razorpayOrderId = String(data.razorpay_order_id ?? '');
    const keyId = String(data.razorpay_key_id ?? data.key_id ?? '');
    const amount = Number(data.amount ?? data.amount_minor ?? 0);
    const currency = String(data.currency ?? 'INR');
    const gateway = String(data.gateway ?? 'razorpay');

    return { orderId, orderNumber, razorpayOrderId, keyId, amount, currency, gateway };
  };

  const handleAuthPayment = async () => {
    dispatch(setCheckoutData({ isProcessing: true, error: null }));
    try {
      const res = await createPayment.mutateAsync({
        gateway: checkout.gateway,
        shipping_address_id: checkout.shippingAddressId!,
        shipping_method_id: checkout.shippingMethodId!,
        billing_same_as_shipping: checkout.billingSameAsShipping,
      });

      const paymentData = parseIntentPayload(res);
      dispatch(setCheckoutData({ orderId: paymentData.orderId, orderNumber: paymentData.orderNumber, razorpayOrderId: paymentData.razorpayOrderId }));

      // Razorpay — open modal
      if (checkout.gateway === 'razorpay') {
        const options = {
          key: paymentData.keyId,
          amount: paymentData.amount,
          currency: paymentData.currency,
          name: 'Dhanvanthiri Foods',
          description: 'Order Payment',
          order_id: paymentData.razorpayOrderId,
          handler: async (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
            try {
              await confirmPayment.mutateAsync({
                order_id: paymentData.orderId,
                gateway_payment_id: response.razorpay_payment_id,
                gateway_order_id: response.razorpay_order_id,
                signature: response.razorpay_signature,
                cart_token: cart.cartToken ?? undefined,
              });
              dispatch(clearCart());
              dispatch(resetCheckout());
              navigate('/checkout/confirmation', { state: { gateway: 'razorpay', orderNumber: paymentData.orderNumber, orderId: paymentData.orderId } });
            } catch {
              dispatch(setCheckoutData({ isProcessing: false, error: 'Payment verification failed' }));
              dispatch(setStep('payment'));
            }
          },
          modal: {
            ondismiss: () => {
              dispatch(setCheckoutData({ isProcessing: false }));
              dispatch(setStep('payment'));
            },
          },
          prefill: {
            name: addresses.find((a) => a.id === checkout.shippingAddressId)?.recipient_name,
            contact: addresses.find((a) => a.id === checkout.shippingAddressId)?.phone,
          },
          theme: { color: '#346d56' },
        };

        const razorpayReady = await ensureRazorpayLoaded();
        if (razorpayReady && typeof window.Razorpay !== 'undefined') {
          const rzp = new window.Razorpay(options);
          rzp.open();
        } else {
          dispatch(setCheckoutData({ isProcessing: false, error: 'Payment gateway not loaded. Please refresh.' }));
          dispatch(setStep('payment'));
        }
        return;
      }

      if (checkout.gateway === 'phonepe') {
        const rawData = (res as any)?.data?._raw || (res as any)?.data || {};
        const redirectUrl = rawData.payment_url || rawData.redirect_url || rawData.checkout_url;
        if (redirectUrl) {
          window.location.href = redirectUrl;
          return;
        }

        dispatch(setCheckoutData({ isProcessing: false, error: 'PhonePe payment link was not returned. Please try again.' }));
        dispatch(setStep('payment'));
        return;
      }

      dispatch(setCheckoutData({ isProcessing: false, error: 'Unsupported payment method selected. Please choose Razorpay or PhonePe.' }));
      dispatch(setStep('payment'));
    } catch (err: unknown) {
      dispatch(setCheckoutData({ isProcessing: false, error: extractApiErrorMessage(err, 'Payment creation failed') }));
      dispatch(setStep('payment'));
    }
  };

  const handleGuestAddressContinue = async () => {
    dispatch(setCheckoutData({ error: null }));
    try {
      const res = await guestValidate.mutateAsync({
        guest_email: guestInfo.guest_email.trim(),
        guest_phone: guestInfo.guest_phone.trim(),
        recipient_name: guestInfo.recipient_name.trim(),
        phone: guestInfo.phone.trim() || guestInfo.guest_phone.trim(),
        line1: guestInfo.line1.trim(),
        line2: guestInfo.line2.trim() || undefined,
        city: guestInfo.city.trim(),
        state: guestInfo.state.trim(),
        postal_code: guestInfo.postal_code.trim(),
        country_code: guestInfo.country_code,
        shipping_method_id: checkout.shippingMethodId ?? undefined,
      });
      const validation = unwrapData<{ valid: boolean; issues?: string[]; errors?: string[]; guest_checkout_token?: string }>(res);
      if (!validation.valid) {
        dispatch(setCheckoutData({ error: validation.issues?.join(', ') || validation.errors?.join(', ') || 'Checkout validation failed' }));
        return;
      }
      dispatch(setCheckoutData({ guestCheckoutToken: validation.guest_checkout_token ?? null }));
      dispatch(setStep('payment'));
    } catch (err: unknown) {
      dispatch(setCheckoutData({ error: extractApiErrorMessage(err, 'Unable to validate checkout') }));
    }
  };

  const handleGuestPayment = async () => {
    dispatch(setCheckoutData({ isProcessing: true, error: null }));
    try {
      const res = await guestCreatePayment.mutateAsync({
        gateway: checkout.gateway,
        guest_email: guestInfo.guest_email.trim(),
        guest_phone: guestInfo.guest_phone.trim(),
        shipping_address: {
          recipient_name: guestInfo.recipient_name.trim(),
          phone: guestInfo.phone.trim() || guestInfo.guest_phone.trim(),
          line1: guestInfo.line1.trim(),
          line2: guestInfo.line2.trim() || undefined,
          city: guestInfo.city.trim(),
          state: guestInfo.state.trim(),
          postal_code: guestInfo.postal_code.trim(),
          country_code: guestInfo.country_code,
        },
        shipping_method_id: checkout.shippingMethodId ?? undefined,
      });

      const paymentData = parseIntentPayload(res);
      dispatch(setCheckoutData({ orderId: paymentData.orderId, orderNumber: paymentData.orderNumber, razorpayOrderId: paymentData.razorpayOrderId }));

      // Razorpay — open modal
      if (checkout.gateway === 'razorpay') {
        const options = {
          key: paymentData.keyId,
          amount: paymentData.amount,
          currency: paymentData.currency,
          name: 'Dhanvanthiri Foods',
          description: 'Guest Order Payment',
          order_id: paymentData.razorpayOrderId,
          handler: async (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
            try {
              await guestConfirmPayment.mutateAsync({
                order_id: paymentData.orderId,
                gateway_payment_id: response.razorpay_payment_id,
                gateway_order_id: response.razorpay_order_id,
                signature: response.razorpay_signature,
                cart_token: cart.cartToken ?? undefined,
              });
              dispatch(clearCart());
              dispatch(resetCheckout());
              navigate('/checkout/confirmation', { state: { gateway: 'razorpay', orderNumber: paymentData.orderNumber, orderId: paymentData.orderId, guestCheckoutToken: checkout.guestCheckoutToken } });
            } catch {
              dispatch(setCheckoutData({ isProcessing: false, error: 'Payment verification failed' }));
              dispatch(setStep('payment'));
            }
          },
          modal: {
            ondismiss: () => {
              dispatch(setCheckoutData({ isProcessing: false }));
              dispatch(setStep('payment'));
            },
          },
          prefill: {
            name: guestInfo.recipient_name,
            email: guestInfo.guest_email,
            contact: guestInfo.guest_phone,
          },
          theme: { color: '#346d56' },
        };

        const razorpayReady = await ensureRazorpayLoaded();
        if (razorpayReady && typeof window.Razorpay !== 'undefined') {
          const rzp = new window.Razorpay(options);
          rzp.open();
        } else {
          dispatch(setCheckoutData({ isProcessing: false, error: 'Payment gateway not loaded. Please refresh.' }));
          dispatch(setStep('payment'));
        }
        return;
      }

      if (checkout.gateway === 'phonepe') {
        const rawData = (res as any)?.data?._raw || (res as any)?.data || {};
        const redirectUrl = rawData.payment_url || rawData.redirect_url || rawData.checkout_url;
        if (redirectUrl) {
          window.location.href = redirectUrl;
          return;
        }

        dispatch(setCheckoutData({ isProcessing: false, error: 'PhonePe payment link was not returned. Please try again.' }));
        dispatch(setStep('payment'));
        return;
      }

      dispatch(setCheckoutData({ isProcessing: false, error: 'Unsupported payment method selected. Please choose Razorpay or PhonePe.' }));
      dispatch(setStep('payment'));
    } catch (err: unknown) {
      dispatch(setCheckoutData({ isProcessing: false, error: extractApiErrorMessage(err, 'Payment creation failed') }));
      dispatch(setStep('payment'));
    }
  };

  if (isAuthenticated && loadingAddresses) {
    return <PageLoader />;
  }

  const isRecoveringPersistedCart = Boolean(cart.cartToken) && cart.itemCount === 0 && (loadingCart || fetchingCart);

  if (isRecoveringPersistedCart && checkout.step !== 'confirmation') {
    return <PageLoader />;
  }

  if (cart.itemCount === 0 && checkout.step !== 'confirmation') {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
        <h1 className="text-xl font-semibold">{t('Your cart is empty', 'உங்கள் கார்ட் காலியாக உள்ளது')}</h1>
        <Button className="mt-4" onClick={() => navigate('/products')}>{t('Browse Products', 'பொருட்களைப் பாருங்கள்')}</Button>
      </div>
    );
  }

  // Use the selected shipping rate cost from the fetched rates when summary is not available
  const selectedShippingRate = shippingRates.find((r: ShippingRate) => r.id === checkout.shippingMethodId);
  const liveShippingCost = summary?.shipping_cost ?? selectedShippingRate?.cost ?? 0;

  const amountPreview = {
    subtotal: summary?.subtotal ?? cart.subtotal ?? 0,
    discount: summary?.discount_amount ?? cart.discountAmount ?? 0,
    shipping: liveShippingCost,
    tax: summary?.tax_amount ?? 0,
    total: summary?.grand_total ?? ((cart.subtotal ?? 0) - (cart.discountAmount ?? 0) + liveShippingCost),
  };

  const selectedMethod = paymentMethods.find((m) => m.code === checkout.gateway);

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-2 sm:px-0">
      <div className="rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 via-white to-lime-50 p-5 sm:p-6">
        <h1 className="text-2xl font-semibold text-slate-900">{t('Secure Checkout', 'பாதுகாப்பான செக்அவுட்')}</h1>
        <p className="mt-1 text-sm text-slate-600">{t('Fast checkout with Razorpay.', 'Razorpay மூலம் விரைவான செக்அவுட்.')}</p>
      </div>

      {!isAuthenticated && (
        <div className="rounded-xl border border-brand-100 bg-brand-50 p-3 text-sm text-brand-800">
          {t('Guest checkout enabled. Already have an account?', 'விருந்தினர் செக்அவுட் இயக்கப்பட்டுள்ளது. ஏற்கனவே கணக்கு உள்ளதா?')} <Link to="/login" className="font-semibold underline">{t('Sign in', 'உள்நுழைக')}</Link>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
            <div className="flex flex-wrap items-center gap-2 text-xs font-medium sm:text-sm">
              {displaySteps.map((s, i) => {
                const labels: Record<string, string> = {
                  address: t('Address', 'முகவரி'),
                  payment: t('Payment', 'பணம் செலுத்துதல்'),
                };
                const isActive = checkout.step === s;
                return (
                  <div key={s} className="flex items-center gap-2">
                    {i > 0 && <span className="text-slate-300">•</span>}
                    <span className={`rounded-full px-3 py-1.5 ${isActive ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                      {labels[s]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {checkout.error && <div className="rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700">{checkout.error}</div>}

          {checkout.step === 'address' && isAuthenticated && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
              <h2 className="mb-4 text-lg font-semibold">{t('Shipping Address', 'அனுப்பும் முகவரி')}</h2>
              {addresses.length > 0 && (
                <div className="grid gap-3 sm:grid-cols-2">
                  {addresses.map((addr) => (
                    <label
                      key={addr.id}
                      className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${checkout.shippingAddressId === addr.id ? 'border-brand-500 bg-brand-50' : 'border-slate-200 hover:border-slate-300'}`}
                    >
                      <input
                        type="radio"
                        name="address"
                        checked={checkout.shippingAddressId === addr.id}
                        onChange={() => dispatch(setCheckoutData({ shippingAddressId: addr.id }))}
                        className="mt-1"
                      />
                      <div className="text-sm">
                        <p className="font-medium text-slate-900">{addr.recipient_name} {addr.label && <span className="text-slate-400">({addr.label})</span>}</p>
                        <p className="text-slate-600">{addr.line_1}{addr.line_2 ? `, ${addr.line_2}` : ''}</p>
                        <p className="text-slate-600">{addr.city}, {addr.state} {addr.postal_code}</p>
                        <p className="text-slate-500">{addr.phone}</p>
                      </div>
                    </label>
                  ))}
                </div>
              )}

              <button onClick={() => setShowNewAddress(!showNewAddress)} className="mt-4 text-sm text-brand-700 hover:underline">
                {t('+ Add new address', '+ புதிய முகவரி சேர்க்க')}
              </button>

              {showNewAddress && (
                <form onSubmit={handleNewAddress} className="mt-4 grid gap-3 rounded-xl border bg-slate-50 p-4 sm:grid-cols-2">
                  <Input label={t('Full Name', 'முழு பெயர்')} value={newAddr.recipient_name} onChange={(e) => setNewAddr({ ...newAddr, recipient_name: e.target.value })} required />
                  <Input label={t('Phone', 'தொலைபேசி')} value={newAddr.phone} onChange={(e) => setNewAddr({ ...newAddr, phone: e.target.value })} required />
                  <div className="sm:col-span-2">
                    <Input label={t('Address Line 1', 'முகவரி வரி 1')} value={newAddr.line1} onChange={(e) => setNewAddr({ ...newAddr, line1: e.target.value })} required />
                  </div>
                  <div className="sm:col-span-2">
                    <Input label={t('Address Line 2 (optional)', 'முகவரி வரி 2 (விருப்பம்)')} value={newAddr.line2} onChange={(e) => setNewAddr({ ...newAddr, line2: e.target.value })} />
                  </div>
                  <Input label={t('City', 'நகரம்')} value={newAddr.city} onChange={(e) => setNewAddr({ ...newAddr, city: e.target.value })} required />
                  <div>
                    <label htmlFor="new-address-state" className="mb-1 block text-sm font-medium text-slate-700">{t('State', 'மாநிலம்')} <span className="text-red-500">*</span></label>
                    <select
                      id="new-address-state"
                      value={newAddr.state}
                      onChange={(e) => setNewAddr({ ...newAddr, state: e.target.value })}
                      required
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    >
                      <option value="">{t('Select state/district', 'மாநிலம்/மாவட்டம் தேர்ந்தெடுக்கவும்')}</option>
                      {statesList.map((s) => (
                        <option key={s.id} value={s.name}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <Input label={t('Postal Code', 'அஞ்சல் குறியீடு')} value={newAddr.postal_code} onChange={(e) => setNewAddr({ ...newAddr, postal_code: e.target.value })} required />
                  <div className="sm:col-span-2">
                    <Button type="submit" size="sm" loading={createAddress.isPending}>{t('Save Address', 'முகவரியை சேமி')}</Button>
                  </div>
                </form>
              )}

              <div className="mt-6">
                <Button disabled={!checkout.shippingAddressId || !checkout.shippingMethodId} onClick={() => dispatch(setStep('payment'))}>{t('Continue to Payment', 'கட்டணத்திற்கு தொடரவும்')}</Button>
              </div>
            </div>
          )}

          {checkout.step === 'address' && !isAuthenticated && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
              <h2 className="mb-4 text-lg font-semibold">{t('Guest Details & Shipping Address', 'விருந்தினர் விவரங்கள் & அனுப்பும் முகவரி')}</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <Input label={t('Email', 'மின்னஞ்சல்')} type="email" value={guestInfo.guest_email} onChange={(e) => setGuestInfo({ ...guestInfo, guest_email: e.target.value })} required />
                <Input label={t('Phone', 'தொலைபேசி')} value={guestInfo.guest_phone} onChange={(e) => setGuestInfo({ ...guestInfo, guest_phone: e.target.value })} required />
                <Input label={t('Recipient Name', 'பெறுநர் பெயர்')} value={guestInfo.recipient_name} onChange={(e) => setGuestInfo({ ...guestInfo, recipient_name: e.target.value })} required />
                <Input label={t('Delivery Phone', 'டெலிவரி தொலைபேசி')} value={guestInfo.phone} onChange={(e) => setGuestInfo({ ...guestInfo, phone: e.target.value })} />
                <div className="sm:col-span-2">
                  <Input label={t('Address Line 1', 'முகவரி வரி 1')} value={guestInfo.line1} onChange={(e) => setGuestInfo({ ...guestInfo, line1: e.target.value })} required />
                </div>
                <div className="sm:col-span-2">
                  <Input label={t('Address Line 2 (optional)', 'முகவரி வரி 2 (விருப்பம்)')} value={guestInfo.line2} onChange={(e) => setGuestInfo({ ...guestInfo, line2: e.target.value })} />
                </div>
                <Input label={t('City', 'நகரம்')} value={guestInfo.city} onChange={(e) => setGuestInfo({ ...guestInfo, city: e.target.value })} required />
                <div>
                  <label htmlFor="guest-state" className="mb-1 block text-sm font-medium text-slate-700">{t('State', 'மாநிலம்')} <span className="text-red-500">*</span></label>
                  <select
                    id="guest-state"
                    value={guestInfo.state}
                    onChange={(e) => setGuestInfo({ ...guestInfo, state: e.target.value })}
                    required
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="">{t('Select state/district', 'மாநிலம்/மாவட்டம் தேர்ந்தெடுக்கவும்')}</option>
                    {statesList.map((s) => (
                      <option key={s.id} value={s.name}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <Input label={t('Postal Code', 'அஞ்சல் குறியீடு')} value={guestInfo.postal_code} onChange={(e) => setGuestInfo({ ...guestInfo, postal_code: e.target.value })} required />
              </div>

              <div className="mt-6">
                <Button disabled={!guestAddressValid || guestValidate.isPending} loading={guestValidate.isPending} onClick={handleGuestAddressContinue}>
                  {t('Continue to Payment', 'கட்டணத்திற்கு தொடரவும்')}
                </Button>
              </div>
            </div>
          )}

          {checkout.step === 'payment' && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
              <h2 className="mb-4 text-lg font-semibold">{t('Order Review & Payment', 'ஆர்டர் மதிப்பாய்வு மற்றும் கட்டணம்')}</h2>
              {summary ? (
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between"><span className="text-slate-600">{t('Subtotal', 'துணை மொத்தம்')}</span><span>Rs {(summary.subtotal || 0).toFixed(2)}</span></div>
                  {(summary.discount_amount || 0) > 0 && <div className="flex justify-between text-green-600"><span>{t('Discount', 'தள்ளுபடி')}</span><span>-Rs {(summary.discount_amount || 0).toFixed(2)}</span></div>}
                  <div className="flex justify-between"><span className="text-slate-600">{t('Shipping', 'அனுப்புதல்')}</span><span>{summary.shipping_cost === 0 ? 'FREE' : `Rs ${(summary.shipping_cost || 0).toFixed(2)}`}</span></div>
                  {(summary.tax_amount || 0) > 0 && <div className="flex justify-between"><span className="text-slate-600">{t('Tax', 'வரி')}</span><span>Rs {(summary.tax_amount || 0).toFixed(2)}</span></div>}
                  <div className="border-t pt-2">
                    <div className="flex justify-between text-lg font-bold"><span>{t('Total', 'மொத்தம்')}</span><span>Rs {(summary.grand_total || 0).toFixed(2)}</span></div>
                  </div>

                  <div className="mt-6 border-t pt-6">
                    <h3 className="mb-3 font-semibold">{t('Payment Method', 'பணம் செலுத்தும் முறை')}</h3>
                    <div className="flex flex-col gap-3">
                      {paymentMethods.map((method) => (
                        <label
                          key={method.code}
                          className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 ${checkout.gateway === method.code ? 'border-brand-500 bg-brand-50' : 'border-slate-200'}`}
                        >
                          <input
                            type="radio"
                            name="gateway"
                            checked={checkout.gateway === method.code}
                          onChange={() => dispatch(setCheckoutData({ gateway: method.code }))}
                            className="mt-0.5"
                          />
                          <div>
                            <span className="text-sm font-medium">{method.name}</span>
                            <p className="mt-0.5 text-xs text-slate-500">{method.description}</p>
                          </div>
                        </label>
                      ))}
                      {paymentMethods.length === 0 && (
                        <p className="text-sm text-slate-500">{t('Loading payment options...', 'பணம் செலுத்தும் விருப்பங்களை ஏற்றுகிறது...')}</p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-500">{t('Calculating total...', 'மொத்தத்தை கணக்கிடுகிறது...')}</p>
              )}

              <div className="mt-6 flex gap-2">
                <Button variant="outline" onClick={() => dispatch(setStep('address'))}>{t('Back', 'பின்செல்')}</Button>
                <Button
                  loading={checkout.isProcessing}
                  disabled={!selectedMethod}
                  onClick={() => {
                    dispatch(setStep('processing'));
                    if (isAuthenticated) {
                      void handleAuthPayment();
                    } else {
                      void handleGuestPayment();
                    }
                  }}
                >
                  {t(`Pay with ${selectedMethod?.name || checkout.gateway}`, `Pay with ${selectedMethod?.name || checkout.gateway}`)}
                </Button>
              </div>
            </div>
          )}

          {checkout.step === 'processing' && (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
              <div className="text-4xl">...</div>
              <h2 className="mt-4 text-lg font-semibold">{t('Processing Payment...', 'பணம் செலுத்துதல் செயல்படுகிறது...')}</h2>
              <p className="mt-2 text-sm text-slate-600">
                {checkout.gateway === 'razorpay'
                  ? t('Please complete the payment in the Razorpay window.', 'Please complete the payment in the Razorpay window.')
                  : t('Please wait while we process your payment...', 'Please wait while we process your payment...')}
              </p>
            </div>
          )}
        </div>

        <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-24">
          <h3 className="text-base font-semibold text-slate-900">{t('Order Snapshot', 'ஆர்டர் சுருக்கம்')}</h3>
          <p className="mt-1 text-xs text-slate-500">{cart.itemCount} {t('items in cart', 'பொருட்கள் கார்டில்')}</p>

          <div className="mt-4 space-y-2 border-t pt-4 text-sm">
            <div className="flex justify-between"><span className="text-slate-600">{t('Subtotal', 'துணை மொத்தம்')}</span><span>Rs {amountPreview.subtotal.toFixed(2)}</span></div>
            {amountPreview.discount > 0 && <div className="flex justify-between text-green-600"><span>{t('Discount', 'தள்ளுபடி')}</span><span>-Rs {amountPreview.discount.toFixed(2)}</span></div>}
            <div className="flex justify-between"><span className="text-slate-600">{t('Shipping', 'அனுப்புதல்')}</span><span>{amountPreview.shipping === 0 ? 'FREE' : `Rs ${amountPreview.shipping.toFixed(2)}`}</span></div>
            {amountPreview.tax > 0 && <div className="flex justify-between"><span className="text-slate-600">{t('Tax', 'வரி')}</span><span>Rs {amountPreview.tax.toFixed(2)}</span></div>}
            <div className="mt-2 flex justify-between border-t pt-2 text-base font-semibold"><span>{t('Payable', 'செலுத்த வேண்டியது')}</span><span>Rs {amountPreview.total.toFixed(2)}</span></div>
          </div>

          <div className="mt-4 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
            <p className="font-medium text-slate-700">{t('Selected Payment', 'தேர்ந்தெடுக்கப்பட்ட கட்டணம்')}</p>
            <p className="mt-1">{selectedMethod?.name ?? t('Razorpay (default)', 'Razorpay (இயல்புநிலை)')}</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
