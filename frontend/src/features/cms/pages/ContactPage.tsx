import React, { useState } from 'react';
import { Mail, MapPin, Phone } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { usePageQuery, useWebsiteSettingsQuery } from '@/features/cms/api';
import { headlessApi } from '@/lib/headless';
import { getLocalizedText, getStorefrontLocale } from '@/lib/storefrontLocale';

export function ContactPage() {
  const storefrontLocale = getStorefrontLocale();
  const t = (en: string, ta: string) => getLocalizedText(storefrontLocale, { en, ta });
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [serverMessage, setServerMessage] = useState('');

  const currentLocale = localStorage.getItem('dhanvanthiri_locale') || 'en';
  const { data: settingsData } = useWebsiteSettingsQuery();
  const { data: pageData } = usePageQuery('contact');
  const websiteSettings = settingsData?.website || {};
  const contactPage = pageData?.data?.data;
  const contactDetails = contactPage?.contact || {};

  const getLocalizedSetting = (value: unknown, fallback: string) => {
    if (!value) return fallback;

    if (typeof value === 'object' && value !== null) {
      const localizedValue = (value as Record<string, string>)[currentLocale] || (value as Record<string, string>).en;
      return localizedValue || fallback;
    }

    return String(value);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatus('loading');

    try {
      const response = await headlessApi.post('/contact', form);
      setStatus('success');
      setServerMessage(response.data.message);
      setForm({ name: '', email: '', phone: '', subject: '', message: '' });
    } catch (error: any) {
      setStatus('error');
      setServerMessage(error.response?.data?.message || 'Failed to submit the form.');
    }
  };

  return (
    <div className="mx-auto max-w-6xl py-8">
      <h1 className="mb-2 text-center text-4xl font-bold text-slate-900" style={{ fontFamily: "'Playfair Display', serif" }}>
        {t('Contact Us', 'தொடர்பு கொள்ளுங்கள்')}
      </h1>
      <p className="mb-12 text-center text-slate-600">
        {contactPage?.content || "We'd love to hear from you. Get in touch with us using the form below."}
      </p>

      <div className="grid gap-12 lg:grid-cols-2 lg:gap-8">
        <div className="rounded-2xl bg-brand-800 p-8 text-white shadow-xl md:p-12">
          <h2 className="mb-6 text-2xl font-semibold" style={{ fontFamily: "'Playfair Display', serif" }}>Get in Touch</h2>
          <p className="mb-8 text-brand-100">
            Have a question about our products? Want to share your feedback? We are here to help and usually reply within 24 hours.
          </p>

          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="shrink-0 rounded-full bg-brand-700/50 p-3">
                <MapPin className="h-6 w-6 text-brand-200" />
              </div>
              <div>
                <h3 className="mb-1 text-lg font-medium">Our Location</h3>
                <p className="whitespace-pre-line text-sm leading-relaxed text-brand-100/80">
                  {getLocalizedSetting(contactDetails.address || websiteSettings.address, "123 Traditional Kitchen,\nHeritage Street, Mylapore,\nChennai - 600004")}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="shrink-0 rounded-full bg-brand-700/50 p-3">
                <Phone className="h-6 w-6 text-brand-200" />
              </div>
              <div>
                <h3 className="mb-1 text-lg font-medium">Phone Number</h3>
                <p className="text-sm text-brand-100/80">
                  {getLocalizedSetting(contactDetails.phone || websiteSettings.phone, '+91 98765 43210')}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="shrink-0 rounded-full bg-brand-700/50 p-3">
                <Mail className="h-6 w-6 text-brand-200" />
              </div>
              <div>
                <h3 className="mb-1 text-lg font-medium">Email Address</h3>
                <p className="text-sm text-brand-100/80">
                  {getLocalizedSetting(contactDetails.email || websiteSettings.email, 'support@dhanvanthirifoods.com')}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-8 shadow-sm md:p-10">
          {status === 'success' ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="mb-6 rounded-full bg-green-100 p-4">
                <Mail className="h-10 w-10 text-green-600" />
              </div>
              <h3 className="mb-2 text-2xl font-semibold text-slate-900">{t('Message Sent!', 'செய்தி அனுப்பப்பட்டது!')}</h3>
              <p className="text-slate-600">{serverMessage}</p>
              <Button className="mt-8" onClick={() => setStatus('idle')}>{t('Send Another Message', 'மற்றொரு செய்தி அனுப்பு')}</Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">{t('Your Name', 'பெயர்')} <span className="text-red-500">*</span></label>
                  <input required type="text" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="w-full rounded-lg border border-slate-300 px-4 py-2.5 transition-colors focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500" placeholder="John Doe" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">{t('Email Address', 'மின்னஞ்சல்')} <span className="text-red-500">*</span></label>
                  <input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="w-full rounded-lg border border-slate-300 px-4 py-2.5 transition-colors focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500" placeholder="john@example.com" />
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Phone Number</label>
                  <input type="tel" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} className="w-full rounded-lg border border-slate-300 px-4 py-2.5 transition-colors focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500" placeholder="+91..." />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Subject</label>
                  <input type="text" value={form.subject} onChange={(event) => setForm({ ...form, subject: event.target.value })} className="w-full rounded-lg border border-slate-300 px-4 py-2.5 transition-colors focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500" placeholder="How can we help?" />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">{t('Message', 'செய்தி')} <span className="text-red-500">*</span></label>
                <textarea required rows={5} value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} className="w-full rounded-lg border border-slate-300 px-4 py-2.5 transition-colors focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500" placeholder="Write your message here..." />
              </div>

              {status === 'error' && (
                <p className="text-sm font-medium text-red-500">{serverMessage}</p>
              )}

              <Button type="submit" className="w-full py-3" disabled={status === 'loading'}>
                {status === 'loading' ? t('Sending...', 'அனுப்புகிறது...') : t('Send Message', 'செய்தி அனுப்பு')}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
