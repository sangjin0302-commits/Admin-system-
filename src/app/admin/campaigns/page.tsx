import { Card } from "@/components/ui/card";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { listCampaigns } from "@/lib/services/email-campaign-service";

import { NewCampaignForm } from "./new-campaign-form";

export const dynamic = "force-dynamic";

function statusBadge(status: string): string {
  switch (status) {
    case "sent":
      return "bg-emerald-100 text-emerald-800";
    case "scheduled":
      return "bg-amber-100 text-amber-800";
    default:
      return "bg-slate-100 text-slate-800";
  }
}

const STATUS_LABELS: Record<string, string> = {
  sent: "발송 완료",
  scheduled: "발송 예약",
  draft: "임시저장"
};

const SEGMENT_LABELS: Record<string, string> = {
  all: "전체",
  won: "수임 완료",
  active: "진행 중",
  new: "신규"
};

export default async function CampaignsPage() {
  const campaigns = listCampaigns();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        kicker="마케팅"
        title="이메일 캠페인"
        description="문의 세그먼트를 대상으로 이메일 캠페인을 생성하고 발송합니다."
      />

      <NewCampaignForm />

      <Card className="p-5">
        <h2 className="text-sm font-semibold text-text-strong">전체 캠페인</h2>
        {campaigns.length === 0 ? (
          <p className="mt-3 text-sm text-text-muted">등록된 캠페인이 없습니다.</p>
        ) : (
          <table className="mt-4 w-full text-sm">
            <thead>
              <tr className="text-left text-text-muted">
                <th className="py-2">캠페인명</th>
                <th className="py-2">제목</th>
                <th className="py-2">세그먼트</th>
                <th className="py-2">수신자 수</th>
                <th className="py-2">상태</th>
                <th className="py-2">생성일</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c) => (
                <tr key={c.id} className="border-t border-line">
                  <td className="py-2">{c.name}</td>
                  <td className="py-2">{c.subject}</td>
                  <td className="py-2">
                    {SEGMENT_LABELS[c.targetSegment] ?? c.targetSegment}
                  </td>
                  <td className="py-2">{c.recipientCount}</td>
                  <td className="py-2">
                    <span className={`rounded px-2 py-0.5 text-xs ${statusBadge(c.status)}`}>
                      {STATUS_LABELS[c.status] ?? c.status}
                    </span>
                  </td>
                  <td className="py-2 text-text-muted">
                    {c.createdAt.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
