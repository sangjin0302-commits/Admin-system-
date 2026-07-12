import { prisma } from "@/lib/prisma/client";
import { Table, TableContainer } from "@/components/ui/table";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { listOrganizations } from "@/lib/services/organization-service";
import { logger } from "@/lib/utils/logger";

export const dynamic = "force-dynamic";

export default async function OrganizationsPage() {
  const multiOrgEnabled = await isFeatureEnabled("multi_org_mode");

  let orgs: Array<{
    id: string;
    name: string;
    description: string;
    createdAt: string;
  }> = [];

  if (multiOrgEnabled) {
    try {
      orgs = await listOrganizations();
    } catch (error) {
      logger.error("[organizations-page] failed to load organizations", error);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="ui-kicker">Platform</p>
        <h1 className="ui-page-title">멀티사무소 관리</h1>
      </div>

      {!multiOrgEnabled ? (
        <div className="rounded-lg border p-6 text-center">
          <p className="text-muted text-sm">
            멀티사무소 모드가 비활성화 상태입니다. 현재 기본(default) 사무소로 운영 중입니다.
          </p>
          <p className="text-muted text-xs mt-2">
            기능 플래그에서 <strong>multi_org_mode</strong>를 활성화하면 여러 사무소를 관리할 수 있습니다.
          </p>
        </div>
      ) : orgs.length === 0 ? (
        <p className="text-muted text-sm">
          등록된 사무소가 없습니다. API를 통해 사무소를 추가하세요.
        </p>
      ) : (
        <TableContainer>
          <Table>
            <thead>
              <tr>
                <th className="text-left px-4 py-2">ID</th>
                <th className="text-left px-4 py-2">사무소명</th>
                <th className="text-left px-4 py-2">설명</th>
                <th className="text-left px-4 py-2">생성일</th>
              </tr>
            </thead>
            <tbody>
              {orgs.map((org) => (
                <tr key={org.id}>
                  <td className="px-4 py-2 text-sm font-mono">{org.id}</td>
                  <td className="px-4 py-2 text-sm">{org.name}</td>
                  <td className="px-4 py-2 text-sm text-muted">{org.description || "—"}</td>
                  <td className="px-4 py-2 text-sm whitespace-nowrap">
                    {new Date(org.createdAt).toLocaleDateString("ko-KR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </TableContainer>
      )}
    </div>
  );
}
