import { AdminSessionBanner } from "@/components/admin/admin-session-banner";
import { InquiryCardList } from "@/components/admin/inquiry-card-list";
import { InquiryDashboardSummary } from "@/components/admin/inquiry-dashboard-summary";
import { InquiryFilters } from "@/components/admin/inquiry-filters";
import { InquiryTable } from "@/components/admin/inquiry-table";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/state-panel";
import { requireAdminPageSession } from "@/lib/auth/session";
import { listInquiries } from "@/lib/services/inquiry-service";
import { parseAdminInquiryQuery } from "@/lib/validation/admin";

export const dynamic = "force-dynamic";
type InquiryListItem = Awaited<ReturnType<typeof listInquiries>>[number];

export default async function AdminInquiryListPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await requireAdminPageSession("/admin/inquiries", "STAFF");
  const rawParams = await searchParams;
  const filters = parseAdminInquiryQuery(rawParams);
  const [allInquiries, inquiries] = await Promise.all([listInquiries(), listInquiries(filters)]);

  return (
    <div className="space-y-6">
      <AdminSessionBanner session={session} />

      <Card className="p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="ui-kicker">Admin Intake Queue</p>
            <h2 className="mt-2 ui-page-title">접수 내역</h2>
            <p className="ui-section-copy mt-2">
              보호가 필요한 공개 정보는 루트에서 노출하지 않고, 로그인 후 이 화면에서만 접수 내역과 쟁점 봇 연결 상태를 관리합니다.
            </p>
          </div>
        </div>
      </Card>

      <InquiryDashboardSummary
        totalCount={allInquiries.length}
        urgentCount={
          allInquiries.filter((item: InquiryListItem) => item.urgencyLevel === "CRITICAL").length
        }
        waitingCount={
          allInquiries.filter(
            (item: InquiryListItem) =>
              item.status === "CONSULTATION_REQUIRED" || item.status === "WAITING_CONSULTATION"
          ).length
        }
        assignedCount={allInquiries.filter((item: InquiryListItem) => Boolean(item.assignee)).length}
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
          description="검색어 또는 필터 조건을 조정해 보세요. 초기화하면 전체 접수 내역을 다시 볼 수 있습니다."
          actionLabel="필터 초기화"
          actionHref="/admin/inquiries"
        />
      )}
    </div>
  );
}
