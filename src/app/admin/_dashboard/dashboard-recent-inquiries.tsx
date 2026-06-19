import Link from "next/link";

import { dashboardToneClassName } from "@/components/admin/dashboard-shared";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/state-panel";
import { getStatusTone } from "@/lib/services/admin-dashboard-helpers";
import { listInquiries } from "@/lib/services/inquiry-service";
import { formatDateTime } from "@/lib/utils";
import {
  getInquiryStatusLabel,
  getInquiryTypeLabel,
  getUrgencyLabel
} from "@/types/inquiry";

type InquiryListItem = Awaited<ReturnType<typeof listInquiries>>[number];

export function DashboardRecentInquiries({ recentIntakes }: { recentIntakes: InquiryListItem[] }) {
  return (
    <Card className="p-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="ui-kicker">최근 주요 문의</p>
          <h3 className="mt-2 ui-section-title">바로 열어볼 항목</h3>
        </div>
        <p className="text-sm text-text-muted">상태와 긴급도를 같이 보면서 바로 상세 화면으로 이동할 수 있습니다.</p>
      </div>

      {recentIntakes.length > 0 ? (
        <div className="mt-5 space-y-3">
          {recentIntakes.map((item) => (
            <Link
              key={item.id}
              href={`/admin/inquiries/${item.id}`}
              className="block rounded-2xl border border-line bg-surface px-4 py-4 transition hover:border-line-strong hover:bg-surface-muted"
            >
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="urgency" urgency={item.urgencyLevel}>
                      {getUrgencyLabel(item.urgencyLevel)}
                    </Badge>
                    <Badge tone="status" status={item.status}>
                      {getInquiryStatusLabel(item.status)}
                    </Badge>
                  </div>
                  <p className="mt-3 truncate text-base font-semibold text-text-strong">{item.title}</p>
                  <p className="mt-1 truncate text-sm text-text-muted">
                    {item.contactName}
                    {item.organizationName ? ` / ${item.organizationName}` : ""} /{" "}
                    {getInquiryTypeLabel(item.inquiryType)}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-sm text-text-muted">
                  <span className={dashboardToneClassName(getStatusTone(item.status))}>
                    {item.responsePending ? "응답 대기" : "운영 진행 중"}
                  </span>
                  <span>{formatDateTime(item.updatedAt)}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          title="표시할 최근 문의가 없습니다."
          description="공개 접수나 내부 등록이 생기면 최근 문의 카드가 여기에 정리됩니다."
          actionLabel="공개 접수 열기"
          actionHref="/intake"
          className="mt-5"
        />
      )}
    </Card>
  );
}
