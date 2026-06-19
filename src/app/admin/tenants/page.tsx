import { Card } from "@/components/ui/card";
import { listTenants } from "@/lib/services/tenant-service";
import { AddTenantForm } from "./add-tenant-form";

export const dynamic = "force-dynamic";

export default function TenantsPage() {
  const tenants = listTenants();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6">
        <p className="ui-kicker">Multi-Tenant</p>
        <h1 className="ui-page-title">Admin Offices</h1>
        <p className="mt-1 text-sm text-text-muted">
          Manage all tenant offices using the ETHOS admin platform.
        </p>
      </div>

      <Card className="mb-6">
        <AddTenantForm />
      </Card>

      <Card>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Subdomain</th>
              <th className="px-3 py-2">Owner</th>
              <th className="px-3 py-2">Plan</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Created</th>
            </tr>
          </thead>
          <tbody>
            {tenants.map((t) => (
              <tr key={t.id} className="border-b">
                <td className="px-3 py-2 font-medium">{t.name}</td>
                <td className="px-3 py-2">{t.subdomain}</td>
                <td className="px-3 py-2">{t.ownerEmail}</td>
                <td className="px-3 py-2">{t.plan}</td>
                <td className="px-3 py-2">{t.active ? "Active" : "Inactive"}</td>
                <td className="px-3 py-2">
                  {t.createdAt.toISOString().slice(0, 10)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
