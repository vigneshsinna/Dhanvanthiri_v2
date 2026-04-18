import { useState } from 'react';
import { isItUserRole } from '@/features/auth/roleDisplay';
import {
  useAdminAdminsQuery,
  useAdminCreateAdminMutation,
  useAdminDeleteAdminMutation,
} from '@/features/admin/api';
import { AdminPageHeader } from '@/features/admin/components/AdminPageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PageLoader } from '@/components/ui/Spinner';
import { useAppSelector } from '@/lib/utils/hooks';

export function AdminUsersPage() {
  const user = useAppSelector((state) => state.auth.user);
  const isItUser = isItUserRole(user?.role);
  const { data, isLoading } = useAdminAdminsQuery(undefined, isItUser);
  const createAdmin = useAdminCreateAdminMutation();
  const deleteAdmin = useAdminDeleteAdminMutation();
  const rows = data?.data?.data ?? data?.data ?? [];
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: 'Pass1!',
    role: 'admin',
  });

  if (!isItUser) {
    return (
      <section className="space-y-6">
        <AdminPageHeader eyebrow="System" title="Admin Users" description="This section is limited to IT User accounts." />
        <div className="rounded-[28px] border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
          Admin user management is restricted to IT User access.
        </div>
      </section>
    );
  }

  if (isLoading) return <PageLoader />;

  async function handleCreateAdmin() {
    await createAdmin.mutateAsync(form);
    setForm({ name: '', email: '', password: 'Pass1!', role: 'admin' });
  }

  return (
    <section className="space-y-6">
      <AdminPageHeader
        eyebrow="System"
        title="Admin Users"
        description="Create and retire admin accounts used by business operators."
      />

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-950">Create Admin User</h2>
          <div className="space-y-3">
            <Input label="Name" value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} />
            <Input label="Email" value={form.email} onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))} />
            <Input label="Password" value={form.password} onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))} />
            <Button onClick={handleCreateAdmin} loading={createAdmin.isPending}>Create Admin</Button>
          </div>
        </div>

        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Name</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Email</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Role</th>
                <th className="px-4 py-3 text-right font-medium text-slate-600">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map((row: any) => (
                <tr key={row.id}>
                  <td className="px-4 py-3 font-medium text-slate-950">{row.name}</td>
                  <td className="px-4 py-3 text-slate-600">{row.email}</td>
                  <td className="px-4 py-3 text-slate-600">{row.role ?? 'admin'}</td>
                  <td className="px-4 py-3 text-right">
                    <Button size="sm" variant="danger" onClick={() => deleteAdmin.mutate(row.id)} loading={deleteAdmin.isPending}>
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
