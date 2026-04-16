import Link from "next/link";

import { InquiryCardList } from "@/components/admin/inquiry-card-list";
import { InquiryDashboardSummary } from "@/components/admin/inquiry-dashboard-summary";
import { InquiryFilters } from "@/components/admin/inquiry-filters";
import { InquiryTable } from "@/components/admin/inquiry-table";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/state-panel";
import { parseAdminInquiryQuery } from "@/lib/validation/admin";
import { listInquiries } from "@/lib/services/inquiry-service";
import type { InquiryDashboardSummaryProps } from "@/components/admin/inquiry-dashboard-summary";

export const dynamic = "force-dynamic";

type InquiryListItem = Awaited<ReturnType<typeof listInquiries>>[number];

function isWithinDays(date: Date | null | undefined, days: number) {
  if (!date) return false;
  const now = new Date();
  const distance = date.getTime() - now.getTime();
  return distance >= 0 && distance <= days * 24 * 60 * 60 * 1000;
}

export default async function AdminInquiryListPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const rawParams = await searchParams;
  const filters = parseAdminInquiryQuery(rawParams);
  const [allInquiries, inquiries] = await Promise.all([listInquiries(), listInquiries(filters)]);
  const activeInquiries = allInquiries.filter((item: InquiryListItem) => item.status !== "CLOSED");
  const quotePendingCount = activeInquiries.filter((item: InquiryListItem) =>
    ["QUOTE_DRAFTED", "QUOTE_PENDING", "QUOTE_SENT"].includes(item.status)
  ).length;
  const consultationNeededCount = activeInquiries.filter((item: InquiryListItem) =>
    ["CONSULTATION_REQUIRED", "WAITING_CONSULTATION", "PRE_DIAGNOSED"].includes(item.status)
  ).length;
  const nextThreeDaysCount = activeInquiries.filter((item: InquiryListItem) => isWithinDays(item.dueDate, 3)).length;
  const docsPendingCount = activeInquiries.filter(
    (item: InquiryListItem) => !item.hasPreparedDocuments && item.status !== "WON"
  ).length;
  const todayActionCount = activeInquiries.filter(
    (item: InquiryListItem) =>
      item.urgencyLevel === "CRITICAL" ||
      isWithinDays(item.dueDate, 1) ||
      ["QUOTE_DRAFTED", "QUOTE_PENDING", "CONSULTATION_REQUIRED"].includes(item.status)
  ).length;
  const actionItems: InquiryDashboardSummaryProps["actionItems"] = activeInquiries
    .filter(
      (item: InquiryListItem) =>
        item.urgencyLevel === "CRITICAL" ||
        isWithinDays(item.dueDate, 3) ||
        ["QUOTE_DRAFTED", "QUOTE_PENDING", "CONSULTATION_REQUIRED", "WAITING_CONSULTATION"].includes(item.status) ||
        !item.hasPreparedDocuments
    )
    .slice(0, 6)
    .map((item: InquiryListItem) => ({
      id: item.id,
      title: item.title,
      href: `/admin/inquiries/${item.id}`,
      tone:
        item.urgencyLevel === "CRITICAL"
          ? "urgent"
          : isWithinDays(item.dueDate, 3)
            ? "deadline"
            : ["QUOTE_DRAFTED", "QUOTE_PENDING", "QUOTE_SENT"].includes(item.status)
              ? "quote"
              : !item.hasPreparedDocuments
                ? "docs"
                : "consult",
      description:
        item.urgencyLevel === "CRITICAL"
          ? "매우 긴급으로 분류된 건입니다. 사실관계와 일정부터 바로 확인해 주세요."
          : isWithinDays(item.dueDate, 3)
            ? "3일 이내 희망 일정 또는 마감이 잡혀 있습니다."
            : ["QUOTE_DRAFTED", "QUOTE_PENDING", "QUOTE_SENT"].includes(item.status)
              ? "견적 작성, 검토 또는 발송 후속조치가 필요한 상태입니다."
              : !item.hasPreparedDocuments
                ? "기본 서류 보유 여부가 미확인 상태입니다. 자료 요청 흐름을 먼저 확인해 주세요."
                : "상담 연결이나 다음 응답이 필요한 상태입니다."
    }));

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="ui-kicker">운영 허브</p>
            <h2 className="mt-2 ui-page-title">문의 목록</h2>
            <p className="mt-2 text-sm text-text-muted">
              오늘 우선 처리할 건과 기한 임박 건을 먼저 확인하고, 아래 필터로 실제 검토 대상을 빠르게 좁혀보세요.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/monitoring"
              className="inline-flex items-center justify-center rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium text-text transition hover:border-border-strong hover:bg-surface-muted"
            >
              법령·판례 모니터링
            </Link>
          </div>
        </div>
      </Card>

      <InquiryDashboardSummary
        totalCount={allInquiries.length}
        todayActionCount={todayActionCount}
        nextThreeDaysCount={nextThreeDaysCount}
        quotePendingCount={quotePendingCount}
        docsPendingCount={docsPendingCount}
        consultationNeededCount={consultationNeededCount}
        actionItems={actionItems}
      />

      <InquiryFilters filters={filters} />

      {inquiries.length > 0 ? (
        <>
          <InquiryCardList inquiries={inquiries} />
          <InquiryTable inquiries={inquiries} />
        </>
      ) : (
        <EmptyState
          title="조건에 맞는 문의가 없습니다."
          description="검색어 또는 필터 조건을 조정해 보세요. 초기화하면 전체 문의를 다시 볼 수 있습니다."
          actionLabel="필터 초기화"
          actionHref="/admin/inquiries"
        />
      )}
    </div>
  );
}
