import { Card } from "@/components/ui/card";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { prisma } from "@/lib/prisma/client";
import { CreateUserButton } from "./create-user-button";
import { UserActionsMenu } from "./user-actions-menu";

export const dynamic = "force-dynamic";

const ROLE_LABEL: Record<string, string> = {
  SUPER: "소장",
  MANAGER: "관리자",
  STAFF: "직원",
  EXTERNAL: "외부협력",
  AUDITOR: "감사",
};

const ROLE_BADGE: Record<string, string> = {
  SUPER: "bg-rose-100 text-rose-800",
  MANAGER: "bg-indigo-100 text-indigo-800",
  STAFF: "bg-slate-100 text-slate-800",
  EXTERNAL: "bg-amber-100 text-amber-800",
  AUDITOR: "bg-violet-100 text-violet-800",
};

async function loadUsers() {
  try {
    return await prisma.adminUser.findMany({
      orderBy: [{ active: "desc" }, { createdAt: "asc" }],
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        active: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });
  } catch {
    return [];
  }
}

export default async function UsersPage() {
  const users = await loadUsers();
  const counts: Record<string, number> = {};
  for (const u of users) if (u.active) counts[u.role] = (counts[u.role] ?? 0) + 1;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        kicker="RBAC"
        title="관리자 사용자"
        description="역할별 권한 + 감사로그. SUPER만 생성/수정 가능."
        action={<CreateUserButton />}
      />

      {/* 역할별 카운트 — 모바일 3열 / 데스크탑 5열 */}
      <div className="grid grid-cols-3 gap-2 md:grid-cols-5 md:gap-4">
        {(["SUPER", "MANAGER", "STAFF", "EXTERNAL", "AUDITOR"] as const).map(
          (r) => (
            <Card key={r} className="p-3 md:p-4">
              <p className="text-xs text-text-muted">{ROLE_LABEL[r]}</p>
              <p className="mt-1 text-lg md:text-2xl font-semibold tabular-nums">
                {counts[r] ?? 0}
              </p>
            </Card>
          )
        )}
      </div>

      {users.length === 0 ? (
        <Card className="p-6 text-center text-sm text-text-muted">
          등록된 사용자가 없습니다. 우측 상단 “사용자 추가” 버튼을 사용하세요.
        </Card>
      ) : (
        <>
          {/* 모바일 카드 */}
          <div className="space-y-2 md:hidden">
            {users.map((u) => (
              <Card key={u.id} className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-text-strong">
                      {u.name}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-text-muted">
                      {u.email}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${ROLE_BADGE[u.role] ?? ""}`}
                  >
                    {ROLE_LABEL[u.role] ?? u.role}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-text-muted">
                  <span>
                    {u.active ? "활성" : "비활성"} ·{" "}
                    {u.lastLoginAt
                      ? new Date(u.lastLoginAt).toLocaleDateString("ko-KR")
                      : "—"}
                  </span>
                  <UserActionsMenu
                    userId={u.id}
                    currentRole={u.role}
                    active={u.active}
                  />
                </div>
              </Card>
            ))}
          </div>

          {/* 데스크탑 테이블 */}
          <Card className="hidden overflow-hidden p-0 md:block">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-surface-muted text-left text-xs font-semibold text-text-muted">
                  <tr>
                    <th className="px-5 py-3">이름</th>
                    <th className="px-5 py-3">이메일</th>
                    <th className="px-5 py-3">역할</th>
                    <th className="px-5 py-3">상태</th>
                    <th className="px-5 py-3">마지막 로그인</th>
                    <th className="px-5 py-3">생성일</th>
                    <th className="px-5 py-3">액션</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td className="px-5 py-3 font-medium">{u.name}</td>
                      <td className="px-5 py-3 font-mono text-xs">{u.email}</td>
                      <td className="px-5 py-3">
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-xs ${ROLE_BADGE[u.role] ?? ""}`}
                        >
                          {ROLE_LABEL[u.role] ?? u.role}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-xs">
                        {u.active ? (
                          <span className="text-emerald-700">활성</span>
                        ) : (
                          <span className="text-rose-700">비활성</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-xs text-text-muted">
                        {u.lastLoginAt
                          ? new Date(u.lastLoginAt).toLocaleString("ko-KR")
                          : "—"}
                      </td>
                      <td className="px-5 py-3 text-xs text-text-muted">
                        {new Date(u.createdAt).toLocaleDateString("ko-KR")}
                      </td>
                      <td className="px-5 py-3">
                        <UserActionsMenu
                          userId={u.id}
                          currentRole={u.role}
                          active={u.active}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
