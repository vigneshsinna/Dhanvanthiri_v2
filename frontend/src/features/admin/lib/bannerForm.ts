export interface BannerFormValue {
  name: string;
  title: Record<string, string>;
  subtitle: Record<string, string>;
  image: string;
  image_mobile: string;
  cta_text: Record<string, string>;
  cta_url: string;
  position: string;
  is_active: boolean;
  sort_order: number;
}

export interface BannerRecord {
  id: number;
  name?: string;
  title?: string;
  title_translations?: Record<string, string>;
  subtitle?: string;
  subtitle_translations?: Record<string, string>;
  cta_text?: string;
  cta_text_translations?: Record<string, string>;
  image?: string;
  image_url?: string;
  image_mobile?: string;
  cta_url?: string;
  link_url?: string;
  position: string;
  is_active: boolean;
  sort_order: number;
}

export function getEmptyBannerForm(): BannerFormValue {
  return {
    name: '',
    title: { en: '', ta: '' },
    subtitle: { en: '', ta: '' },
    image: '',
    image_mobile: '',
    cta_text: { en: '', ta: '' },
    cta_url: '',
    position: 'home_hero',
    is_active: true,
    sort_order: 0,
  };
}

export function fromBannerRecord(record: BannerRecord): BannerFormValue {
  return {
    name: record.name ?? '',
    title: withLocaleDefaults(record.title_translations, record.title),
    subtitle: withLocaleDefaults(record.subtitle_translations, record.subtitle),
    image: record.image ?? record.image_url ?? '',
    image_mobile: record.image_mobile ?? '',
    cta_text: withLocaleDefaults(record.cta_text_translations, record.cta_text),
    cta_url: record.cta_url ?? record.link_url ?? '',
    position: record.position,
    is_active: record.is_active,
    sort_order: record.sort_order,
  };
}

export function toBannerPayload(form: BannerFormValue) {
  return {
    name: form.name.trim(),
    title: compactTranslations(form.title),
    subtitle: compactTranslations(form.subtitle),
    image: form.image.trim(),
    image_mobile: form.image_mobile.trim() || null,
    cta_text: compactTranslations(form.cta_text),
    cta_url: form.cta_url.trim() || null,
    position: form.position,
    is_active: form.is_active,
    sort_order: form.sort_order,
  };
}

function withLocaleDefaults(translations?: Record<string, string>, fallback?: string): Record<string, string> {
  return {
    en: translations?.en ?? fallback ?? '',
    ta: translations?.ta ?? '',
  };
}

function compactTranslations(translations: Record<string, string>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(translations)
      .map(([locale, value]) => [locale, value.trim()])
      .filter(([, value]) => value.length > 0),
  );
}
