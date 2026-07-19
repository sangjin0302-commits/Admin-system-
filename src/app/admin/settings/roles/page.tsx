import { Card } from "@/components/ui/card";
import { Table, TableContainer } from "@/components/ui/table";
import {
  AdminRole,
  ADMIN_ACTIONS,
  PERMISSION_MATRIX,
  getAdminRole,
} from "@/lib/services/admin-rbac";

export default function RolesPage() {
  // Read configured roles from env
  let roleMap: Record<string, string> = {};
  try {
    const raw = process.env.ADMIN_ROLES;
    if (raw) roleMap = JSON.parse(raw);
  } catch {
    // ignore parse errors
  }

  const roles = Object.values(AdminRole);

  return (
    <div className="space-y-8">
      <div>
        <p className="ui-kicker">보안</p>
        <h1 className="ui-page-title">관리자 권한 설정</h1>
      </div>

      {/* Current admin role assignments */}
      <Card>
        <h2 className="text-lg font-semibold mb-4">등록된 관리자 권한</h2>
        {Object.keys(roleMap).length === 0 ? (
          <p className="text-muted text-sm">
            설정된 권한이 없습니다. <code>ADMIN_ROLES</code> 환경변수를 JSON
            형식으로 설정하세요 (예:{" "}
            <code>{`{"admin@example.com":"SUPER_ADMIN"}`}</code>). 인증된 모든
            사용자는 기본적으로 ADMIN 권한을 갖습니다.
          </p>
        ) : (
          <TableContainer>
            <Table>
              <thead>
                <tr>
                  <th className="text-left px-4 py-2">이메일</th>
                  <th className="text-left px-4 py-2">권한</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(roleMap).map(([email, role]) => (
                  <tr key={email}>
                    <td className="px-4 py-2 font-mono text-sm">{email}</td>
                    <td className="px-4 py-2">{role}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </TableContainer>
        )}
      </Card>

      {/* Permission matrix */}
      <Card>
        <h2 className="text-lg font-semibold mb-4">권한 매트릭스</h2>
        <TableContainer>
          <Table>
            <thead>
              <tr>
                <th className="text-left px-4 py-2">권한</th>
                {ADMIN_ACTIONS.map((action) => (
                  <th key={action} className="text-center px-4 py-2 capitalize">
                    {action}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {roles.map((role) => (
                <tr key={role}>
                  <td className="px-4 py-2 font-mono text-sm">{role}</td>
                  {ADMIN_ACTIONS.map((action) => (
                    <td key={action} className="text-center px-4 py-2">
                      {PERMISSION_MATRIX[role][action] ? "✓" : "—"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </Table>
        </TableContainer>
      </Card>
    </div>
  );
}
