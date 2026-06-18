import { Card } from "@/components/ui/card";
import { getOverdueInquiries, getOverdueCases } from "@/lib/services/auto-followup-service";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function FollowupPage() {
  const [overdueInquiries, overdueCases] = await Promise.all([
    getOverdueInquiries(7),
    getOverdueCases(7),
  ]);

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <p className="ui-kicker">Automation</p>
        <h2 className="mt-2 ui-page-title">후속 알림</h2>
        <p className="mt-2 text-sm text-text-muted">
          7일 이상 업데이트 없는 문의 및 사건을 표시합니다.
        </p>
      </Card>

      <Card className="p-5">
        <h3 className="text-sm font-semibold text-text-strong">
          미응답 문의 ({overdueInquiries.length}건)
        </h3>
        {overdueInquiries.length === 0 ? (
          <p className="mt-2 text-xs text-text-muted">미응답 문의가 없습니다.</p>
        ) : (
          <div className="mt-3 space-y-2">
            {overdueInquiries.map((inq) => (
              <Link key={inq.id} href={`/admin/inquiries/${inq.id}`}>
                <div className="flex items-center justify-between rounded-lg border border-line px-3 py-2 transition hover:bg-surface-muted">
                  <div>
                    <span className="text-sm font-medium text-text-strong">{inq.name}</span>
                    <span className="ml-2 text-xs text-text-muted">{inq.title}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-danger/10 px-2 py-0.5 text-xs font-semibold text-danger">
                      {inq.daysSinceUpdate}일 경과
                    </span>
                    <span className="text-xs text-text-muted">{inq.status}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-5">
        <h3 className="text-sm font-semibold text-text-strong">
          미갱신 사건 ({overdueCases.length}건)
        </h3>
        {overdueCases.length === 0 ? (
          <p className="mt-2 text-xs text-text-muted">미갱신 사건이 없습니다.</p>
        ) : (
          <div className="mt-3 space-y-2">
            {overdueCases.map((c) => (
              <Link key={c.id} href={`/admin/cases/${c.id}`}>
                <div className="flex items-center justify-between rounded-lg border border-line px-3 py-2 transition hover:bg-surface-muted">
                  <div>
                    <span className="text-sm font-medium text-text-strong">{c.title}</span>
                    <span className="ml-2 text-xs text-text-muted">{c.clientName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-warning/10 px-2 py-0.5 text-xs font-semibold text-warning">
                      {c.daysSinceUpdate}일 경과
                    </span>
                    <span className="text-xs text-text-muted">{c.status}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
