import Link from "next/link";

import { Card } from "@/components/ui/card";
import type { buildAdminDashboardPageData } from "@/lib/services/admin-dashboard-page-data";
import type { listInquiries } from "@/lib/services/inquiry-service";

type InquiryListItem = Awaited<ReturnType<typeof listInquiries>>[number];
type PageData = ReturnType<typeof buildAdminDashboardPageData<InquiryListItem>>;

type Props = {
  pipeline: PageData["pipeline"];
  urgentCount: number;
  docsPendingCount: number;
  consultationCount: number;
  responsePendingCount: number;
};

export function DashboardPipeline({
  pipeline,
  urgentCount,
  docsPendingCount,
  consultationCount,
  responsePendingCount
}: Props) {
  return (
    <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
      <Card className="p-6">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="ui-kicker">파이프라인</p>
            <h3 className="mt-2 ui-section-title">상태별 운영 흐름</h3>
          </div>
          <Link href="/admin/inquiries" className="text-sm font-medium text-primary">
            전체 목록 보기
          </Link>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {pipeline.map((item) => (
            <Card key={item.key} muted className="p-4">
              <p className="ui-kicker">{item.label}</p>
              <p className="mt-2 text-3xl font-semibold text-text-strong">{item.count}</p>
              <p className="mt-2 text-xs text-text-muted">{item.description}</p>
            </Card>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <p className="ui-kicker">오늘의 포인트</p>
        <h3 className="mt-2 ui-section-title">우선 확인 요약</h3>
        <div className="mt-4 space-y-3 text-sm text-text-muted">
          <p>• 긴급·당일 기준으로 먼저 볼 문의는 {urgentCount}건입니다.</p>
          <p>• 자료 확보가 먼저 필요한 문의는 {docsPendingCount}건입니다.</p>
          <p>• 상담 연결 또는 대기 흐름은 {consultationCount}건입니다.</p>
          <p>• 고객 회신 또는 다음 연락 대기는 {responsePendingCount}건입니다.</p>
        </div>
      </Card>
    </div>
  );
}
