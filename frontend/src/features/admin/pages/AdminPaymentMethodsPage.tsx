import { useEffect, useState } from 'react';
import {
  useAdminPaymentMethodsQuery,
  useAdminRazorpayHealthQuery,
  useUpdateAdminPaymentMethodMutation,
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
  const updateMethod = useUpdateAdminPaymentMethodMutation();
  const [forms, setForms] = useState<Record<string, any>>({});

  const [healthVisible, setHealthVisible] = useState(false);
  const { data: healthData, isFetching: healthLoading } = useAdminRazorpayHealthQuery(healthVisible);

  useEffect(() => {
    const next: Record<string, any> = {};
    for (const method of methods ?? []) {
      next[method.code] = {
        is_enabled: method.is_enabled,
        environment: String((method as any).environment ?? method.config?.environment ?? method.settings?.environment ?? 'sandbox'),
        settings: { ...(method as any).settings },
      };
    }
    setForms(next);
  }, [methods]);

  const updateForm = (code: string, key: string, value: unknown) => {
    setForms((prev) => ({
      ...prev,
      [code]: {
        ...prev[code],
        settings: {
          ...(prev[code]?.settings ?? {}),
          [key]: value,
        },
      },
    }));
  };

  const saveMethod = async (method: AdminPaymentMethod) => {
    const form = forms[method.code] ?? {};
    await updateMethod.mutateAsync({
      code: method.code,
      payload: {
        is_enabled: Boolean(form.is_enabled),
        environment: form.environment,
        settings: form.settings ?? {},
      },
    });
  };

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

            <div className="mt-5 space-y-3">
              <label className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
                <span className="font-medium text-slate-700">Enabled</span>
                <input
                  type="checkbox"
                  checked={Boolean(forms[method.code]?.is_enabled)}
                  onChange={(event) => setForms((prev) => ({
                    ...prev,
                    [method.code]: { ...prev[method.code], is_enabled: event.target.checked },
                  }))}
                />
              </label>

              <label className="block text-sm">
                <span className="font-medium text-slate-700">Environment</span>
                <select
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                  value={forms[method.code]?.environment ?? 'sandbox'}
                  onChange={(event) => setForms((prev) => ({
                    ...prev,
                    [method.code]: { ...prev[method.code], environment: event.target.value },
                  }))}
                >
                  <option value="sandbox">Sandbox</option>
                  <option value="production">Production</option>
                </select>
              </label>

              {method.code === 'razorpay' && (
                <>
                  <Field label="Key ID" value={forms.razorpay?.settings?.key_id ?? ''} onChange={(value) => updateForm('razorpay', 'key_id', value)} />
                  <Field label="Key Secret" type="password" value={forms.razorpay?.settings?.key_secret ?? ''} onChange={(value) => updateForm('razorpay', 'key_secret', value)} />
                  <Field label="Webhook Secret" type="password" value={forms.razorpay?.settings?.webhook_secret ?? ''} onChange={(value) => updateForm('razorpay', 'webhook_secret', value)} />
                </>
              )}

              {method.code === 'phonepe' && (
                <>
                  <Field label="Client ID" value={forms.phonepe?.settings?.client_id ?? ''} onChange={(value) => updateForm('phonepe', 'client_id', value)} />
                  <Field label="Client Version" value={forms.phonepe?.settings?.client_version ?? ''} onChange={(value) => updateForm('phonepe', 'client_version', value)} />
                  <Field label="Client Secret" type="password" value={forms.phonepe?.settings?.client_secret ?? ''} onChange={(value) => updateForm('phonepe', 'client_secret', value)} />
                  <Field label="Base URL" value={forms.phonepe?.settings?.base_url ?? ''} onChange={(value) => updateForm('phonepe', 'base_url', value)} />
                  <Field label="Redirect URL" value={forms.phonepe?.settings?.redirect_url ?? ''} onChange={(value) => updateForm('phonepe', 'redirect_url', value)} />
                  <Field label="Callback URL" value={forms.phonepe?.settings?.callback_url ?? ''} onChange={(value) => updateForm('phonepe', 'callback_url', value)} />
                  <Field label="Timeout seconds" type="number" value={forms.phonepe?.settings?.timeout_seconds ?? '20'} onChange={(value) => updateForm('phonepe', 'timeout_seconds', value)} />
                </>
              )}

              <Button size="sm" loading={updateMethod.isPending} onClick={() => void saveMethod(method)}>
                Save {method.name}
              </Button>
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

function Field({ label, value, onChange, type = 'text' }: { label: string; value: string; type?: string; onChange: (value: string) => void }) {
  return (
    <label className="block text-sm">
      <span className="font-medium text-slate-700">{label}</span>
      <input
        type={type}
        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete="off"
      />
    </label>
  );
}
