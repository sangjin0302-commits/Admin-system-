import Link from "next/link";

import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/state-panel";
import { listCaseMatters } from "@/lib/services/case-matter-service";
import { formatDate, formatDateTime } from "@/lib/utils";
import { getCaseMatterStatusLabel } from "@/types/case-matter";

export const dynamic = "force-dynamic";

type CaseMatterListItem = Awaited<ReturnType<typeof listCaseMatters>>[number];

async function safeListCaseMatters() {
  try {
    return await listCaseMatters();
  } catch (error) {
    console.error("Failed to load case matters", error);
    return [] as CaseMatterListItem[];
  }
}

function countRequiredDocumentBacklog(caseMatter: CaseMatterListItem) {
  return caseMatter.requiredDocuments.filter((item) =>
    ["NEEDED", "REQUESTED", "NEEDS_FIX"].includes(item.status)
  ).length;
}

export default async function AdminCasesPage() {
  const cases = await safeListCaseMatters();

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="ui-kicker">사건 관리</p>
            <h2 className="mt-2 ui-page-title">사건 운영</h2>
            <p className="mt-2 text-sm text-text-muted">
              이 보드는 Phase 1에서 사건 중심 운영을 위한 최소 운영 경로입니다.
            </p>
          </div>
          <div className="rounded-full bg-surface-muted px-4 py-2 text-sm font-semibold text-text-strong">
            활성 사건: {cases.length}
          </div>
        </div>
      </Card>

      {cases.length === 0 ? (
        <EmptyState
          title="등록된 사건이 아직 없습니다."
          description="먼저 문의를 사건으로 전환하세요. 전환된 사건이 이 운영 보드에 표시됩니다."
          actionLabel="문의 화면으로 이동"
          actionHref="/admin/inquiries"
        />
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-line text-sm">
              <thead className="bg-surface-muted text-left text-xs uppercase tracking-wide text-text-muted">
                <tr>
                  <th className="px-4 py-3 font-semibold">사건</th>
                  <th className="px-4 py-3 font-semibold">상태</th>
                  <th className="px-4 py-3 font-semibold">다음 액션</th>
                  <th className="px-4 py-3 font-semibold">마감일</th>
                  <th className="px-4 py-3 font-semibold">미처리 문서</th>
                  <th className="px-4 py-3 font-semibold">업데이트</th>
                  <th className="px-4 py-3 font-semibold" />
                </tr>
              </thead>
              <tbody className="divide-y divide-line bg-surface">
                {cases.map((item) => (
                  <tr key={item.id} className="align-top">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-text-strong">{item.title}</p>
                      <p className="mt-1 text-xs text-text-muted">
                        {item.caseNo ?? "사건번호 없음"} | {item.matterType}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-text">{getCaseMatterStatusLabel(item.status)}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-text-strong">{item.nextAction.message}</p>
                      <p className="mt-1 text-xs text-text-muted">
                        {item.nextAction.priority} | {item.nextAction.actionType}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-text">{formatDate(item.dueDate)}</td>
                    <td className="px-4 py-3 text-text">{countRequiredDocumentBacklog(item)}</td>
                    <td className="px-4 py-3 text-text-muted">{formatDateTime(item.updatedAt)}</td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/cases/${item.id}`}
                        className="inline-flex h-9 items-center rounded-lg border border-line bg-surface px-3 text-sm font-medium text-text-strong transition hover:border-line-strong hover:bg-surface-muted"
                      >
                        열기
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
