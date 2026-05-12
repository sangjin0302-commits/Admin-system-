import Link from "next/link";

import { CaseMatterActionSections } from "@/components/admin/case-matter-action-sections";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/state-panel";
import { adminCasesMessages } from "@/i18n/locales/admin-cases";
import { createTranslator, normalizeUiLocale } from "@/i18n/shared";
import { buildCaseMatterActionDashboard } from "@/lib/services/case-matter-action-view-model";
import { listCaseMatters } from "@/lib/services/case-matter-service";
import { formatDate, formatDateTime } from "@/lib/utils";
import { getCaseMatterStatusLabel } from "@/types/case-matter";

export const dynamic = "force-dynamic";

type CaseMatterListItem = Awaited<ReturnType<typeof listCaseMatters>>[number];

async function safeListCaseMatters() {
  try {
    return await listCaseMatters();
  } catch (error) {
    console.error("Failed to load case matters", error);
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
  searchParams?: Promise<{ lang?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const locale = normalizeUiLocale(params.lang);
  const t = createTranslator(adminCasesMessages, locale);
  const cases = await safeListCaseMatters();
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
          <div className="rounded-full bg-surface-muted px-4 py-2 text-sm font-semibold text-text-strong">
            {t("totalCases")}: {cases.length}
          </div>
        </div>
      </Card>

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
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-line text-sm">
              <thead className="bg-surface-muted text-left text-xs uppercase tracking-wide text-text-muted">
                <tr>
                  <th className="px-4 py-3 font-semibold">{t("tableCase")}</th>
                  <th className="px-4 py-3 font-semibold">{t("tableStatus")}</th>
                  <th className="px-4 py-3 font-semibold">{t("tableNextAction")}</th>
                  <th className="px-4 py-3 font-semibold">{t("tableDueDate")}</th>
                  <th className="px-4 py-3 font-semibold">{t("tablePendingDocs")}</th>
                  <th className="px-4 py-3 font-semibold">{t("tableUpdatedAt")}</th>
                  <th className="px-4 py-3 font-semibold" />
                </tr>
              </thead>
              <tbody className="divide-y divide-line bg-surface">
                {cases.map((item) => (
                  <tr key={item.id} className="align-top">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-text-strong">{item.title}</p>
                      <p className="mt-1 text-xs text-text-muted">
                        {item.caseNo ?? t("caseNoMissing")} | {item.matterType}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-text">
                      {getCaseMatterStatusLabel(item.status, locale)}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-text-strong">{item.nextAction.message}</p>
                      <p className="mt-1 text-xs text-text-muted">
                        {item.nextAction.priority} | {item.nextAction.actionType}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-text">{formatDate(item.dueDate)}</td>
                    <td className="px-4 py-3 text-text">
                      {countRequiredDocumentBacklog(item)}
                    </td>
                    <td className="px-4 py-3 text-text-muted">{formatDateTime(item.updatedAt)}</td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/cases/${item.id}`}
                        className="inline-flex h-9 items-center rounded-lg border border-line bg-surface px-3 text-sm font-medium text-text-strong transition hover:border-line-strong hover:bg-surface-muted"
                      >
                        {t("viewDetail")}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
