/**
 * CMS Adapter
 * Maps V2 content endpoints -> old frontend CMS contract
 */
import { headlessApi } from './client';

function slugifyCategory(value: string | null | undefined): string {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function normalizeBlogSummary(post: any) {
  const categoryName = typeof post?.category === 'string' ? post.category : post?.category?.name;
  const categorySlug = typeof post?.category === 'object' ? post?.category?.slug : slugifyCategory(categoryName);

  return {
    ...post,
    excerpt: post?.excerpt ?? post?.short_description ?? '',
    short_description: post?.short_description ?? post?.excerpt ?? '',
    featured_image_url: post?.featured_image_url ?? post?.banner ?? null,
    category: categoryName
      ? {
          name: categoryName,
          slug: categorySlug,
        }
      : undefined,
    published_at: post?.published_at ?? post?.created_at ?? null,
  };
}

function normalizeBlogDetail(post: any) {
  return {
    ...normalizeBlogSummary(post),
    body: post?.body ?? post?.description ?? '',
    description: post?.description ?? post?.body ?? '',
  };
}

export const cmsAdapter: any = {
  async posts(params?: Record<string, unknown>) {
    const res = await headlessApi.get('/blog-list', { params });
    const collection = res.data?.blogs;
    const records = collection?.data ?? res.data?.data ?? [];
    const meta = collection?.meta ?? res.data?.meta ?? null;

    return {
      data: {
        data: Array.isArray(records) ? records.map(normalizeBlogSummary) : [],
        meta,
      },
    };
  },

  async post(slug: string) {
    const res = await headlessApi.get(`/blog-details/${slug}`);
    const record = res.data?.blog ?? res.data?.data ?? res.data;
    return {
      data: normalizeBlogDetail(record),
    };
  },

  async page(slug: string) {
    const res = await headlessApi.get(`/pages/${slug}`);
    return { data: res.data };
  },

  async faqs() {
    try {
      const res = await headlessApi.get('/faqs');
      const records = res.data?.data ?? res.data ?? [];
      return { data: { data: Array.isArray(records) ? records : [] } };
    } catch {
      return { data: { data: [] } };
    }
  },

  async banners(position?: string) {
    const res = await headlessApi.get('/banners');
    const allBanners = res.data.data || [];

    const filtered = position
      ? allBanners.filter((banner: any) => banner.position === position || banner.position_id === position)
      : allBanners;

    return { data: { items: filtered } };
  },

  async sliders() {
    const res = await headlessApi.get('/sliders');
    return { data: { items: res.data.data || [] } };
  },

  async menu(location?: string) {
    // V2 serves navigation data inside storefront settings
    try {
      const res = await headlessApi.get('/storefront/settings');
      const settings = res.data.data || res.data;
      const nav = settings.navigation || settings.header_nav || settings.menu || [];
      const items = Array.isArray(nav) ? nav : [];
      // Filter by location if provided (e.g. 'header', 'footer')
      const filtered = location
        ? items.filter((item: any) => item.location === location || item.position === location)
        : items;
      return { data: { items: filtered.length > 0 ? filtered : items } };
    } catch {
      return { data: { items: [] } };
    }
  },

  async activeAlerts() {
    // V2 uses top_content or announcement from storefront settings
    try {
      const res = await headlessApi.get('/storefront/settings');
      const settings = res.data.data || res.data;
      const alerts: any[] = [];
      if (settings.announcement_text || settings.top_content) {
        alerts.push({
          id: 1,
          message: settings.announcement_text || settings.top_content,
          type: 'info',
          dismissible: true,
        });
      }
      return { data: { items: alerts } };
    } catch {
      return { data: { items: [] } };
    }
  },

  async activePopups() {
    // V2 may serve popups via settings or a dedicated endpoint
    try {
      const res = await headlessApi.get('/storefront/settings');
      const settings = res.data.data || res.data;
      const popups: any[] = [];
      if (settings.popup_content || settings.popup_banner) {
        popups.push({
          id: 1,
          content: settings.popup_content || '',
          image: settings.popup_banner || '',
          is_active: true,
        });
      }
      return { data: { items: popups } };
    } catch {
      return { data: { items: [] } };
    }
  },

  async websiteSettings() {
    const res = await headlessApi.get('/storefront/settings');
    return { data: res.data.data || res.data };
  },

  async flashDeals() {
    const res = await headlessApi.get('/flash-deals');
    return { data: { items: res.data.data || [] } };
  },

  async languages() {
    const res = await headlessApi.get('/languages');
    return { data: res.data };
  },

  async currencies() {
    const res = await headlessApi.get('/currencies');
    return { data: res.data };
  },

  // ── Contact Form ──

  async submitContact(payload: { name: string; email: string; phone?: string; subject?: string; message: string }) {
    const res = await headlessApi.post('/contact', payload);
    return { data: res.data };
  },

  // ── Policies ──

  async policy(type: 'seller' | 'support' | 'return') {
    const res = await headlessApi.get(`/policies/${type}`);
    return { data: res.data.data || res.data };
  },

  // ── Search Suggestions ──

  async searchSuggestions(query: string) {
    const res = await headlessApi.get('/get-search-suggestions', {
      params: { query_key: query },
    });
    return { data: res.data.data || res.data };
  },
};
