import { useMutation, useQuery } from '@tanstack/react-query';
import { cmsAdapter } from '@/lib/headless';
import { queryKeys } from '@/lib/query/keys';

// Kept for backward compat with components using unwrapCmsCollection
export function unwrapCmsCollection<T>(payload: any): T[] {
  if (Array.isArray(payload)) return payload as T[];
  if (payload && typeof payload === 'object') {
    if (Array.isArray(payload.items)) return payload.items as T[];
    if (Array.isArray(payload.data)) return payload.data as T[];
    if (payload.data && Array.isArray(payload.data.items)) return payload.data.items as T[];
    if (payload.data && Array.isArray(payload.data.data)) return payload.data.data as T[];
  }
  return [];
}

export function usePostsQuery(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: queryKeys.cms.posts(params),
    queryFn: async () => {
      const res = await cmsAdapter.posts(params);
      return res;
    },
  });
}

export function usePostQuery(slug: string) {
  return useQuery({
    queryKey: queryKeys.cms.post(slug),
    enabled: !!slug,
    queryFn: async () => {
      const res = await cmsAdapter.post(slug);
      return res;
    },
  });
}

export function usePageQuery(slug: string) {
  return useQuery({
    queryKey: queryKeys.cms.page(slug),
    enabled: !!slug,
    queryFn: async () => {
      const res = await cmsAdapter.page(slug);
      return res;
    },
  });
}

export function useFaqsQuery() {
  return useQuery({
    queryKey: queryKeys.cms.faqs,
    queryFn: async () => {
      const res = await cmsAdapter.faqs();
      return res.data;
    },
  });
}

export function useBannersQuery(position?: string) {
  return useQuery({
    queryKey: queryKeys.cms.banners(position),
    queryFn: async () => {
      const res = await cmsAdapter.banners(position);
      return res;
    },
  });
}

export function useMenuQuery(location: string) {
  return useQuery({
    queryKey: queryKeys.cms.menus(location),
    enabled: !!location,
    queryFn: async () => {
      const res = await cmsAdapter.menu(location);
      return res;
    },
  });
}

export function useActiveAlertsQuery() {
  return useQuery({
    queryKey: queryKeys.cms.alerts,
    queryFn: async () => {
      const res = await cmsAdapter.activeAlerts();
      return res;
    },
  });
}

export function useActivePopupsQuery() {
  return useQuery({
    queryKey: queryKeys.cms.popups,
    queryFn: async () => {
      const res = await cmsAdapter.activePopups();
      return res;
    },
  });
}

export function useWebsiteSettingsQuery() {
  return useQuery({
    queryKey: queryKeys.cms.settings,
    queryFn: async () => {
      const res = await cmsAdapter.websiteSettings();
      return res.data;
    },
    staleTime: 1000 * 60,
  });
}

export function useContactFormMutation() {
  return useMutation({
    mutationFn: async (payload: { name: string; email: string; phone?: string; subject?: string; message: string }) => {
      const res = await cmsAdapter.submitContact(payload);
      return res;
    },
  });
}

export function usePolicyQuery(type: 'seller' | 'support' | 'return') {
  return useQuery({
    queryKey: ['policy', type],
    queryFn: async () => {
      const res = await cmsAdapter.policy(type);
      return res.data;
    },
    staleTime: 1000 * 60,
  });
}

export function useSearchSuggestionsQuery(query: string) {
  return useQuery({
    queryKey: ['searchSuggestions', query],
    enabled: query.length >= 2,
    queryFn: async () => {
      const res = await cmsAdapter.searchSuggestions(query);
      return res.data;
    },
    staleTime: 1000 * 60 * 5,
  });
}
