import Link from "next/link";

import { CaseMatterStatusForm } from "@/components/admin/case-matter-status-form";
import { RequiredDocumentStatusPanel } from "@/components/admin/required-document-status-panel";
import { Card } from "@/components/ui/card";
import { adminCasesMessages } from "@/i18n/locales/admin-cases";
import { createTranslator, normalizeUiLocale } from "@/i18n/shared";
import { normalizeAdminEntityId } from "@/lib/http/admin-id";
import { getAllowedCaseMatterTransitions } from "@/lib/services/case-matter-status-transition-helpers";
import { getCaseMatterById } from "@/lib/services/case-matter-service";
import { getAllowedRequiredDocumentTransitions } from "@/lib/services/required-document-status-transition-helpers";
import { formatDate, formatDateTime } from "@/lib/utils";
import {
  getCaseMatterStatusLabel,
  normalizeCaseMatterStatus,
  normalizeRequiredDocumentStatus
} from "@/types/case-matter";

export const dynamic = "force-dynamic";

export default async function AdminCaseMatterDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ lang?: string }>;
}) {
  const { id: rawCaseMatterId } = await params;
  const query = (await searchParams) ?? {};
  const locale = normalizeUiLocale(query.lang);
  const t = createTranslator(adminCasesMessages, locale);
  const caseMatterId = normalizeAdminEntityId(rawCaseMatterId);

  if (!caseMatterId) {
    return (
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-text-strong">{t("invalidIdTitle")}</h2>
        <p className="mt-2 text-sm text-text-muted">{t("invalidIdDescription")}</p>
        <Link
          href="/admin/cases"
          className="mt-4 inline-flex h-10 items-center rounded-lg border border-line bg-surface px-4 text-sm font-medium text-text-strong transition hover:border-line-strong hover:bg-surface-muted"
        >
          {t("backToList")}
        </Link>
      </Card>
    );
  }

  const caseMatter = await getCaseMatterById(caseMatterId);
  if (!caseMatter) {
    return (
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-text-strong">{t("notFoundTitle")}</h2>
        <p className="mt-2 text-sm text-text-muted">{t("notFoundDescription")}</p>
        <Link
          href="/admin/cases"
          className="mt-4 inline-flex h-10 items-center rounded-lg border border-line bg-surface px-4 text-sm font-medium text-text-strong transition hover:border-line-strong hover:bg-surface-muted"
        >
          {t("backToList")}
        </Link>
      </Card>
    );
  }

  const currentStatus = normalizeCaseMatterStatus(caseMatter.status);
  const allowedCaseTransitions = getAllowedCaseMatterTransitions(currentStatus).map((status) =>
    normalizeCaseMatterStatus(status)
  );
  const requiredDocuments = caseMatter.requiredDocuments.map((item) => ({
    id: item.id,
    name: item.name,
    required: item.required,
    status: normalizeRequiredDocumentStatus(item.status),
    dueDate: item.dueDate,
    updatedAt: item.updatedAt.toISOString()
  }));
  const allowedDocumentTransitionsById = Object.fromEntries(
    requiredDocuments.map((item) => [
      item.id,
      getAllowedRequiredDocumentTransitions(item.status).map((status) =>
        normalizeRequiredDocumentStatus(status)
      )
    ])
  );

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="ui-kicker">{t("detailKicker")}</p>
            <h2 className="mt-2 text-2xl font-semibold text-text-strong">{caseMatter.title}</h2>
            <p className="mt-2 text-sm text-text-muted">
              {caseMatter.caseNo ?? t("caseNoMissing")} | {caseMatter.matterType}
            </p>
          </div>
          <Link
            href="/admin/cases"
            className="inline-flex h-10 items-center rounded-lg border border-line bg-surface px-4 text-sm font-medium text-text-strong transition hover:border-line-strong hover:bg-surface-muted"
          >
            {t("backToList")}
          </Link>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border border-line bg-surface-muted p-3">
            <p className="text-xs text-text-muted">{t("cardStatus")}</p>
            <p className="mt-1 text-sm font-semibold text-text-strong">
              {getCaseMatterStatusLabel(currentStatus, locale)}
            </p>
          </div>
          <div className="rounded-xl border border-line bg-surface-muted p-3">
            <p className="text-xs text-text-muted">{t("cardNextAction")}</p>
            <p className="mt-1 text-sm font-semibold text-text-strong">{caseMatter.nextAction.message}</p>
          </div>
          <div className="rounded-xl border border-line bg-surface-muted p-3">
            <p className="text-xs text-text-muted">{t("cardDueDate")}</p>
            <p className="mt-1 text-sm font-semibold text-text-strong">{formatDate(caseMatter.dueDate)}</p>
          </div>
          <div className="rounded-xl border border-line bg-surface-muted p-3">
            <p className="text-xs text-text-muted">{t("cardUpdatedAt")}</p>
            <p className="mt-1 text-sm font-semibold text-text-strong">
              {formatDateTime(caseMatter.updatedAt)}
            </p>
          </div>
        </div>
      </Card>

      <CaseMatterStatusForm
        caseMatterId={caseMatter.id}
        currentStatus={currentStatus}
        currentUpdatedAt={caseMatter.updatedAt.toISOString()}
        allowedTransitions={allowedCaseTransitions}
        locale={locale}
      />

      <RequiredDocumentStatusPanel
        caseMatterId={caseMatter.id}
        caseMatterUpdatedAt={caseMatter.updatedAt.toISOString()}
        documents={requiredDocuments}
        allowedTransitionsByDocumentId={allowedDocumentTransitionsById}
        locale={locale}
      />
    </div>
  );
}
