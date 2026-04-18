import { useState } from 'react';
import {
  useAdminSystemInfoQuery,
  useAdminSystemHealthQuery,
  useAdminDbStatsQuery,
  useAdminClearCacheMutation,
  useAdminMaintenanceModeMutation,
} from '@/features/admin/api';
import { PageLoader } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  Server,
  Database,
  HardDrive,
  Activity,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

type TabKey = 'info' | 'health' | 'database' | 'maintenance';

export function AdminSystemPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('info');

  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'info', label: 'System Info', icon: <Server className="h-4 w-4" /> },
    { key: 'health', label: 'Health Check', icon: <Activity className="h-4 w-4" /> },
    { key: 'database', label: 'Database', icon: <Database className="h-4 w-4" /> },
    { key: 'maintenance', label: 'Maintenance', icon: <HardDrive className="h-4 w-4" /> },
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">System Administration</h1>

      <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'info' && <SystemInfoTab />}
      {activeTab === 'health' && <HealthCheckTab />}
      {activeTab === 'database' && <DatabaseTab />}
      {activeTab === 'maintenance' && <MaintenanceTab />}
    </div>
  );
}

function SystemInfoTab() {
  const { data, isLoading } = useAdminSystemInfoQuery();

  if (isLoading) return <PageLoader />;

  const info = data?.data ?? {};

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <InfoCard title="Application" items={[
        { label: 'App Name', value: info.app_name },
        { label: 'Environment', value: info.environment },
        { label: 'Debug Mode', value: info.debug_mode ? 'Enabled' : 'Disabled' },
        { label: 'Laravel Version', value: info.laravel_version },
        { label: 'PHP Version', value: info.php_version },
      ]} />
      <InfoCard title="Server" items={[
        { label: 'Server Software', value: info.server_software },
        { label: 'Server OS', value: info.server_os },
        { label: 'Timezone', value: info.timezone },
        { label: 'Memory Limit', value: info.memory_limit },
        { label: 'Max Upload', value: info.max_upload_size },
      ]} />
      <InfoCard title="Cache & Queue" items={[
        { label: 'Cache Driver', value: info.cache_driver },
        { label: 'Queue Driver', value: info.queue_driver },
        { label: 'Session Driver', value: info.session_driver },
      ]} />
      <InfoCard title="Storage" items={[
        { label: 'Disk Driver', value: info.filesystem_driver },
        { label: 'DB Connection', value: info.db_connection },
      ]} />
    </div>
  );
}

function InfoCard({ title, items }: { title: string; items: { label: string; value: string | undefined }[] }) {
  return (
    <div className="rounded-xl border bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-sm font-semibold uppercase text-slate-500">{title}</h3>
      <dl className="space-y-3">
        {items.map((item) => (
          <div key={item.label} className="flex justify-between">
            <dt className="text-sm text-slate-600">{item.label}</dt>
            <dd className="text-sm font-medium text-slate-900">{item.value ?? '—'}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function HealthCheckTab() {
  const { data, isLoading, refetch, isFetching } = useAdminSystemHealthQuery();

  if (isLoading) return <PageLoader />;

  const health = data?.data ?? {};
  const checks = health.checks ?? {};
  const overallStatus = health.status ?? 'unknown';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-lg font-semibold">Overall Status:</span>
          <Badge
            variant={overallStatus === 'healthy' ? 'success' : overallStatus === 'degraded' ? 'warning' : 'danger'}
            className="text-sm"
          >
            {overallStatus.toUpperCase()}
          </Badge>
        </div>
        <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
          {isFetching ? 'Checking...' : 'Re-check'}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Object.entries(checks).map(([name, check]: [string, unknown]) => {
          const c = check as { status: string; message?: string };
          return (
            <div key={name} className="rounded-xl border bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                {c.status === 'ok' || c.status === 'healthy' ? (
                  <CheckCircle2 className="h-6 w-6 text-green-500" />
                ) : c.status === 'degraded' ? (
                  <AlertTriangle className="h-6 w-6 text-yellow-500" />
                ) : (
                  <XCircle className="h-6 w-6 text-red-500" />
                )}
                <div>
                  <h4 className="font-medium capitalize text-slate-900">{name.replace(/_/g, ' ')}</h4>
                  <p className="text-sm text-slate-500">{c.message ?? c.status}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {Object.keys(checks).length === 0 && (
        <div className="rounded-xl border bg-white p-8 text-center text-slate-500 shadow-sm">
          No health check data available.
        </div>
      )}
    </div>
  );
}

function DatabaseTab() {
  const { data, isLoading } = useAdminDbStatsQuery();

  if (isLoading) return <PageLoader />;

  const stats = data?.data ?? {};
  const tables = stats.tables ?? [];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Total Tables" value={stats.total_tables ?? '—'} icon={<Database className="h-5 w-5 text-blue-500" />} />
        <StatCard label="Total Size" value={stats.total_size ?? '—'} icon={<HardDrive className="h-5 w-5 text-purple-500" />} />
        <StatCard label="DB Engine" value={stats.engine ?? '—'} icon={<Server className="h-5 w-5 text-green-500" />} />
      </div>

      {tables.length > 0 && (
        <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="border-b bg-slate-50 text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-6 py-3">Table</th>
                <th className="px-6 py-3">Rows</th>
                <th className="px-6 py-3">Size</th>
                <th className="px-6 py-3">Engine</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {tables.map((t: { name: string; rows: number; size: string; engine: string }) => (
                <tr key={t.name} className="hover:bg-slate-50">
                  <td className="px-6 py-2 font-mono text-xs text-slate-900">{t.name}</td>
                  <td className="px-6 py-2">{t.rows?.toLocaleString()}</td>
                  <td className="px-6 py-2">{t.size}</td>
                  <td className="px-6 py-2">{t.engine}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string | number; icon: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
        </div>
        {icon}
      </div>
    </div>
  );
}

function MaintenanceTab() {
  const clearCacheMut = useAdminClearCacheMutation();
  const maintenanceMut = useAdminMaintenanceModeMutation();
  const [confirmMaintenance, setConfirmMaintenance] = useState(false);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <h3 className="mb-2 text-lg font-semibold">Cache Management</h3>
        <p className="mb-4 text-sm text-slate-500">
          Clear application cache, config cache, route cache, and view cache.
        </p>
        <Button
          variant="outline"
          onClick={() => clearCacheMut.mutate('all')}
          disabled={clearCacheMut.isPending}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          {clearCacheMut.isPending ? 'Clearing...' : 'Clear All Caches'}
        </Button>
        {clearCacheMut.isSuccess && (
          <p className="mt-3 text-sm text-green-600">Cache cleared successfully.</p>
        )}
      </div>

      <div className="rounded-xl border border-red-200 bg-red-50 p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 text-red-500" />
          <div>
            <h3 className="mb-2 text-lg font-semibold text-red-800">Maintenance Mode</h3>
            <p className="mb-4 text-sm text-red-700">
              Enabling maintenance mode will make the storefront inaccessible to customers.
              Only admin users will be able to access the site.
            </p>
            {!confirmMaintenance ? (
              <Button
                variant="danger"
                onClick={() => setConfirmMaintenance(true)}
              >
                Toggle Maintenance Mode
              </Button>
            ) : (
              <div className="flex items-center gap-3">
                <Button
                  variant="danger"
                  onClick={() => {
                    maintenanceMut.mutate({ enabled: true });
                    setConfirmMaintenance(false);
                  }}
                  disabled={maintenanceMut.isPending}
                >
                  Enable Maintenance
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    maintenanceMut.mutate({ enabled: false });
                    setConfirmMaintenance(false);
                  }}
                  disabled={maintenanceMut.isPending}
                >
                  Disable Maintenance
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setConfirmMaintenance(false)}
                >
                  Cancel
                </Button>
              </div>
            )}
            {maintenanceMut.isSuccess && (
              <p className="mt-3 text-sm text-green-600">Maintenance mode updated.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
