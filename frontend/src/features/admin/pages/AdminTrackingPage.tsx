import { AdminPageHeader } from '@/features/admin/components/AdminPageHeader';

export function AdminTrackingPage() {
    return (
        <section className="space-y-6">
            <AdminPageHeader
                eyebrow="OMS"
                title="Tracking Overview"
                description="Monitor active shipments and delivery exceptions."
            />
            <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
                <h3 className="text-lg font-medium text-slate-900">Tracking Dashboard</h3>
                <p className="mt-2 text-sm text-slate-500">
                    The OMS tracking module is successfully activated. Real-time courier updates will appear here once connected.
                </p>
            </div>
        </section>
    );
}
