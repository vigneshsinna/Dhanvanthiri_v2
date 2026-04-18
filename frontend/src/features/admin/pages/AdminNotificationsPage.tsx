import { useAdminNotificationsQuery, useAdminReadAllNotificationsMutation } from '@/features/admin/api';
import { AdminPageHeader } from '@/features/admin/components/AdminPageHeader';
import { Button } from '@/components/ui/Button';
import { PageLoader } from '@/components/ui/Spinner';

export function AdminNotificationsPage() {
  const { data, isLoading } = useAdminNotificationsQuery();
  const readAll = useAdminReadAllNotificationsMutation();
  const rows = Array.isArray(data?.data?.data) ? data.data.data : Array.isArray(data?.data) ? data.data : [];

  if (isLoading) return <PageLoader />;

  return (
    <section className="space-y-6">
      <AdminPageHeader
        eyebrow="System"
        title="System Notifications"
        description="Monitor admin alerts and clear the queue when everything has been reviewed."
        actions={<Button variant="outline" onClick={() => readAll.mutate()} loading={readAll.isPending}>Mark all as read</Button>}
      />

      <div className="space-y-3">
        {rows.map((notification: any) => (
          <div key={notification.id} className="rounded-[24px] border border-slate-200 bg-white px-5 py-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-slate-950">{notification.message ?? notification.data?.message ?? notification.data?.title ?? notification.type}</p>
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${notification.read || notification.read_at ? 'bg-slate-100 text-slate-500' : 'bg-amber-100 text-amber-800'}`}>
                {notification.read || notification.read_at ? 'Read' : 'Unread'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
