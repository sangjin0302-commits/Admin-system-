import Link from "next/link";

import { InquiryCardList } from "@/components/admin/inquiry-card-list";
import { InquiryFlowAlerts } from "@/components/admin/inquiry-flow-alerts";
import { InquiryKanbanBoard } from "@/components/admin/inquiry-kanban-board";
import { InquiryDashboardSummary } from "@/components/admin/inquiry-dashboard-summary";
import { InquiryFilters } from "@/components/admin/inquiry-filters";
import { InquiryQuickPresets } from "@/components/admin/inquiry-quick-presets";
import { InquiryTable } from "@/components/admin/inquiry-table";
import { InquiryTanstackWrapper } from "@/components/admin/inquiry-tanstack-wrapper";
import { InquiryWorkQueuesSafeV2 } from "@/components/admin/inquiry-work-queues";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/state-panel";
import {
  buildInquiryListHref,
  getPriorityScoreTone,
  parseInquiryViewMode
} from "@/lib/services/admin-inquiry-list-helpers";
import { buildAdminInquiryPageData } from "@/lib/services/admin-inquiry-page-data";
import { parseAdminInquiryQuery } from "@/lib/validation/admin-safe-v2";
import { listInquiries } from "@/lib/services/inquiry-service";
import { getScoresForInquiries } from "@/lib/services/priority-scoring-service";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { logger } from "@/lib/utils/logger";

export const dynamic = "force-dynamic";

type InquiryListItem = Awaited<ReturnType<typeof listInquiries>>[number];

async function safeListInquiries(filters?: Parameters<typeof listInquiries>[0]) {
  try {
    return await listInquiries(filters);
  } catch (error) {
    logger.error("Failed to load inquiries for admin list", error);
    return [] as InquiryListItem[];
  }
}

export default async function AdminInquiryListPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const rawParams = await searchParams;
  const viewMode = parseInquiryViewMode(typeof rawParams.view === "string" ? rawParams.view : undefined);
  const listViewHref = buildInquiryListHref(rawParams, "list");
  const boardViewHref = buildInquiryListHref(rawParams, "board");
  const filters = parseAdminInquiryQuery(rawParams);
  const [allInquiries, inquiries] = await Promise.all([
    safeListInquiries(),
    safeListInquiries(filters)
  ]);
  const priorityScores = await getScoresForInquiries(inquiries.map((i) => i.id)).catch((error) => {
    logger.error("Failed to load priority scores", error);
    return {};
  });
  const useTanstack = await isFeatureEnabled("admin_tanstack_table");
  const {
    activeInquiries,
    prioritizedInquiries,
    focusSummary,
    immediateExecutionItems,
    quickActionLinks,
    queueGroups,
    flowAlerts,
    summaryProps
  } = buildAdminInquiryPageData({
    allInquiries,
    inquiries,
    filters,
    viewMode
  });

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
                문의, 상태 전환, 내부 메모, 견적, 사건 스냅샷은 모두 system DB를 기준으로 관리합니다.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/admin"
                className="inline-flex items-center justify-center rounded-full border border-line bg-surface px-4 py-2 text-sm font-medium text-text transition hover:border-line-strong hover:bg-surface-muted"
              >
                대시보드
              </Link>
              <Link
                href="/admin/monitoring"
                className="inline-flex items-center justify-center rounded-full border border-line bg-surface px-4 py-2 text-sm font-medium text-text transition hover:border-line-strong hover:bg-surface-muted"
              >
                법령·판례 모니터링
              </Link>
              <Link
                href="/admin/intake-sources"
                className="inline-flex items-center justify-center rounded-full border border-line bg-surface px-4 py-2 text-sm font-medium text-text transition hover:border-line-strong hover:bg-surface-muted"
              >
                접수 유입 분석
              </Link>
              <Link
                href="/intake"
                className="inline-flex items-center justify-center rounded-full border border-line bg-surface px-4 py-2 text-sm font-medium text-text transition hover:border-line-strong hover:bg-surface-muted"
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

          <div className="grid gap-3">
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

          </div>
        </div>
      </Card>

      <Card className="p-4">
        <nav aria-label="문의 운영 빠른 이동" className="flex flex-wrap items-center gap-2">
          <span className="ui-kicker mr-1">빠른 이동</span>
          <a href="#inquiry-quick-actions" className="ui-analysis-chip">
            즉시 실행 큐
          </a>
          <a href="#inquiry-summary" className="ui-analysis-chip">
            요약 지표
          </a>
          <a href="#inquiry-filters" className="ui-analysis-chip">
            필터
          </a>
          <a href="#inquiry-results" className="ui-analysis-chip">
            목록/보드
          </a>
        </nav>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]" id="inquiry-quick-actions">
        <Card className="p-6">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="ui-kicker">Execution Queue</p>
              <h3 className="mt-2 ui-section-title">지금 바로 처리할 순서</h3>
            </div>
            <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">
              상위 {immediateExecutionItems.length}건
            </span>
          </div>
          {immediateExecutionItems.length > 0 ? (
            <div className="mt-5 space-y-3">
              {immediateExecutionItems.map((item) => (
                <Link
                  key={`priority-${item.id}`}
                  href={item.href}
                  className="block rounded-2xl border border-line bg-surface px-4 py-4 transition hover:border-line-strong hover:bg-surface-muted"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-text-strong">{item.title}</p>
                      <p className="mt-1 text-xs text-text-muted">{item.meta}</p>
                      <p className="mt-2 text-sm text-text">{item.statusLabel}</p>
                      <p className="mt-1 text-xs text-text-muted">실행 준비도 {item.readiness}</p>
                    </div>
                    <span className={dashboardToneClassName(getPriorityScoreTone(item.score))}>
                      우선점수 {item.score}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              className="mt-5"
              title="즉시 실행 큐가 비어 있습니다."
              description="신규 접수 또는 응답 대기 건이 생기면 우선순위 기준으로 자동 정렬됩니다."
            />
          )}
        </Card>

        <Card className="p-6">
          <p className="ui-kicker">Quick Actions</p>
          <h3 className="mt-2 ui-section-title">운영 단축 이동</h3>
          <p className="mt-2 text-sm text-text-muted">
            자주 보는 필터 조합을 한 번에 열 수 있게 구성했습니다.
          </p>
          <div className="mt-5 space-y-3">
            {quickActionLinks.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className="block rounded-2xl border border-line bg-surface px-4 py-4 transition hover:border-line-strong hover:bg-surface-muted"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-text-strong">{item.label}</p>
                    <p className="mt-2 text-sm text-text-muted">{item.description}</p>
                  </div>
                  <span className="rounded-full bg-surface-muted px-3 py-1 text-xs font-semibold text-text-strong">
                    {item.count}건
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </Card>
      </div>

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

      <div id="inquiry-summary">
        <InquiryDashboardSummary {...summaryProps} />
      </div>

      <InquiryFlowAlerts alerts={flowAlerts} />

      <InquiryWorkQueuesSafeV2 groups={queueGroups} />

      <Card className="p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="ui-kicker">View Mode</p>
            <h3 className="mt-1 text-lg font-semibold text-text-strong">보드/목록 전환</h3>
            <p className="mt-1 text-sm text-text-muted">
              GitHub 프로젝트 보드처럼 상태 흐름으로 보거나, 기존 목록/테이블로 볼 수 있습니다.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={boardViewHref}
              className={`inline-flex items-center justify-center rounded-full border px-4 py-2 text-sm font-medium transition ${
                viewMode === "board"
                  ? "border-primary bg-primary text-white"
                  : "border-line bg-surface text-text hover:border-line-strong hover:bg-surface-muted"
              }`}
            >
              파이프라인 보드
            </Link>
            <Link
              href={listViewHref}
              className={`inline-flex items-center justify-center rounded-full border px-4 py-2 text-sm font-medium transition ${
                viewMode === "list"
                  ? "border-primary bg-primary text-white"
                  : "border-line bg-surface text-text hover:border-line-strong hover:bg-surface-muted"
              }`}
            >
              목록/테이블
            </Link>
          </div>
        </div>
      </Card>

      <InquiryQuickPresets viewMode={viewMode} filters={filters} />

      <div id="inquiry-filters">
        <InquiryFilters filters={filters} viewMode={viewMode} />
      </div>

      <div id="inquiry-results">
        {prioritizedInquiries.length > 0 ? (
          viewMode === "board" ? (
            <InquiryKanbanBoard inquiries={prioritizedInquiries} />
          ) : (
            <>
              <InquiryCardList inquiries={prioritizedInquiries} />
              {useTanstack ? (
                <InquiryTanstackWrapper inquiries={prioritizedInquiries} />
              ) : (
                <InquiryTable inquiries={prioritizedInquiries} scores={priorityScores} />
              )}
            </>
          )
        ) : (
          <EmptyState
            title="조건에 맞는 문의가 없습니다."
            description="검색어 또는 필터 조건을 조정해 보세요. 초기화하면 전체 문의를 다시 볼 수 있습니다."
            actionLabel="필터 초기화"
            actionHref="/admin/inquiries"
          />
        )}
      </div>
    </div>
  );
}

function dashboardToneClassName(tone: "default" | "consult" | "quote" | "risk" | "won" | "urgent") {
  if (tone === "urgent") return "rounded-full bg-danger/10 px-3 py-1 text-xs font-semibold text-danger";
  if (tone === "consult") return "rounded-full bg-success/10 px-3 py-1 text-xs font-semibold text-success";
  if (tone === "quote") return "rounded-full bg-info/10 px-3 py-1 text-xs font-semibold text-info";
  if (tone === "risk") return "rounded-full bg-warning/10 px-3 py-1 text-xs font-semibold text-warning";
  if (tone === "won") return "rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary";
  return "rounded-full bg-surface-muted px-3 py-1 text-xs font-semibold text-text";
}
