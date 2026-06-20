import Link from "next/link";

import { CaseMatterActionSections } from "@/components/admin/case-matter-action-sections";
import { type CaseRow } from "@/components/admin/cases-table";
import { CasesTableWithFilters } from "@/components/admin/cases-table-with-filters";
import { DeadlineScanButton } from "@/components/admin/deadline-scan-button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/state-panel";
import { adminCasesMessages } from "@/i18n/locales/admin-cases";
import { createTranslator, normalizeUiLocale } from "@/i18n/shared";
import { formatCaseMatterTypeLabel } from "@/lib/immigration";
import { buildCaseMatterActionDashboard } from "@/lib/services/case-matter-action-view-model";
import { listCaseMatters } from "@/lib/services/case-matter-service";
import { formatDate, formatDateTime } from "@/lib/utils";
import { getCaseMatterStatusLabel } from "@/types/case-matter";
import { logger } from "@/lib/utils/logger";

export const dynamic = "force-dynamic";

type CaseMatterListItem = Awaited<ReturnType<typeof listCaseMatters>>[number];

const CATEGORY_TABS = [
  { value: "", label: "전체" },
  { value: "VISA_STAY", label: "비자/체류" },
  { value: "ADMIN_APPEAL", label: "행정심판" },
  { value: "CONTRACT_INVESTIGATION", label: "계약서/사실조사" },
  { value: "LICENSE_PERMIT", label: "인허가" },
  { value: "OTHER", label: "기타" },
] as const;

async function safeListCaseMatters(category?: string, query?: string) {
  try {
    return await listCaseMatters(category, query);
  } catch (error) {
    logger.error("Failed to load case matters", error);
    return [] as CaseMatterListItem[];
  }
}

function countRequiredDocumentBacklog(caseMatter: CaseMatterListItem) {
  return caseMatter.requiredDocuments.filter((item) =>
    ["NEEDED", "REQUESTED", "NEEDS_FIX"].includes(item.status)
  ).length;
}

export default async function AdminCasesPage({
  searchParams
}: {
  searchParams?: Promise<{ lang?: string; category?: string; q?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const locale = normalizeUiLocale(params.lang);
  const t = createTranslator(adminCasesMessages, locale);
  const activeCategory = params.category ?? "";
  const query = params.q ?? "";
  const cases = await safeListCaseMatters(activeCategory || undefined, query || undefined);
  const actionDashboard = buildCaseMatterActionDashboard(cases);

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="ui-kicker">{t("boardKicker")}</p>
            <h2 className="mt-2 ui-page-title">{t("boardTitle")}</h2>
            <p className="mt-2 text-sm text-text-muted">{t("boardDescription")}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/ledger"
              className="inline-flex h-10 items-center rounded-full border border-line bg-surface px-4 text-sm font-semibold text-text-strong transition hover:border-line-strong hover:bg-surface-muted"
            >
              업무처리부
            </Link>
            <DeadlineScanButton />
            <a
              href={`/api/admin/cases/export${activeCategory ? `?category=${activeCategory}` : ""}${query ? `${activeCategory ? "&" : "?"}q=${encodeURIComponent(query)}` : ""}`}
              className="inline-flex h-10 items-center rounded-full border border-line bg-surface px-4 text-sm font-semibold text-text-strong transition hover:border-line-strong hover:bg-surface-muted"
            >
              CSV 내보내기
            </a>
            <a
              href={`/api/admin/cases/export-xlsx${activeCategory ? `?category=${activeCategory}` : ""}${query ? `${activeCategory ? "&" : "?"}q=${encodeURIComponent(query)}` : ""}`}
              className="inline-flex h-10 items-center rounded-full border border-line bg-surface px-4 text-sm font-semibold text-text-strong transition hover:border-line-strong hover:bg-surface-muted"
            >
              Excel 내보내기
            </a>
            <div className="rounded-full bg-surface-muted px-4 py-2 text-sm font-semibold text-text-strong">
              {t("totalCases")}: {cases.length}
            </div>
          </div>
        </div>
      </Card>

      {/* 검색 */}
      <form className="flex gap-2" action="/admin/cases">
        {activeCategory && <input type="hidden" name="category" value={activeCategory} />}
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder="이름 / 전화 / 이메일 / 사건명 / 사건번호 검색"
          className="h-10 flex-1 rounded-lg border border-line bg-surface px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
        <button type="submit" className="h-10 rounded-lg bg-primary px-5 text-sm font-semibold text-white hover:bg-text-strong">
          검색
        </button>
        {query && (
          <a
            href={`/admin/cases${activeCategory ? `?category=${activeCategory}` : ""}`}
            className="inline-flex h-10 items-center rounded-lg border border-line bg-surface px-4 text-sm text-text-strong hover:bg-surface-muted"
          >
            초기화
          </a>
        )}
      </form>

      {/* 카테고리 필터 탭 */}
      <div className="flex flex-wrap gap-2">
        {CATEGORY_TABS.map((tab) => {
          const isActive = activeCategory === tab.value;
          const href = tab.value
            ? `/admin/cases?category=${tab.value}`
            : "/admin/cases";
          return (
            <Link
              key={tab.value}
              href={href}
              className={`inline-flex h-9 items-center rounded-full px-4 text-sm font-semibold transition ${
                isActive
                  ? "bg-primary text-white"
                  : "border border-line bg-surface text-text-strong hover:border-line-strong hover:bg-surface-muted"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      <CaseMatterActionSections dashboard={actionDashboard} locale={locale} />

      {cases.length === 0 ? (
        <EmptyState
          title={t("emptyTitle")}
          description={t("emptyDescription")}
          actionLabel={t("goInquiries")}
          actionHref="/admin/inquiries"
        />
      ) : (
        <Card className="overflow-hidden p-0">
          <CasesTableWithFilters
            rows={cases.map((item): CaseRow => ({
              id: item.id,
              title: item.title,
              caseNo: item.caseNo,
              matterTypeLabel: formatCaseMatterTypeLabel(item.matterType),
              statusLabel: getCaseMatterStatusLabel(item.status, locale),
              nextActionMessage: item.nextAction.message,
              nextActionMeta: `${item.nextAction.priority} | ${item.nextAction.actionType}`,
              dueDate: formatDate(item.dueDate),
              pendingDocs: countRequiredDocumentBacklog(item),
              updatedAt: formatDateTime(item.updatedAt),
            }))}
          />
        </Card>
      )}
    </div>
  );
}
