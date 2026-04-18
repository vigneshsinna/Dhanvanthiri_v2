import { useState } from 'react';
import {
  useAdminPaymentMethodsQuery,
  useAdminRazorpayHealthQuery,
  type AdminPaymentMethod,
} from '@/features/admin/api';
import { AdminPageHeader } from '@/features/admin/components/AdminPageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { PageLoader } from '@/components/ui/Spinner';
import { useAppSelector } from '@/lib/utils/hooks';

export function AdminPaymentMethodsPage() {
  const userRole = useAppSelector((s) => s.auth.user?.role);
  const isSuperAdmin = userRole === 'super_admin';
  const { data: methods, isLoading } = useAdminPaymentMethodsQuery(isSuperAdmin);

  const [healthVisible, setHealthVisible] = useState(false);
  const { data: healthData, isFetching: healthLoading } = useAdminRazorpayHealthQuery(healthVisible);

  if (!isSuperAdmin) {
    return (
      <section className="space-y-6">
        <AdminPageHeader
          eyebrow="Settings"
          title="Payment Methods"
          description="Payment gateway configuration is available only to the IT User."
        />
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          This page is restricted to super admins because payment gateway configuration affects live checkout behavior.
        </div>
      </section>
    );
  }

  if (isLoading) return <PageLoader />;

  return (
    <section className="space-y-6">
      <AdminPageHeader
        eyebrow="Settings"
        title="Payment Methods"
        description="Review the checkout payment method configuration and gateway health."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        {(methods ?? []).map((method: AdminPaymentMethod) => (
          <div key={method.code} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-semibold text-slate-900">{method.name}</h3>
                <p className="mt-1 text-sm text-slate-500">{method.description}</p>
                <Badge variant={method.type === 'online' ? 'info' : 'warning'} className="mt-2">
                  {method.type === 'online' ? 'Online' : 'Offline'}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={method.is_enabled ? 'success' : 'danger'}>
                  {method.is_enabled ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isSuperAdmin && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-900">Razorpay Connectivity</h3>
              <p className="mt-1 text-sm text-slate-500">Test whether the Razorpay API credentials are valid and the gateway is reachable.</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              loading={healthLoading}
              onClick={() => setHealthVisible(true)}
            >
              Test Connection
            </Button>
          </div>
          {healthData && (
            <div className={`mt-4 rounded-lg px-4 py-3 text-sm ${healthData.healthy ? 'border border-green-200 bg-green-50 text-green-700' : 'border border-red-200 bg-red-50 text-red-700'}`}>
              {healthData.healthy
                ? `Connected - ${healthData.message ?? 'Razorpay API is reachable'}`
                : `Unhealthy - ${healthData.error ?? 'Could not reach Razorpay API'}`}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
