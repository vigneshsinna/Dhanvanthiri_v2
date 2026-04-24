import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { queryKeys } from '@/lib/query/keys';

export interface AdminFeatureModule {
  id: number;
  module_code: string;
  module_name: string;
  description: string | null;
  is_enabled: boolean;
  license_type: string | null;
  license_key: string | null;
  valid_from: string | null;
  valid_to: string | null;
  integration_status: 'not_configured' | 'configured' | 'healthy' | 'degraded' | 'failed';
  health_status: 'unknown' | 'healthy' | 'degraded' | 'failed';
  last_validated_at: string | null;
  vendor_name: string | null;
  notes: string | null;
  config_json: Record<string, unknown> | null;
  has_credentials: boolean;
  activated_by: number | null;
  activated_by_name: string | null;
  activated_on: string | null;
  updated_by: number | null;
  updated_by_name: string | null;
  updated_at: string | null;
}

export function useDashboardSummaryQuery(period: 'today' | 'week' | 'month' | 'year') {
  return useQuery({
    queryKey: queryKeys.admin.dashboard(period),
    queryFn: async () => {
      const res = await api.get('/admin/dashboard/summary', { params: { period } });
      return res.data;
    },
  });
}

export function useAdminProductsQuery(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: queryKeys.admin.products(params),
    queryFn: async () => {
      const res = await api.get('/admin/products', { params });
      return res.data;
    },
  });
}

export function useAdminProductQuery(id: number, enabled = true) {
  return useQuery({
    queryKey: queryKeys.admin.product(id),
    enabled,
    queryFn: async () => {
      const res = await api.get(`/admin/products/${id}`);
      return res.data;
    },
  });
}

export function useAdminCreateProductMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await api.post('/admin/products', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'products'] }),
  });
}

export function useAdminUpdateProductMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, formData }: { id: number; formData: FormData }) => {
      const res = await api.put(`/admin/products/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'products'] }),
  });
}

export function useAdminDeleteProductMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await api.delete(`/admin/products/${id}`);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'products'] }),
  });
}

export function useAdminDuplicateProductMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await api.post(`/admin/products/${id}/duplicate`);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'products'] }),
  });
}

export function useAdminImportProductsMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/admin/products/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'products'] }),
  });
}

export function useAdminOrdersQuery(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: queryKeys.admin.orders(params),
    queryFn: async () => {
      const res = await api.get('/admin/orders', { params });
      return res.data;
    },
  });
}

export function useAdminOrderQuery(id: number, enabled = true) {
  return useQuery({
    queryKey: queryKeys.admin.order(id),
    queryFn: async () => {
      const res = await api.get(`/admin/orders/${id}`);
      return res.data;
    },
    enabled,
  });
}

export function useAdminOrderTrackingQuery(id: number, enabled = true) {
  return useQuery({
    queryKey: queryKeys.admin.orderTracking(id),
    queryFn: async () => {
      const res = await api.get(`/orders/${id}/tracking`);
      return res.data;
    },
    enabled,
  });
}

export function useAdminUpdateOrderStatusMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, notes }: { id: number; status: string; notes?: string }) => {
      const res = await api.put(`/admin/orders/${id}/status`, { status, notes });
      return res.data;
    },
    onSuccess: (_res, vars) => {
      qc.invalidateQueries({ queryKey: ['admin', 'orders'] });
      qc.invalidateQueries({ queryKey: queryKeys.admin.order(vars.id) });
    },
  });
}

export function useAdminMarkCollectedMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: number }) => {
      const res = await api.post(`/admin/orders/${id}/mark-collected`);
      return res.data;
    },
    onSuccess: (_res, vars) => {
      qc.invalidateQueries({ queryKey: ['admin', 'orders'] });
      qc.invalidateQueries({ queryKey: queryKeys.admin.order(vars.id) });
    },
  });
}

export function useAdminExportOrdersMutation() {
  return useMutation({
    mutationFn: async (params: Record<string, unknown>) => {
      const res = await api.post('/admin/orders/export', params);
      return res.data;
    },
  });
}

export function useAdminCreateShipmentMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      carrier,
      tracking_number,
      tracking_url,
      estimated_delivery_at,
    }: {
      id: number;
      carrier: string;
      tracking_number: string;
      tracking_url?: string;
      estimated_delivery_at?: string;
    }) => {
      const res = await api.post(`/admin/orders/${id}/shipment`, {
        carrier,
        tracking_number,
        tracking_url,
        estimated_delivery_at,
      });
      return res.data;
    },
    onSuccess: (_res, vars) => {
      qc.invalidateQueries({ queryKey: ['admin', 'orders'] });
      qc.invalidateQueries({ queryKey: queryKeys.admin.order(vars.id) });
      qc.invalidateQueries({ queryKey: queryKeys.admin.orderTracking(vars.id) });
    },
  });
}

export function useAdminReturnsQuery(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: queryKeys.admin.returns(params),
    queryFn: async () => {
      const res = await api.get('/admin/returns', { params });
      return res.data;
    },
  });
}

export function useAdminReturnDetailQuery(id: number, enabled = true) {
  return useQuery({
    queryKey: queryKeys.admin.returnDetail(id),
    queryFn: async () => {
      const res = await api.get(`/admin/returns/${id}`);
      return res.data;
    },
    enabled,
  });
}

export function useAdminUpdateReturnMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, admin_notes }: { id: number; status: string; admin_notes?: string }) => {
      const res = await api.put(`/admin/returns/${id}`, { status, admin_notes });
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'returns'] });
      qc.invalidateQueries({ queryKey: ['admin', 'orders'] });
    },
  });
}

// OMS Summary / Dashboard
export function useOmsSummaryQuery() {
  return useQuery({
    queryKey: queryKeys.admin.omsSummary(),
    queryFn: async () => {
      const res = await api.get('/admin/orders/oms-summary');
      return res.data;
    },
    refetchInterval: 60_000,
  });
}

// Shipments
export function useAdminShipmentsQuery(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: queryKeys.admin.shipments(params),
    queryFn: async () => {
      const res = await api.get('/admin/shipments', { params });
      return res.data;
    },
  });
}

export function useAdminShipmentDetailQuery(id: number, enabled = true) {
  return useQuery({
    queryKey: queryKeys.admin.shipment(id),
    queryFn: async () => {
      const res = await api.get(`/admin/shipments/${id}`);
      return res.data;
    },
    enabled,
  });
}

export function useAdminUpdateShipmentMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number; status?: string; tracking_number?: string; tracking_url?: string; carrier?: string; estimated_delivery_at?: string }) => {
      const res = await api.put(`/admin/shipments/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'shipments'] });
      qc.invalidateQueries({ queryKey: ['admin', 'orders'] });
    },
  });
}

export function useAdminAddShipmentEventMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number; status: string; description?: string; location?: string }) => {
      const res = await api.post(`/admin/shipments/${id}/events`, data);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'shipments'] });
      qc.invalidateQueries({ queryKey: ['admin', 'orders'] });
    },
  });
}

export async function downloadAdminOrderInvoice(id: number, filename = `invoice-${id}.pdf`) {
  const response = await api.get(`/admin/orders/${id}/invoice`, { responseType: 'blob' });
  const blob = response.data as Blob;

  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return blob;
  }

  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(objectUrl);
  return blob;
}

export function useAdminCustomersQuery(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: queryKeys.admin.customers(params),
    queryFn: async () => {
      const res = await api.get('/admin/customers', { params });
      return res.data;
    },
  });
}

export function useAdminInventoryQuery(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: queryKeys.admin.inventory(params),
    queryFn: async () => {
      const res = await api.get('/admin/inventory', { params });
      return res.data;
    },
  });
}

export function useAdminUpdateStockMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, stock_quantity, low_stock_threshold }: { id: number; stock_quantity: number; low_stock_threshold?: number }) => {
      const payload: Record<string, number> = { stock_quantity };
      if (low_stock_threshold !== undefined) payload.low_stock_threshold = low_stock_threshold;
      const res = await api.put(`/admin/inventory/${id}`, payload);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'inventory'] }),
  });
}

export function useRevenueChartQuery(params: { period: string; group_by: string }) {
  return useQuery({
    queryKey: queryKeys.admin.analytics('revenue', params),
    queryFn: async () => {
      const res = await api.get('/admin/analytics/revenue', { params });
      return res.data;
    },
  });
}

export function useAdminAnalyticsExportMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { type: string; period: string }) => {
      const res = await api.post('/admin/analytics/export', payload);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'analytics'] });
    },
  });
}

export function useAdminExportStatusQuery(id: number, enabled = true) {
  return useQuery({
    queryKey: queryKeys.admin.exportJob(id),
    queryFn: async () => {
      const res = await api.get(`/admin/exports/${id}`);
      return res.data;
    },
    enabled,
  });
}

export function useAdminPaymentsQuery(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: queryKeys.admin.payments(params),
    queryFn: async () => {
      const res = await api.get('/admin/payments', { params });
      return res.data;
    },
  });
}

/* ─── payment method management ─── */

export interface AdminPaymentMethod {
  code: string;
  name: string;
  description: string;
  type: 'online' | 'offline';
  is_enabled: boolean;
  config?: Record<string, unknown>;
}

export interface AdminRazorpayHealth {
  status: string;
  healthy: boolean;
  message?: string;
  error?: string;
  [key: string]: unknown;
}

function unwrapPaymentMethodCollection(payload: any): AdminPaymentMethod[] {
  const raw = payload?.data?.data ?? payload?.data ?? [];
  return Array.isArray(raw) ? raw : [];
}

function unwrapPaymentMethodDetails(payload: any): Record<string, unknown> {
  const raw = payload?.data?.data ?? payload?.data ?? {};
  return raw && typeof raw === 'object' ? raw : {};
}

export function useAdminPaymentMethodsQuery(enabled = true) {
  return useQuery({
    queryKey: queryKeys.admin.paymentMethods(),
    enabled,
    queryFn: async () => {
      const res = await api.get('/admin/payment-methods');
      return unwrapPaymentMethodCollection(res.data);
    },
  });
}

export function useAdminRazorpayHealthQuery(enabled = false) {
  return useQuery({
    queryKey: ['admin', 'razorpay-health'],
    queryFn: async (): Promise<AdminRazorpayHealth> => {
      const res = await api.get('/admin/payment-methods/razorpay/health');
      const data = unwrapPaymentMethodDetails(res.data);
      const status = String(data.status ?? 'unknown');
      return {
        ...data,
        status,
        healthy: status === 'healthy',
      };
    },
    enabled,
    staleTime: 0, // always fresh
  });
}

export function useAdminNotificationsQuery(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: queryKeys.admin.notifications(params),
    queryFn: async () => {
      const res = await api.get('/admin/notifications', { params });
      return res.data;
    },
  });
}

export function useAdminReadAllNotificationsMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await api.put('/admin/notifications/read-all');
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'notifications'] });
    },
  });
}

export function useAdminActivityLogsQuery(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: queryKeys.admin.activityLogs(params),
    queryFn: async () => {
      const res = await api.get('/admin/activity-logs', { params });
      return res.data;
    },
  });
}

export function useAdminAdminsQuery(params?: Record<string, unknown>, enabled = true) {
  return useQuery({
    queryKey: queryKeys.admin.admins(params),
    queryFn: async () => {
      const res = await api.get('/admin/admins', { params });
      return res.data;
    },
    enabled,
  });
}

export function useAdminCreateAdminMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const res = await api.post('/admin/admins', payload);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'admins'] });
    },
  });
}

export function useAdminDeleteAdminMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await api.delete(`/admin/admins/${id}`);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'admins'] });
    },
  });
}

// ── Categories ──
export function useAdminCategoriesQuery(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: queryKeys.admin.categories(params),
    queryFn: async () => {
      const res = await api.get('/admin/categories', { params });
      return res.data;
    },
  });
}

export function useAdminCreateCategoryMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await api.post('/admin/categories', data);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'categories'] }),
  });
}

export function useAdminUpdateCategoryMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & Record<string, unknown>) => {
      const res = await api.put(`/admin/categories/${id}`, data);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'categories'] }),
  });
}

export function useAdminDeleteCategoryMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await api.delete(`/admin/categories/${id}`);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'categories'] }),
  });
}

// ── Reviews ──
export function useAdminReviewsQuery(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: queryKeys.admin.reviews(params),
    queryFn: async () => {
      const res = await api.get('/admin/reviews', { params });
      return res.data;
    },
  });
}

export function useAdminUpdateReviewMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await api.put(`/admin/reviews/${id}/status`, { status });
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'reviews'] }),
  });
}

export function useAdminDeleteReviewMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await api.delete(`/admin/reviews/${id}`);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'reviews'] }),
  });
}

export function useAdminCreateCustomReviewMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      product_id: number;
      custom_reviewer_name: string;
      rating: number;
      title?: string;
      body: string;
    }) => {
      const res = await api.post('/admin/reviews/custom', payload);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'reviews'] }),
  });
}

// ── CMS Pages ──
export function useAdminPagesQuery(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: queryKeys.admin.pages(params),
    queryFn: async () => {
      const res = await api.get('/admin/pages', { params });
      return res.data;
    },
  });
}

export function useAdminCreatePageMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await api.post('/admin/pages', data);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'pages'] }),
  });
}

export function useAdminUpdatePageMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & Record<string, unknown>) => {
      const res = await api.put(`/admin/pages/${id}`, data);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'pages'] }),
  });
}

export function useAdminDeletePageMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await api.delete(`/admin/pages/${id}`);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'pages'] }),
  });
}

// ── CMS Posts ──
export function useAdminPostsQuery(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: queryKeys.admin.posts(params),
    queryFn: async () => {
      const res = await api.get('/admin/posts', { params });
      return res.data;
    },
  });
}

export function useAdminCreatePostMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await api.post('/admin/posts', data);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'posts'] }),
  });
}

export function useAdminUpdatePostMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & Record<string, unknown>) => {
      const res = await api.put(`/admin/posts/${id}`, data);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'posts'] }),
  });
}

export function useAdminDeletePostMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await api.delete(`/admin/posts/${id}`);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'posts'] }),
  });
}

// ── CMS Banners ──
export function useAdminBannersQuery(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: queryKeys.admin.banners(params),
    queryFn: async () => {
      const res = await api.get('/admin/banners', { params });
      return res.data;
    },
  });
}

export function useAdminCreateBannerMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const res = await api.post('/admin/banners', payload);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'banners'] }),
  });
}

export function useAdminUpdateBannerMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: { id: number } & Record<string, unknown>) => {
      const res = await api.put(`/admin/banners/${id}`, payload);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'banners'] }),
  });
}

export function useAdminDeleteBannerMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await api.delete(`/admin/banners/${id}`);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'banners'] }),
  });
}

// ── CMS FAQs ──
export function useAdminFaqsQuery(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: queryKeys.admin.faqs(params),
    queryFn: async () => {
      const res = await api.get('/admin/faqs', { params });
      return res.data;
    },
  });
}

export function useAdminCreateFaqMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await api.post('/admin/faqs', data);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'faqs'] }),
  });
}

export function useAdminUpdateFaqMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & Record<string, unknown>) => {
      const res = await api.put(`/admin/faqs/${id}`, data);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'faqs'] }),
  });
}

export function useAdminDeleteFaqMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await api.delete(`/admin/faqs/${id}`);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'faqs'] }),
  });
}

// ── Media ──
export function useAdminMediaQuery(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: queryKeys.admin.media(params),
    queryFn: async () => {
      const res = await api.get('/admin/media', { params });
      return res.data;
    },
  });
}

export function useAdminUploadMediaMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await api.post('/admin/media', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'media'] }),
  });
}

export function useAdminDeleteMediaMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await api.delete(`/admin/media/${id}`);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'media'] }),
  });
}

// ── Settings ──
export function useAdminSettingsQuery(group?: string) {
  return useQuery({
    queryKey: queryKeys.admin.settings(group),
    queryFn: async () => {
      const res = await api.get('/admin/settings', { params: group ? { group } : {} });
      return res.data;
    },
  });
}

export function useAdminUpdateSettingsMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { settings: Array<{ group: string; key: string; value: unknown }> }) => {
      const res = await api.put('/admin/settings', payload);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'settings'] }),
  });
}

// -- Module License Management --
export function useAdminModulesQuery(params?: Record<string, unknown>, enabled = true) {
  return useQuery({
    queryKey: queryKeys.admin.modules(params),
    queryFn: async () => {
      const res = await api.get('/admin/modules', { params });
      return res.data;
    },
    enabled,
  });
}

export function useAdminModuleQuery(id: number, enabled = true) {
  return useQuery({
    queryKey: queryKeys.admin.module(id),
    queryFn: async () => {
      const res = await api.get(`/admin/modules/${id}`);
      return res.data;
    },
    enabled,
  });
}

export function useAdminCreateModuleMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const res = await api.post('/admin/modules', payload);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'modules'] });
    },
  });
}

export function useAdminUpdateModuleMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: { id: number } & Record<string, unknown>) => {
      const res = await api.put(`/admin/modules/${id}`, payload);
      return res.data;
    },
    onSuccess: (_res, vars) => {
      qc.invalidateQueries({ queryKey: ['admin', 'modules'] });
      qc.invalidateQueries({ queryKey: queryKeys.admin.module(vars.id) });
    },
  });
}

export function useAdminToggleModuleMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, is_enabled, notes }: { id: number; is_enabled: boolean; notes?: string }) => {
      const res = await api.put(`/admin/modules/${id}/toggle`, { is_enabled, notes });
      return res.data;
    },
    onSuccess: (_res, vars) => {
      qc.invalidateQueries({ queryKey: ['admin', 'modules'] });
      qc.invalidateQueries({ queryKey: queryKeys.admin.module(vars.id) });
      qc.invalidateQueries({ queryKey: queryKeys.admin.moduleHealth(vars.id) });
    },
  });
}

export function useAdminValidateModuleLicenseMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, license_key }: { id: number; license_key?: string }) => {
      const res = await api.post(`/admin/modules/${id}/validate-license`, { license_key });
      return res.data;
    },
    onSuccess: (_res, vars) => {
      qc.invalidateQueries({ queryKey: ['admin', 'modules'] });
      qc.invalidateQueries({ queryKey: queryKeys.admin.module(vars.id) });
      qc.invalidateQueries({ queryKey: queryKeys.admin.moduleHealth(vars.id) });
    },
  });
}

// ── Admin Alerts ──
export function useAdminAlertsQuery(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: queryKeys.admin.alerts(params) || ['admin', 'alerts', params],
    queryFn: async () => {
      const res = await api.get('/admin/alerts', { params });
      return res.data;
    },
  });
}

export function useAdminCreateAlertMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await api.post('/admin/alerts', data);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'alerts'] }),
  });
}

export function useAdminUpdateAlertMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & Record<string, unknown>) => {
      const res = await api.put(`/admin/alerts/${id}`, data);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'alerts'] }),
  });
}

export function useAdminDeleteAlertMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await api.delete(`/admin/alerts/${id}`);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'alerts'] }),
  });
}

// ── Admin Popups ──
export function useAdminPopupsQuery(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: queryKeys.admin.popups(params) || ['admin', 'popups', params],
    queryFn: async () => {
      const res = await api.get('/admin/popups', { params });
      return res.data;
    },
  });
}

export function useAdminCreatePopupMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await api.post('/admin/popups', data);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'popups'] }),
  });
}

export function useAdminUpdatePopupMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & Record<string, unknown>) => {
      const res = await api.put(`/admin/popups/${id}`, data);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'popups'] }),
  });
}

export function useAdminDeletePopupMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await api.delete(`/admin/popups/${id}`);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'popups'] }),
  });
}

// ── Admin Contact Messages ──
export function useAdminContactMessagesQuery(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: queryKeys.admin.contactMessages(params) || ['admin', 'contactMessages', params],
    queryFn: async () => {
      const res = await api.get('/admin/contact-messages', { params });
      return res.data;
    },
  });
}

export function useAdminUpdateContactMessageMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & Record<string, unknown>) => {
      const res = await api.put(`/admin/contact-messages/${id}/read`, data);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'contactMessages'] }),
  });
}

export function useAdminDeleteContactMessageMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await api.delete(`/admin/contact-messages/${id}`);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'contactMessages'] }),
  });
}

// ── Admin Subscribers ──
export function useAdminSubscribersQuery(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: queryKeys.admin.subscribers(params) || ['admin', 'subscribers', params],
    queryFn: async () => {
      const res = await api.get('/admin/subscribers', { params });
      return res.data;
    },
  });
}

export function useAdminToggleSubscriberMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await api.put(`/admin/subscribers/${id}/toggle-status`);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'subscribers'] }),
  });
}

export function useAdminDeleteSubscriberMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await api.delete(`/admin/subscribers/${id}`);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'subscribers'] }),
  });
}

// ── Admin Notification Templates ──
export function useAdminNotificationTemplatesQuery(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: queryKeys.admin.notificationTemplates(params) || ['admin', 'notificationTemplates', params],
    queryFn: async () => {
      const res = await api.get('/admin/notification-templates', { params });
      return res.data;
    },
  });
}

export function useAdminUpdateNotificationTemplateMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & Record<string, unknown>) => {
      const res = await api.put(`/admin/notification-templates/${id}`, data);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'notificationTemplates'] }),
  });
}

export function useAdminUpdateModuleCredentialsMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, config_json, integration_status, notes }: {
      id: number;
      config_json: Record<string, unknown>;
      integration_status?: 'not_configured' | 'configured' | 'healthy' | 'degraded' | 'failed';
      notes?: string;
    }) => {
      const res = await api.put(`/admin/modules/${id}/credentials`, { config_json, integration_status, notes });
      return res.data;
    },
    onSuccess: (_res, vars) => {
      qc.invalidateQueries({ queryKey: ['admin', 'modules'] });
      qc.invalidateQueries({ queryKey: queryKeys.admin.module(vars.id) });
      qc.invalidateQueries({ queryKey: queryKeys.admin.moduleHealth(vars.id) });
    },
  });
}

export function useAdminModuleHealthQuery(id: number, enabled = true) {
  return useQuery({
    queryKey: queryKeys.admin.moduleHealth(id),
    queryFn: async () => {
      const res = await api.get(`/admin/modules/${id}/health`);
      return res.data;
    },
    enabled,
    retry: false,
  });
}

export function useAdminRequestModuleActivationMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reason }: { id: number; reason: string }) => {
      const res = await api.post(`/admin/modules/${id}/activation-request`, { reason });
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'modules'] }),
  });
}

// ==========================================
// Brands
// ==========================================

export function useAdminBrandsQuery(params?: Record<string, any>) {
  return useQuery({
    queryKey: queryKeys.admin.brands(params),
    queryFn: async () => {
      const res = await api.get('/admin/brands', { params });
      return res.data;
    },
  });
}

export function useAdminCreateBrandMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Record<string, any>) => {
      const res = await api.post('/admin/brands', data);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.admin.brands() }),
  });
}

export function useAdminUpdateBrandMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & Record<string, any>) => {
      const res = await api.put(`/admin/brands/${id}`, data);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.admin.brands() }),
  });
}

export function useAdminDeleteBrandMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await api.delete(`/admin/brands/${id}`);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.admin.brands() }),
  });
}

// ==========================================
// Product Q&A
// ==========================================

export function useAdminProductQueriesQuery(params?: Record<string, any>) {
  return useQuery({
    queryKey: queryKeys.admin.productQueries(params),
    queryFn: async () => {
      const res = await api.get('/admin/product-queries', { params });
      return res.data;
    },
  });
}

export function useAdminAnswerQueryMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, answer }: { id: number; answer: string }) => {
      const res = await api.put(`/admin/product-queries/${id}/answer`, { answer });
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.admin.productQueries() }),
  });
}

export function useAdminRejectQueryMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await api.put(`/admin/product-queries/${id}/reject`);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.admin.productQueries() }),
  });
}

export function useAdminDeleteQueryMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await api.delete(`/admin/product-queries/${id}`);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.admin.productQueries() }),
  });
}

// ==========================================
// Cross-Sells
// ==========================================

export function useAdminCrossSellsQuery(productId: number, enabled = true) {
  return useQuery({
    queryKey: ['admin', 'crossSells', productId] as const,
    queryFn: async () => {
      const res = await api.get(`/admin/products/${productId}/cross-sells`);
      return res.data;
    },
    enabled,
  });
}

export function useAdminSyncCrossSellsMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ productId, related_product_ids }: { productId: number; related_product_ids: number[] }) => {
      const res = await api.put(`/admin/products/${productId}/cross-sells`, { related_product_ids });
      return res.data;
    },
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ['admin', 'crossSells', vars.productId] }),
  });
}

// ==========================================
// Phase 9: Customer Management Enhancement
// ==========================================

export function useAdminCustomerQuery(id: number, enabled = true) {
  return useQuery({
    queryKey: ['admin', 'customers', id],
    queryFn: async () => {
      const res = await api.get(`/admin/customers/${id}`);
      return res.data;
    },
    enabled,
  });
}

export function useAdminUpdateCustomerMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & Record<string, unknown>) => {
      const res = await api.put(`/admin/customers/${id}`, data);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'customers'] }),
  });
}

export function useAdminToggleCustomerStatusMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await api.put(`/admin/customers/${id}/status`);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'customers'] }),
  });
}

export function useAdminBanCustomerMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reason }: { id: number; reason: string }) => {
      const res = await api.post(`/admin/customers/${id}/ban`, { reason });
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'customers'] }),
  });
}

export function useAdminUnbanCustomerMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await api.post(`/admin/customers/${id}/unban`);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'customers'] }),
  });
}

export function useAdminMarkSuspiciousMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, is_suspicious, reason }: { id: number; is_suspicious: boolean; reason?: string }) => {
      const res = await api.put(`/admin/customers/${id}/suspicious`, { is_suspicious, reason });
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'customers'] }),
  });
}

export function useAdminBulkDeleteCustomersMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ids: number[]) => {
      const res = await api.post('/admin/customers/bulk-delete', { ids });
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'customers'] }),
  });
}

export function useAdminExportCustomersMutation() {
  return useMutation({
    mutationFn: async (params: Record<string, unknown>) => {
      const res = await api.post('/admin/customers/export', params);
      return res.data;
    },
  });
}

// ==========================================
// Phase 10: Product Attributes, Colors, Size Charts, Warranties
// ==========================================

export function useAdminAttributesQuery(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: queryKeys.admin.attributes(params),
    queryFn: async () => {
      const res = await api.get('/admin/attributes', { params });
      return res.data;
    },
  });
}

export function useAdminCreateAttributeMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await api.post('/admin/attributes', data);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'attributes'] }),
  });
}

export function useAdminUpdateAttributeMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & Record<string, unknown>) => {
      const res = await api.put(`/admin/attributes/${id}`, data);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'attributes'] }),
  });
}

export function useAdminDeleteAttributeMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await api.delete(`/admin/attributes/${id}`);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'attributes'] }),
  });
}

export function useAdminColorsQuery(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: queryKeys.admin.colors(params),
    queryFn: async () => {
      const res = await api.get('/admin/colors', { params });
      return res.data;
    },
  });
}

export function useAdminCreateColorMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await api.post('/admin/colors', data);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'colors'] }),
  });
}

export function useAdminUpdateColorMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & Record<string, unknown>) => {
      const res = await api.put(`/admin/colors/${id}`, data);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'colors'] }),
  });
}

export function useAdminDeleteColorMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await api.delete(`/admin/colors/${id}`);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'colors'] }),
  });
}

export function useAdminSizeChartsQuery(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: queryKeys.admin.sizeCharts(params),
    queryFn: async () => {
      const res = await api.get('/admin/size-charts', { params });
      return res.data;
    },
  });
}

export function useAdminCreateSizeChartMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await api.post('/admin/size-charts', data);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'sizeCharts'] }),
  });
}

export function useAdminUpdateSizeChartMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & Record<string, unknown>) => {
      const res = await api.put(`/admin/size-charts/${id}`, data);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'sizeCharts'] }),
  });
}

export function useAdminDeleteSizeChartMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await api.delete(`/admin/size-charts/${id}`);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'sizeCharts'] }),
  });
}

export function useAdminWarrantiesQuery(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: queryKeys.admin.warranties(params),
    queryFn: async () => {
      const res = await api.get('/admin/warranties', { params });
      return res.data;
    },
  });
}

export function useAdminCreateWarrantyMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await api.post('/admin/warranties', data);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'warranties'] }),
  });
}

export function useAdminUpdateWarrantyMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & Record<string, unknown>) => {
      const res = await api.put(`/admin/warranties/${id}`, data);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'warranties'] }),
  });
}

export function useAdminDeleteWarrantyMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await api.delete(`/admin/warranties/${id}`);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'warranties'] }),
  });
}

// ==========================================
// Phase 11: Reports & Analytics Enhancement
// ==========================================

export function useAdminStockReportQuery(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: queryKeys.admin.stockReport(params),
    queryFn: async () => {
      const res = await api.get('/admin/analytics/stock', { params });
      return res.data;
    },
  });
}

export function useAdminWishlistReportQuery() {
  return useQuery({
    queryKey: queryKeys.admin.wishlistReport,
    queryFn: async () => {
      const res = await api.get('/admin/analytics/wishlist');
      return res.data;
    },
  });
}

export function useAdminCategoryReportQuery() {
  return useQuery({
    queryKey: queryKeys.admin.categoryReport,
    queryFn: async () => {
      const res = await api.get('/admin/analytics/categories');
      return res.data;
    },
  });
}

// ==========================================
// Phase 12: Notification Templates Enhancement
// ==========================================

export function useAdminToggleNotificationTemplateMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await api.put(`/admin/notification-templates/${id}/toggle`);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'notificationTemplates'] }),
  });
}

export function useAdminPreviewNotificationTemplateQuery(id: number, enabled = true) {
  return useQuery({
    queryKey: ['admin', 'notificationTemplates', id, 'preview'],
    queryFn: async () => {
      const res = await api.get(`/admin/notification-templates/${id}/preview`);
      return res.data;
    },
    enabled,
  });
}

export function useAdminTestSmtpMutation() {
  return useMutation({
    mutationFn: async (to_email: string) => {
      const res = await api.post('/admin/notification-templates/test-smtp', { to_email });
      return res.data;
    },
  });
}

// ==========================================
// Phase 13: Media Enhancement
// ==========================================

export function useAdminMediaItemQuery(id: number, enabled = true) {
  return useQuery({
    queryKey: queryKeys.admin.mediaItem(id),
    queryFn: async () => {
      const res = await api.get(`/admin/media/${id}`);
      return res.data;
    },
    enabled,
  });
}

export function useAdminUpdateMediaMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & Record<string, unknown>) => {
      const res = await api.put(`/admin/media/${id}`, data);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'media'] }),
  });
}

export function useAdminBulkDeleteMediaMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ids: number[]) => {
      const res = await api.post('/admin/media/bulk-delete', { ids });
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'media'] }),
  });
}

export function useAdminMediaStatsQuery() {
  return useQuery({
    queryKey: queryKeys.admin.mediaStats,
    queryFn: async () => {
      const res = await api.get('/admin/media/stats');
      return res.data;
    },
  });
}

// ==========================================
// Phase 18: Reviews Enhancement
// ==========================================

export function useAdminReviewStatsQuery() {
  return useQuery({
    queryKey: queryKeys.admin.reviewStats,
    queryFn: async () => {
      const res = await api.get('/admin/reviews/statistics');
      return res.data;
    },
  });
}

export function useAdminBulkUpdateReviewStatusMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ ids, status }: { ids: number[]; status: string }) => {
      const res = await api.post('/admin/reviews/bulk-status', { ids, status });
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'reviews'] }),
  });
}

export function useAdminBulkDeleteReviewsMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ids: number[]) => {
      const res = await api.post('/admin/reviews/bulk-delete', { ids });
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'reviews'] }),
  });
}

export function useAdminExportReviewsMutation() {
  return useMutation({
    mutationFn: async (params: Record<string, unknown>) => {
      const res = await api.post('/admin/reviews/export', params);
      return res.data;
    },
  });
}

// ==========================================
// Phase 20: System Administration
// ==========================================

export function useAdminSystemInfoQuery() {
  return useQuery({
    queryKey: queryKeys.admin.systemInfo,
    queryFn: async () => {
      const res = await api.get('/admin/system/info');
      return res.data;
    },
  });
}

export function useAdminSystemHealthQuery() {
  return useQuery({
    queryKey: queryKeys.admin.systemHealth,
    queryFn: async () => {
      const res = await api.get('/admin/system/health');
      return res.data;
    },
  });
}

export function useAdminDbStatsQuery() {
  return useQuery({
    queryKey: queryKeys.admin.dbStats,
    queryFn: async () => {
      const res = await api.get('/admin/system/db-stats');
      return res.data;
    },
  });
}

export function useAdminClearCacheMutation() {
  return useMutation({
    mutationFn: async (type: string) => {
      const res = await api.post('/admin/system/clear-cache', { type });
      return res.data;
    },
  });
}

export function useAdminMaintenanceModeMutation() {
  return useMutation({
    mutationFn: async ({ enabled, message }: { enabled: boolean; message?: string }) => {
      const res = await api.post('/admin/system/maintenance', { enabled, message });
      return res.data;
    },
  });
}
