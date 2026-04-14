import { AdminSessionBanner } from "@/components/admin/admin-session-banner";
import { InquiryCardList } from "@/components/admin/inquiry-card-list";
import { InquiryDashboardSummary } from "@/components/admin/inquiry-dashboard-summary";
import { InquiryFilters } from "@/components/admin/inquiry-filters";
import { InquiryTable } from "@/components/admin/inquiry-table";
import { WorkQueuePanel } from "@/components/admin/work-queue-panel";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/state-panel";
import { requireAdminPageSession } from "@/lib/auth/session";
import { listInquiries } from "@/lib/services/inquiry-service";
import { parseAdminInquiryQuery } from "@/lib/validation/admin";
import { getWorkQueueSnapshot } from "@/lib/work-queue/service";

export const dynamic = "force-dynamic";

export default async function AdminInquiryListPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await requireAdminPageSession("/admin/inquiries", "STAFF");
  const rawParams = await searchParams;
  const filters = parseAdminInquiryQuery(rawParams);
  const [allInquiries, inquiries, workQueue] = await Promise.all([
    listInquiries(),
    listInquiries(filters),
    getWorkQueueSnapshot()
  ]);

  return (
    <div className="space-y-6">
      <AdminSessionBanner session={session} />

      <Card className="p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="ui-kicker">Admin Dashboard</p>
            <h2 className="mt-2 ui-page-title">문의 목록</h2>
            <p className="mt-2 text-sm text-text-muted">
              검색, 필터, 정렬을 이용해 실제 검토 대상 건을 빠르게 찾을 수 있습니다.
            </p>
          </div>
        </div>
      </Card>

      <InquiryDashboardSummary
        totalCount={allInquiries.length}
        urgentCount={allInquiries.filter((item) => item.urgencyLevel === "CRITICAL").length}
        waitingCount={
          allInquiries.filter(
            (item) =>
              item.status === "CONSULTATION_REQUIRED" || item.status === "WAITING_CONSULTATION"
          ).length
        }
        assignedCount={allInquiries.filter((item) => Boolean(item.assignee)).length}
      />

      <WorkQueuePanel snapshot={workQueue} />

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
