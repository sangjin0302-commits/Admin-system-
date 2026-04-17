import Link from "next/link";

import { InquiryCardList } from "@/components/admin/inquiry-card-list";
import { InquiryDashboardSummary } from "@/components/admin/inquiry-dashboard-summary";
import { InquiryFilters } from "@/components/admin/inquiry-filters";
import { InquiryTable } from "@/components/admin/inquiry-table";
import { InquiryWorkQueuesClean } from "@/components/admin/inquiry-work-queues-clean";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/state-panel";
import { readMarketingSnapshot } from "@/lib/services/marketing-sync-service";
import { parseAdminInquiryQuery } from "@/lib/validation/admin";
import { listInquiries } from "@/lib/services/inquiry-service";
import type { InquiryDashboardSummaryProps } from "@/components/admin/inquiry-dashboard-summary";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

type InquiryListItem = Awaited<ReturnType<typeof listInquiries>>[number];

async function safeListInquiries(filters?: Parameters<typeof listInquiries>[0]) {
  try {
    return await listInquiries(filters);
  } catch (error) {
    console.error("Failed to load inquiries for admin list", error);
    return [] as InquiryListItem[];
  }
}

async function safeReadMarketingSnapshot() {
  try {
    return await readMarketingSnapshot();
  } catch (error) {
    console.error("Failed to load marketing snapshot for inquiry list", error);
    return null;
  }
}

function isWithinDays(date: Date | null | undefined, days: number) {
  if (!date) return false;
  const now = new Date();
  const distance = date.getTime() - now.getTime();
  return distance >= 0 && distance <= days * 24 * 60 * 60 * 1000;
}

function getInquiryActionScore(item: InquiryListItem) {
  let score = 0;

  if (item.urgencyLevel === "CRITICAL") score += 100;
  if (item.responsePending) score += 35;
  if (isWithinDays(item.dueDate, 1)) score += 30;
  if (isWithinDays(item.nextContactAt, 1)) score += 26;
  if (["QUOTE_DRAFTED", "QUOTE_PENDING", "QUOTE_SENT"].includes(item.status)) score += 22;
  if (["CONSULTATION_REQUIRED", "WAITING_CONSULTATION"].includes(item.status)) score += 18;
  if (!item.hasPreparedDocuments && item.status !== "WON" && item.status !== "CLOSED") score += 16;
  if (item.status === "IN_REVIEW") score += 8;

  return score;
}

function buildQueueDescription(item: InquiryListItem) {
  if (item.urgencyLevel === "CRITICAL" || isWithinDays(item.dueDate, 1)) {
    return "긴급도나 일정 기준으로 가장 먼저 확인할 건입니다.";
  }

  if (!item.hasPreparedDocuments && item.status !== "WON" && item.status !== "CLOSED") {
    return "기본 서류 확보 여부부터 먼저 확인하는 흐름이 좋습니다.";
  }

  if (["QUOTE_DRAFTED", "QUOTE_PENDING", "QUOTE_SENT"].includes(item.status)) {
    return "견적 작성 또는 발송 후속조치를 이어가야 합니다.";
  }

  if (["CONSULTATION_REQUIRED", "WAITING_CONSULTATION"].includes(item.status)) {
    return "상담 연결 또는 후속 응답이 필요한 상태입니다.";
  }

  if (item.responsePending) {
    return "고객 회신 또는 다음 연락 시점 확인이 필요합니다.";
  }

  return "운영 우선순위 기준으로 상단에 배치된 건입니다.";
}

function getLawbotConnectionStatus() {
  const hasAnalyzeUrl = Boolean(process.env.LAWBOT_ANALYZE_URL?.trim());
  const hasAnalyzeToken = Boolean(process.env.LAWBOT_ANALYZE_TOKEN?.trim());

  if (hasAnalyzeUrl && hasAnalyzeToken) {
    return {
      label: "실제 분석 연결 가능",
      toneClassName: "bg-success/10 text-success",
      detail: "사건 상세에서 Lawbot 분석 호출과 저장 스냅샷 갱신을 바로 시도할 수 있습니다."
    };
  }

  if (hasAnalyzeUrl) {
    return {
      label: "주소만 연결됨",
      toneClassName: "bg-warning/10 text-warning",
      detail: "분석 주소는 잡혀 있지만 토큰이 없어 운영 환경에서는 안정적인 호출 전 점검이 더 필요합니다."
    };
  }

  return {
    label: "아직 미연결",
    toneClassName: "bg-danger/10 text-danger",
    detail: "Lawbot UI와 저장 구조는 준비돼 있지만 실제 API 호출은 아직 비활성 상태입니다."
  };
}

export default async function AdminInquiryListPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const rawParams = await searchParams;
  const filters = parseAdminInquiryQuery(rawParams);
  const [allInquiries, inquiries, marketingSnapshot] = await Promise.all([
    safeListInquiries(),
    safeListInquiries(filters),
    safeReadMarketingSnapshot()
  ]);
  const activeInquiries = allInquiries.filter((item: InquiryListItem) => item.status !== "CLOSED");
  const quotePendingCount = activeInquiries.filter((item: InquiryListItem) =>
    ["QUOTE_DRAFTED", "QUOTE_PENDING", "QUOTE_SENT"].includes(item.status)
  ).length;
  const consultationNeededCount = activeInquiries.filter((item: InquiryListItem) =>
    ["CONSULTATION_REQUIRED", "WAITING_CONSULTATION", "PRE_DIAGNOSED"].includes(item.status)
  ).length;
  const nextThreeDaysCount = activeInquiries.filter((item: InquiryListItem) => isWithinDays(item.dueDate, 3)).length;
  const nextContactCount = activeInquiries.filter((item: InquiryListItem) => isWithinDays(item.nextContactAt, 3)).length;
  const responsePendingCount = activeInquiries.filter((item: InquiryListItem) => item.responsePending).length;
  const docsPendingCount = activeInquiries.filter(
    (item: InquiryListItem) => !item.hasPreparedDocuments && item.status !== "WON"
  ).length;
  const lawbotStatus = getLawbotConnectionStatus();
  const marketingStatus = marketingSnapshot
    ? {
        label: "스냅샷 수신 중",
        toneClassName: "bg-success/10 text-success",
        detail: `최근 마케팅 요약이 ${formatDateTime(marketingSnapshot.received_at ?? marketingSnapshot.generated_at ?? null)} 기준으로 저장돼 있습니다. 아직 실시간 엔진 연동은 아닙니다.`
      }
    : {
        label: "아직 스냅샷 없음",
        toneClassName: "bg-warning/10 text-warning",
        detail: "marketing-analyze는 현재 저장된 스냅샷이 없어서 상단 허브와 추천 흐름에서 실시간 대신 기본 신호만 참고합니다."
      };
  const prioritizedInquiries = [...inquiries].sort((left, right) => {
    const scoreDiff = getInquiryActionScore(right) - getInquiryActionScore(left);
    if (scoreDiff !== 0) return scoreDiff;
    return right.updatedAt.getTime() - left.updatedAt.getTime();
  });
  const todayActionCount = activeInquiries.filter(
    (item: InquiryListItem) =>
      item.urgencyLevel === "CRITICAL" ||
      isWithinDays(item.dueDate, 1) ||
      isWithinDays(item.nextContactAt, 1) ||
      item.responsePending ||
      ["QUOTE_DRAFTED", "QUOTE_PENDING", "CONSULTATION_REQUIRED"].includes(item.status)
  ).length;
  const actionItems: InquiryDashboardSummaryProps["actionItems"] = activeInquiries
    .filter(
      (item: InquiryListItem) =>
        item.urgencyLevel === "CRITICAL" ||
        isWithinDays(item.dueDate, 3) ||
        isWithinDays(item.nextContactAt, 3) ||
        item.responsePending ||
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
            : item.responsePending
              ? "고객 답변 또는 자료 회신을 기다리는 상태입니다. 다음 연락 여부를 확인해 주세요."
              : isWithinDays(item.nextContactAt, 3)
                ? "다음 연락 예정일이 가까워졌습니다. 후속 연락을 놓치지 않게 확인해 주세요."
            : ["QUOTE_DRAFTED", "QUOTE_PENDING", "QUOTE_SENT"].includes(item.status)
              ? "견적 작성, 검토 또는 발송 후속조치가 필요한 상태입니다."
              : !item.hasPreparedDocuments
                ? "기본 서류 보유 여부가 미확인 상태입니다. 자료 요청 흐름을 먼저 확인해 주세요."
                : "상담 연결이나 다음 응답이 필요한 상태입니다."
    }));
  const queueGroups = [
    {
      key: "urgent",
      title: "긴급 확인",
      hint: "당일 또는 매우 긴급 기준으로 먼저 봐야 하는 건",
      tone: "urgent" as const,
      items: prioritizedInquiries
        .filter((item) => item.urgencyLevel === "CRITICAL" || isWithinDays(item.dueDate, 1))
        .slice(0, 3)
    },
    {
      key: "docs",
      title: "자료 요청",
      hint: "서류 보유 여부나 기본 자료 확인이 먼저 필요한 건",
      tone: "docs" as const,
      items: prioritizedInquiries
        .filter((item) => !item.hasPreparedDocuments && item.status !== "WON" && item.status !== "CLOSED")
        .slice(0, 3)
    },
    {
      key: "consult",
      title: "상담 연결",
      hint: "상담 진행이나 다음 응답이 필요한 건",
      tone: "consult" as const,
      items: prioritizedInquiries
        .filter((item) => ["CONSULTATION_REQUIRED", "WAITING_CONSULTATION", "PRE_DIAGNOSED"].includes(item.status))
        .slice(0, 3)
    },
    {
      key: "quote",
      title: "견적 후속",
      hint: "견적 작성, 검토, 발송 흐름을 이어가야 하는 건",
      tone: "quote" as const,
      items: prioritizedInquiries
        .filter((item) => ["QUOTE_DRAFTED", "QUOTE_PENDING", "QUOTE_SENT"].includes(item.status))
        .slice(0, 3)
    }
  ].map((group) => ({
    ...group,
    count: group.items.length,
    items: group.items.map((item) => ({
      id: item.id,
      title: item.title,
      href: `/admin/inquiries/${item.id}`,
      description: buildQueueDescription(item)
    }))
  }));
  const focusSummary = [
    todayActionCount > 0 ? `오늘 먼저 볼 건 ${todayActionCount}건` : "오늘 급한 건은 적은 편",
    docsPendingCount > 0 ? `자료 확인 필요 ${docsPendingCount}건` : "자료 확인 병목은 적은 편",
    quotePendingCount > 0 ? `견적 후속 ${quotePendingCount}건` : "견적 후속은 비교적 안정적"
  ];

  return (
    <div className="space-y-6">
      <Card className="ui-analysis-hero p-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="ui-kicker">Admin Overview</p>
              <h2 className="mt-2 ui-page-title">문의 운영 센터</h2>
              <p className="mt-2 text-sm text-text-muted">
                처음 들어오면 이 화면에서 오늘 우선 처리할 건, 연결 상태, 자료 병목을 한 번에 확인할 수 있도록 정리했습니다.
              </p>
              <p className="mt-3 text-sm text-text">
                현재 기준으로 <span className="font-semibold text-text-strong">Lawbot는 {lawbotStatus.label}</span>,{" "}
                <span className="font-semibold text-text-strong">marketing은 {marketingStatus.label}</span> 상태입니다.
                두 엔진이 서로 직접 연결된 구조는 아직 아니고, system이 각각의 분석 결과와 스냅샷을 받아 운영 흐름에 반영합니다.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/admin"
                className="inline-flex items-center justify-center rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium text-text transition hover:border-border-strong hover:bg-surface-muted"
              >
                대시보드
              </Link>
              <Link
                href="/admin/monitoring"
                className="inline-flex items-center justify-center rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium text-text transition hover:border-border-strong hover:bg-surface-muted"
              >
                법령·판례 모니터링
              </Link>
              <Link
                href="/intake"
                className="inline-flex items-center justify-center rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium text-text transition hover:border-border-strong hover:bg-surface-muted"
              >
                공개 접수 화면
              </Link>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {focusSummary.map((item) => (
              <span key={item} className="ui-analysis-chip">
                {item}
              </span>
            ))}
          </div>

          <div className="grid gap-3 xl:grid-cols-3">
            <Card className="ui-analysis-panel p-4">
              <p className="ui-kicker">System Core</p>
              <div className="mt-3 flex items-center justify-between gap-3">
                <h3 className="text-base font-semibold text-text-strong">운영 기준 요약</h3>
                <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">
                  활성 {activeInquiries.length}건
                </span>
              </div>
              <p className="mt-2 text-sm text-text-muted">
                문의, 상태 전환, 내부 메모, 견적, 사건 스냅샷은 system DB를 기준으로 관리합니다.
              </p>
            </Card>

            <Card className="ui-analysis-panel p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="ui-kicker">Lawbot Lane</p>
                  <h3 className="mt-2 text-base font-semibold text-text-strong">법률 분석 엔진</h3>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${lawbotStatus.toneClassName}`}>
                  {lawbotStatus.label}
                </span>
              </div>
              <p className="mt-3 text-sm text-text-muted">{lawbotStatus.detail}</p>
            </Card>

            <Card className="ui-analysis-panel p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="ui-kicker">Market Analyze</p>
                  <h3 className="mt-2 text-base font-semibold text-text-strong">외부 수요 신호</h3>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${marketingStatus.toneClassName}`}>
                  {marketingStatus.label}
                </span>
              </div>
              <p className="mt-3 text-sm text-text-muted">{marketingStatus.detail}</p>
            </Card>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="ui-kicker">Inquiry List</p>
            <h2 className="mt-2 ui-page-title">문의 목록</h2>
            <p className="mt-2 text-sm text-text-muted">
              오늘 우선 처리할 건과 기한 임박 건을 먼저 확인하고, 아래 필터로 실제 검토 대상을 빠르게 좁혀보세요.
            </p>
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
        responsePendingCount={responsePendingCount}
        nextContactCount={nextContactCount}
        actionItems={actionItems}
      />

      <InquiryWorkQueuesClean groups={queueGroups} />

      <InquiryFilters filters={filters} />

      {prioritizedInquiries.length > 0 ? (
        <>
          <InquiryCardList inquiries={prioritizedInquiries} />
          <InquiryTable inquiries={prioritizedInquiries} />
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
