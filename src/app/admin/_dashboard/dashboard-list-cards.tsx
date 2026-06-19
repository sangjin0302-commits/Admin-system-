import { DashboardListCard } from "@/components/admin/dashboard-shared";
import type { buildAdminDashboardPageData } from "@/lib/services/admin-dashboard-page-data";
import type { listInquiries } from "@/lib/services/inquiry-service";
import { formatDateTime } from "@/lib/utils";
import {
  getInquiryStatusLabel,
  getInquiryTypeLabel,
  getLanguageCodeLabel,
  getUrgencyLabel
} from "@/types/inquiry";

type InquiryListItem = Awaited<ReturnType<typeof listInquiries>>[number];
type PageData = ReturnType<typeof buildAdminDashboardPageData<InquiryListItem>>;

type Props = {
  dueSoonItems: PageData["dueSoonItems"];
  nextContactItems: PageData["nextContactItems"];
  recentIntakes: PageData["recentIntakes"];
};

export function DashboardListCards({ dueSoonItems, nextContactItems, recentIntakes }: Props) {
  return (
    <div className="grid gap-6 xl:grid-cols-3">
      <DashboardListCard
        kicker="기한 임박"
        title="기한 임박 문의"
        emptyTitle="임박 일정이 없습니다."
        emptyDescription="3일 내 희망 일정 또는 기한이 생기면 여기에 표시됩니다."
        items={dueSoonItems.map((item) => ({
          id: item.id,
          href: `/admin/inquiries/${item.id}`,
          title: item.title,
          meta: `${getUrgencyLabel(item.urgencyLevel)} / ${formatDateTime(item.dueDate)}`,
          description: `${item.contactName}${item.organizationName ? ` / ${item.organizationName}` : ""}`
        }))}
      />

      <DashboardListCard
        kicker="후속 연락"
        title="연락·회신 확인"
        emptyTitle="후속 연락 대기 건이 없습니다."
        emptyDescription="응답 대기나 다음 연락 일정이 생기면 이 영역에 표시됩니다."
        items={nextContactItems.map((item) => ({
          id: item.id,
          href: `/admin/inquiries/${item.id}`,
          title: item.title,
          meta: item.responsePending ? "고객 응답 대기" : `다음 연락 ${formatDateTime(item.nextContactAt)}`,
          description: `${getInquiryStatusLabel(item.status)} / ${item.contactName}`
        }))}
      />

      <DashboardListCard
        kicker="최근 접수"
        title="최근 접수"
        emptyTitle="아직 접수가 없습니다."
        emptyDescription="새 문의가 접수되면 가장 최근 건이 여기에 표시됩니다."
        items={recentIntakes.map((item) => ({
          id: item.id,
          href: `/admin/inquiries/${item.id}`,
          title: item.title,
          meta: `${getInquiryTypeLabel(item.inquiryType)} / ${formatDateTime(item.createdAt)}`,
          description: `${item.contactName} / ${getLanguageCodeLabel(item.preferredLanguage)}`
        }))}
      />
    </div>
  );
}
