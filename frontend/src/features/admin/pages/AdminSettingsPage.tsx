import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAdminSettingsQuery, useAdminUpdateSettingsMutation } from '@/features/admin/api';
import { PageLoader } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Settings, Store, Globe, CreditCard, Truck, Share2, Mail, Search as SearchIcon, Save, Check, UserCog } from 'lucide-react';
import { getSettingsFormValues, toSettingsMutationPayload } from '@/features/admin/lib/settingsForm';
import { isItUserRole } from '@/features/auth/roleDisplay';
import { useAppSelector } from '@/lib/utils/hooks';

const SETTING_GROUPS = [
  { key: 'general', label: 'General', icon: Settings },
  { key: 'store', label: 'Store', icon: Store },
  { key: 'website', label: 'Website Info', icon: Globe },
  { key: 'payment', label: 'Payment', icon: CreditCard },
  { key: 'shipping', label: 'Shipping', icon: Truck },
  { key: 'social', label: 'Social Media', icon: Share2 },
  { key: 'email', label: 'Email', icon: Mail },
  { key: 'seo', label: 'SEO', icon: SearchIcon },
  { key: 'integrations', label: 'Integrations', icon: Globe },
];

/* ── Field type detection based on key name ── */
function detectFieldType(key: string, value: string): 'toggle' | 'textarea' | 'color' | 'email' | 'url' | 'number' | 'password' | 'text' {
  const k = key.toLowerCase();
  if (/^(is_|enable|disable|allow|show_|hide_|use_|has_|require)/.test(k) || /_(enabled|active|visible|on|off)$/.test(k)) return 'toggle';
  if (/color|colour/i.test(k)) return 'color';
  if (/email$/i.test(k) || k === 'smtp_username') return 'email';
  if (/url|link|website|domain|endpoint/i.test(k)) return 'url';
  if (/secret|password|api_key|private_key|app_secret/i.test(k)) return 'password';
  if (/description|address|about|bio|content|body|footer_text|meta_description|terms|policy/i.test(k)) return 'textarea';
  if (/port|timeout|limit|max_|min_|quantity|rate|weight|width|height|size/i.test(k)) return 'number';
  // Detect boolean-like values
  if (value === '0' || value === '1' || value === 'true' || value === 'false') return 'toggle';
  return 'text';
}

function formatLabel(key: string): string {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

export function AdminSettingsPage() {
  const [activeGroup, setActiveGroup] = useState('general');
  const { data, isLoading } = useAdminSettingsQuery(activeGroup);
  const updateMut = useAdminUpdateSettingsMutation();
  const user = useAppSelector((state) => state.auth.user);
  const isItUser = isItUserRole(user?.role);

  const settings = getSettingsFormValues(data);
  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (settings && typeof settings === 'object') {
      setValues(settings);
    }
  }, [data]);

  const handleSave = () => {
    updateMut.mutate(toSettingsMutationPayload(activeGroup, values));
  };

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
      </div>

      {isItUser ? (
        <div className="rounded-xl border border-sky-200 bg-sky-50 p-5 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 text-sm font-semibold text-sky-700">
                <UserCog className="h-4 w-4" />
                Admin User Access
              </div>
              <p className="text-sm text-slate-700">
                Create, update, and retire admin-user accounts from the dedicated access-management page.
              </p>
            </div>
            <Link
              to="/store-admin/admins"
              className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              Manage Admin User Access
            </Link>
          </div>
        </div>
      ) : null}

      <div className="flex gap-6">
        {/* Group nav */}
        <nav className="w-52 shrink-0 space-y-1 rounded-xl border border-slate-200 bg-white p-3 shadow-sm self-start">
          {SETTING_GROUPS.map((g) => {
            const Icon = g.icon;
            return (
              <button
                key={g.key}
                onClick={() => setActiveGroup(g.key)}
                className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium transition ${activeGroup === g.key ? 'bg-brand-600 text-white shadow' : 'text-slate-600 hover:bg-slate-50'
                  }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {g.label}
              </button>
            );
          })}
        </nav>

        {/* Settings form */}
        <div className="flex-1 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-lg font-semibold capitalize text-slate-900">{activeGroup} Settings</h2>
          <div className="space-y-5">
            {Object.entries(values).map(([key, value]) => {
              const fieldType = detectFieldType(key, value);
              const label = formatLabel(key);

              if (fieldType === 'toggle') {
                const isOn = value === '1' || value === 'true';
                return (
                  <div key={key} className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-4 py-3">
                    <span className="text-sm font-medium text-slate-700">{label}</span>
                    <button
                      type="button"
                      onClick={() => setValues((prev) => ({ ...prev, [key]: isOn ? '0' : '1' }))}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors ${isOn ? 'bg-brand-600' : 'bg-slate-300'}`}
                    >
                      <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform mt-0.5 ${isOn ? 'translate-x-5 ml-0.5' : 'translate-x-0.5'}`} />
                    </button>
                  </div>
                );
              }

              if (fieldType === 'color') {
                return (
                  <div key={key}>
                    <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={value || '#000000'}
                        onChange={(e) => setValues((prev) => ({ ...prev, [key]: e.target.value }))}
                        className="h-10 w-14 cursor-pointer rounded-lg border border-slate-300"
                      />
                      <input
                        className="w-32 rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono"
                        value={value}
                        onChange={(e) => setValues((prev) => ({ ...prev, [key]: e.target.value }))}
                      />
                    </div>
                  </div>
                );
              }

              if (fieldType === 'textarea') {
                return (
                  <div key={key}>
                    <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
                    <textarea
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm min-h-[80px]"
                      value={value}
                      onChange={(e) => setValues((prev) => ({ ...prev, [key]: e.target.value }))}
                    />
                  </div>
                );
              }

              return (
                <Input
                  key={key}
                  label={label}
                  type={fieldType === 'password' ? 'password' : fieldType === 'number' ? 'number' : fieldType === 'email' ? 'email' : fieldType === 'url' ? 'url' : 'text'}
                  value={value}
                  onChange={(e) => setValues((prev) => ({ ...prev, [key]: e.target.value }))}
                />
              );
            })}
            {Object.keys(values).length === 0 && (
              <p className="text-sm text-slate-400">No settings found for this group.</p>
            )}
          </div>
          {Object.keys(values).length > 0 && (
            <div className="mt-6 flex items-center gap-3 border-t border-slate-100 pt-4">
              <Button onClick={handleSave} loading={updateMut.isPending}>
                <Save className="mr-1.5 h-4 w-4" />
                Save Settings
              </Button>
              {updateMut.isSuccess && (
                <span className="inline-flex items-center gap-1 text-sm text-green-600">
                  <Check className="h-4 w-4" /> Saved!
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
