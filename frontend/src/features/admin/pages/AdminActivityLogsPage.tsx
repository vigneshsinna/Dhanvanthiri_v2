import { useAdminActivityLogsQuery } from '@/features/admin/api';
import { AdminPageHeader } from '@/features/admin/components/AdminPageHeader';
import { PageLoader } from '@/components/ui/Spinner';

export function AdminActivityLogsPage() {
  const { data, isLoading } = useAdminActivityLogsQuery();
  const rows = data?.data?.data ?? data?.data ?? [];

  if (isLoading) return <PageLoader />;

  return (
    <section className="space-y-6">
      <AdminPageHeader
        eyebrow="System"
        title="System Activity Logs"
        description="Audit operational changes and support troubleshooting from the platform activity stream."
      />

      <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
        {rows.length === 0 ? (
          <p className="text-sm text-slate-500">No activity logs available in the current dataset.</p>
        ) : (
          <div className="space-y-3">
            {rows.map((row: any, index: number) => (
              <div key={row.id ?? index} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm">
                <p className="font-medium text-slate-950">{row.action ?? 'Activity'}</p>
                <p className="mt-1 text-slate-600">{row.description ?? 'No description provided.'}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
