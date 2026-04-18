import { ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useDashboardSummaryQuery, useAdminModulesQuery, useOmsSummaryQuery } from '@/features/admin/api';
import { AdminPageHeader } from '@/features/admin/components/AdminPageHeader';
import { AdminStatCard } from '@/features/admin/components/AdminStatCard';
import { toDashboardViewModel } from '@/features/admin/lib/dashboardViewModel';
import { setPeriod } from '@/features/admin/store/adminSlice';
import { Badge } from '@/components/ui/Badge';
import { PageLoader } from '@/components/ui/Spinner';
import { isItUserRole } from '@/features/auth/roleDisplay';
import { useAppDispatch, useAppSelector } from '@/lib/utils/hooks';

const currency = new Intl.NumberFormat('en-IN', {
  maximumFractionDigits: 2,
  minimumFractionDigits: 0,
});

export function AdminDashboardPage() {
  const dispatch = useAppDispatch();
  const period = useAppSelector((s) => s.admin.period);
  const user = useAppSelector((s) => s.auth.user);
  const isItUser = isItUserRole(user?.role);
  const { data, isLoading } = useDashboardSummaryQuery(period);
  const { data: modulesResponse } = useAdminModulesQuery(undefined, isItUser);
  const { data: omsSummaryData } = useOmsSummaryQuery();
  const summary = toDashboardViewModel(data?.data ?? {});
  const modules = modulesResponse?.data?.data ?? modulesResponse?.data ?? [];
  const omsSummary = omsSummaryData?.data?.data ?? omsSummaryData?.data ?? null;

  if (isLoading) return <PageLoader />;

  const technicalWidgets = isItUser
    ? {
        enabledModules: modules.filter((module: { is_enabled: boolean }) => module.is_enabled).length,
        licenseIssues: modules.filter((module: { health_status: string; integration_status: string }) => (
          module.health_status === 'failed' || module.integration_status === 'failed'
        )).length,
        integrationAlerts: modules.filter((module: { health_status: string; integration_status: string }) => (
          module.health_status === 'degraded' || module.integration_status === 'degraded'
        )).length,
        credentialsPending: modules.filter((module: { has_credentials: boolean }) => !module.has_credentials).length,
      }
    : null;

  return (
    <div className="pb-10 space-y-8">
      <AdminPageHeader
        variant="hero"
        eyebrow={isItUser ? 'Platform Core' : 'Business Insights'}
        title="Dashboard"
        description={
          isItUser
            ? 'Pulse from one clear control center. Monitor order flow, module readiness, and system health in real-time.'
            : 'Operational command center. Track revenue cycles, order velocity, and inventory risks from a unified perspective.'
        }
        actions={(
          <div className="relative group">
            <select
              value={period}
              onChange={(e) => dispatch(setPeriod(e.target.value as typeof period))}
              className="appearance-none rounded-2xl border border-white/10 bg-white/10 px-6 py-3.5 pr-12 text-sm font-semibold text-white shadow-xl backdrop-blur-xl transition hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
            >
              <option value="today" className="text-slate-900">Today</option>
              <option value="week" className="text-slate-900">This Week</option>
              <option value="month" className="text-slate-900">This Month</option>
              <option value="year" className="text-slate-900">This Year</option>
            </select>
            <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-white/50">
              <ChevronDown className="h-4 w-4" />
            </div>
          </div>
        )}
      />

      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard label="Total Revenue" value={`Rs. ${currency.format(summary.kpis.revenue.value)}`} change={summary.kpis.revenue.change} accent="info" />
        <AdminStatCard label="Total Orders" value={summary.kpis.orders.value} change={summary.kpis.orders.change} />
        <AdminStatCard label="Customer Base" value={summary.kpis.customers.value} accent="success" />
        <AdminStatCard label="Inventory Alert" value={summary.kpis.lowStock.value} accent="warning" />
      </div>

      {technicalWidgets ? (
        <div className="rounded-[32px] border border-slate-200/60 bg-white/60 p-6 shadow-sm backdrop-blur-xl sm:p-8">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Core Infrastructure</p>
              <h2 className="text-2xl font-bold tracking-tight text-slate-950">Technical Oversight</h2>
            </div>
            <Link to="/store-admin/modules" className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:bg-slate-800">
              Go to Module Desk
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <AdminStatCard label="Active Modules" value={technicalWidgets.enabledModules} accent="success" />
            <AdminStatCard label="Critical Issues" value={technicalWidgets.licenseIssues} accent="warning" />
            <AdminStatCard label="Service Alerts" value={technicalWidgets.integrationAlerts} accent="info" />
            <AdminStatCard label="Pending Setup" value={technicalWidgets.credentialsPending} />
          </div>
        </div>
      ) : null}

      {omsSummary ? (
        <div className="rounded-[32px] border border-slate-200/60 bg-white/60 p-6 shadow-sm backdrop-blur-xl sm:p-8">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Logistics & Supply</p>
              <h2 className="text-2xl font-bold tracking-tight text-slate-950">OMS Command</h2>
            </div>
            <Link to="/store-admin/orders" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50">
              Open Full OMS
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-6">
            <AdminStatCard label="Today's Intake" value={omsSummary.today?.new_orders ?? 0} accent="info" />
            <AdminStatCard label="Daily Revenue" value={`Rs. ${currency.format(omsSummary.today?.revenue ?? 0)}`} accent="success" />
            <AdminStatCard label="Dispatch Count" value={omsSummary.today?.delivered ?? 0} accent="success" />
            <AdminStatCard label="Order Attrition" value={omsSummary.today?.cancelled ?? 0} accent="warning" />
          </div>
          {omsSummary.alerts && (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <SummaryCard label="Overdue Proc." value={omsSummary.alerts.overdue_processing ?? 0} tone="rose" />
              <SummaryCard label="Pending Ret." value={omsSummary.alerts.pending_returns ?? 0} tone="amber" />
              <SummaryCard label="Low Stock Queue" value={omsSummary.alerts.low_stock_orders ?? 0} tone="amber" />
              <SummaryCard label="Stale Log." value={omsSummary.alerts.stale_shipments ?? 0} tone="sky" />
            </div>
          )}
        </div>
      ) : null}

      <div className="grid gap-8 xl:grid-cols-[1.4fr_0.9fr]">
        <div className="space-y-8">
          <div className="rounded-[32px] border border-slate-200/60 bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-6 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Order Flow</p>
                <h2 className="text-xl font-bold tracking-tight text-slate-950">OMS Pulse</h2>
              </div>
              <Link to="/store-admin/orders" className="text-sm font-bold text-brand-600 hover:text-brand-700">Open OMS</Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Object.entries(summary.orderStatus).map(([status, count]) => (
                <div key={status} className="group rounded-2xl border border-slate-100 bg-slate-50/50 p-5 transition-all hover:bg-white hover:shadow-md">
                  <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400 transition-colors group-hover:text-brand-500">{status.replace(/_/g, ' ')}</p>
                  <p className="mt-4 text-3xl font-bold tracking-tight text-slate-950">{count}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[32px] border border-slate-200/60 bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-6 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Recent Activity</p>
                <h2 className="text-xl font-bold tracking-tight text-slate-950">Active Orders</h2>
              </div>
              <Link to="/store-admin/orders" className="text-sm font-bold text-brand-600 hover:text-brand-700">View History</Link>
            </div>
            <div className="space-y-3">
              {summary.recentOrders.map((order) => (
                <div key={order.id} className="group flex items-center justify-between rounded-2xl border border-slate-100 px-5 py-4 transition-all hover:border-slate-200 hover:bg-slate-50/50">
                  <div className="space-y-1">
                    <p className="font-bold text-slate-950">{order.orderNumber}</p>
                    <p className="text-xs font-medium text-slate-500">
                      {order.customerName}
                      <span className="mx-2 text-slate-300">•</span>
                      {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant={order.status === 'delivered' ? 'success' : 'info'} className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider">
                      {order.status.replace(/_/g, ' ')}
                    </Badge>
                    <span className="text-sm font-bold text-slate-950">Rs. {currency.format(order.total)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[32px] border border-slate-200/60 bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-6 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Demand Analysis</p>
                <h2 className="text-xl font-bold tracking-tight text-slate-950">Popular Items</h2>
              </div>
              <Link to="/store-admin/products" className="text-sm font-bold text-brand-600 hover:text-brand-700">Catalog</Link>
            </div>
            <div className="space-y-3">
              {summary.topProducts.map((product, index) => (
                <div key={product.id} className="group flex items-center justify-between rounded-2xl border border-slate-100 px-5 py-4 transition-all hover:bg-slate-50/50">
                  <div className="flex items-center gap-4">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 text-xs font-bold text-white group-hover:bg-brand-600 transition-colors">
                      {index + 1}
                    </span>
                    <div className="space-y-0.5">
                      <p className="font-bold text-slate-950">{product.name}</p>
                      <p className="text-xs font-medium text-slate-500">{product.totalSold} Units Sold</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-slate-950">Rs. {currency.format(product.revenue)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="rounded-[32px] border border-slate-200/60 bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-6 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Attention Items</p>
                <h2 className="text-xl font-bold tracking-tight text-slate-950">Action Needed</h2>
              </div>
              <Link to="/store-admin/inventory" className="text-sm font-bold text-brand-600 hover:text-brand-700">Review</Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <SummaryCard label="Low stock" value={summary.actionRequired.lowStock} tone="amber" />
              <SummaryCard label="OOS Risk" value={summary.actionRequired.outOfStock} tone="rose" />
              <SummaryCard label="Returns" value={summary.actionRequired.pendingReturns} tone="sky" />
              <SummaryCard label="Reviews" value={summary.actionRequired.pendingReviews} tone="violet" />
            </div>
          </div>

          <div className="rounded-[32px] border border-slate-200/60 bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-6 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Stock Health</p>
                <h2 className="text-xl font-bold tracking-tight text-slate-950">Inventory</h2>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <SimpleMetric label="Active" value={summary.inventory.active} />
              <SimpleMetric label="Low" value={summary.inventory.lowStock} />
              <SimpleMetric label="OOS" value={summary.inventory.outOfStock} />
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[32px] bg-slate-950 p-8 text-white shadow-2xl">
            {/* Background Accent */}
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-brand-500/20 blur-3xl" />
            
            <p className="relative z-10 text-[10px] font-bold uppercase tracking-[0.24em] text-slate-500">Fast Tracks</p>
            <div className="relative z-10 mt-6 grid gap-3">
              <Link className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/50 px-5 py-4 text-sm font-bold transition hover:border-slate-600 hover:bg-slate-900" to="/store-admin/orders">
                Order Queue
                <span className="text-slate-500">→</span>
              </Link>
              <Link className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/50 px-5 py-4 text-sm font-bold transition hover:border-slate-600 hover:bg-slate-900" to="/store-admin/inventory">
                Stock Risk
                <span className="text-slate-500">→</span>
              </Link>
              <Link className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/50 px-5 py-4 text-sm font-bold transition hover:border-slate-600 hover:bg-slate-900" to="/store-admin/modules">
                Licenses
                <span className="text-slate-500">→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, tone }: { label: string; value: number; tone: 'amber' | 'rose' | 'sky' | 'violet' }) {
  const toneClasses = {
    amber: 'border-amber-200 bg-amber-50 text-amber-700',
    rose: 'border-rose-200 bg-rose-50 text-rose-700',
    sky: 'border-sky-200 bg-sky-50 text-sky-700',
    violet: 'border-violet-200 bg-violet-50 text-violet-700',
  };

  return (
    <div className={`rounded-2xl border p-4 ${toneClasses[tone]}`}>
      <p className="text-xs font-medium uppercase tracking-wide">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{value}</p>
    </div>
  );
}

function SimpleMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{value}</p>
    </div>
  );
}
