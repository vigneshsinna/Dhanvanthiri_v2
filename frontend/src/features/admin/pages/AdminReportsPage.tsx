import { useState } from 'react';
import {
  useAdminAnalyticsExportMutation,
  useAdminExportStatusQuery,
  useRevenueChartQuery,
} from '@/features/admin/api';
import { AdminPageHeader } from '@/features/admin/components/AdminPageHeader';
import { Button } from '@/components/ui/Button';
import { PageLoader } from '@/components/ui/Spinner';

export function AdminReportsPage() {
  const [exportId, setExportId] = useState(1);
  const revenue = useRevenueChartQuery({ period: 'month', group_by: 'day' });
  const exportMutation = useAdminAnalyticsExportMutation();
  const exportStatus = useAdminExportStatusQuery(exportId, exportId > 0);

  if (revenue.isLoading) return <PageLoader />;

  const revenueData = revenue.data?.data?.data ?? revenue.data?.data ?? {};
  const points = revenueData.chart ?? [];
  const totalRevenue = revenueData.total_revenue ?? 0;
  const avgOrderValue = revenueData.avg_order_value ?? 0;
  const totalOrders = revenueData.total_orders ?? 0;
  const exportJob = exportStatus.data?.data?.data ?? exportStatus.data?.data ?? null;

  async function handleQueueExport() {
    const response = await exportMutation.mutateAsync({ type: 'revenue', period: 'month' });
    const nextExportId = Number(response?.data?.export_id ?? response?.data?.data?.export_id ?? 1);
    setExportId(nextExportId);
  }

  return (
    <section className="space-y-6">
      <AdminPageHeader
        eyebrow="Reports"
        title="Sales Reports"
        description="Review lightweight revenue trends and track export job status from the same reporting workspace."
        actions={<Button onClick={handleQueueExport} loading={exportMutation.isPending}>Queue Revenue Export</Button>}
      />

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-950">Revenue Trend</h2>

          <div className="mb-4 grid grid-cols-3 gap-3">
            <div className="rounded-2xl border border-slate-200 px-4 py-3 text-center">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Total Revenue</p>
              <p className="mt-1 text-xl font-semibold text-slate-950">Rs. {Number(totalRevenue).toLocaleString()}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 px-4 py-3 text-center">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Avg Order Value</p>
              <p className="mt-1 text-xl font-semibold text-slate-950">Rs. {Number(avgOrderValue).toLocaleString()}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 px-4 py-3 text-center">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Total Orders</p>
              <p className="mt-1 text-xl font-semibold text-slate-950">{totalOrders}</p>
            </div>
          </div>

          <div className="space-y-3">
            {points.map((point: any, index: number) => (
              <div key={`${point.date ?? index}`} className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 text-sm">
                <span className="text-slate-600">{point.date ?? `Point ${index + 1}`}</span>
                <span className="font-semibold text-slate-950">Rs. {Number(point.total ?? 0).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-950">Export Job</h2>
          {exportJob ? (
            <div className="space-y-3 text-sm">
              <div className="rounded-2xl border border-slate-200 px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Export ID</p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">#{exportJob.id}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Status</p>
                <p className="mt-2 text-lg font-semibold capitalize text-slate-950">{exportJob.status}</p>
              </div>
              {exportJob.download_url ? (
                <a href={exportJob.download_url} className="inline-flex text-sm font-medium text-brand-700 hover:underline">
                  Download export
                </a>
              ) : null}
            </div>
          ) : (
            <p className="text-sm text-slate-500">No export job data available yet.</p>
          )}
        </div>
      </div>
    </section>
  );
}
