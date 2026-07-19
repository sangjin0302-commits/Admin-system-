import { Card } from "@/components/ui/card";
import { listTenants } from "@/lib/services/tenant-service";
import { AddTenantForm } from "./add-tenant-form";

export const dynamic = "force-dynamic";

export default async function TenantsPage() {
  const tenants = await listTenants();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6">
        <p className="ui-kicker">멀티 테넌트</p>
        <h1 className="ui-page-title">사무소 관리</h1>
        <p className="mt-1 text-sm text-text-muted">
          ETHOS 관리자 플랫폼을 사용하는 모든 사무소를 관리합니다.
        </p>
      </div>

      <Card className="mb-6">
        <AddTenantForm />
      </Card>

      <Card>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="px-3 py-2">사무소명</th>
              <th className="px-3 py-2">서브도메인</th>
              <th className="px-3 py-2">담당자</th>
              <th className="px-3 py-2">요금제</th>
              <th className="px-3 py-2">상태</th>
              <th className="px-3 py-2">등록일</th>
            </tr>
          </thead>
          <tbody>
            {tenants.map((t) => (
              <tr key={t.id} className="border-b">
                <td className="px-3 py-2 font-medium">{t.name}</td>
                <td className="px-3 py-2">{t.subdomain}</td>
                <td className="px-3 py-2">{t.ownerEmail}</td>
                <td className="px-3 py-2">{t.plan}</td>
                <td className="px-3 py-2">{t.active ? "사용" : "미사용"}</td>
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
