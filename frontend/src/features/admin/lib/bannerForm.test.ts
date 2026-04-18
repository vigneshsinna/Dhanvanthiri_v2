import { describe, expect, it } from 'vitest';
import { fromBannerRecord, toBannerPayload } from '@/features/admin/lib/bannerForm';

describe('bannerForm', () => {
  it('maps banner api records to admin form state', () => {
    expect(fromBannerRecord({
      id: 1,
      name: 'Hero Launch',
      title: 'Launch sale',
      title_translations: { en: 'Launch sale', ta: 'தொடக்க சலுகை' },
      subtitle: 'Fresh batches are live',
      subtitle_translations: { en: 'Fresh batches are live', ta: 'புதிய தொகுப்புகள் தயாராக உள்ளன' },
      cta_text: 'Shop now',
      image: '/storage/banners/hero.jpg',
      cta_url: '/products',
      position: 'home_hero',
      is_active: true,
      sort_order: 1,
    })).toMatchObject({
      name: 'Hero Launch',
      image: '/storage/banners/hero.jpg',
      cta_url: '/products',
      title: { en: 'Launch sale', ta: 'தொடக்க சலுகை' },
      subtitle: { en: 'Fresh batches are live', ta: 'புதிய தொகுப்புகள் தயாராக உள்ளன' },
    });
  });

  it('serializes admin form state into the backend banner payload', () => {
    expect(toBannerPayload({
      name: 'Hero Launch',
      title: { en: 'Launch sale', ta: 'தொடக்க சலுகை' },
      subtitle: { en: 'Fresh batches are live', ta: '' },
      image: '/storage/banners/hero.jpg',
      image_mobile: '/storage/banners/hero-mobile.jpg',
      cta_text: { en: 'Shop now', ta: 'இப்போது வாங்குங்கள்' },
      cta_url: '/products',
      position: 'home_hero',
      is_active: true,
      sort_order: 2,
    })).toEqual({
      name: 'Hero Launch',
      title: { en: 'Launch sale', ta: 'தொடக்க சலுகை' },
      subtitle: { en: 'Fresh batches are live' },
      image: '/storage/banners/hero.jpg',
      image_mobile: '/storage/banners/hero-mobile.jpg',
      cta_text: { en: 'Shop now', ta: 'இப்போது வாங்குங்கள்' },
      cta_url: '/products',
      position: 'home_hero',
      is_active: true,
      sort_order: 2,
    });
  });
});
