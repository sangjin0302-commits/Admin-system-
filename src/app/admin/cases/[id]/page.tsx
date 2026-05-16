import Link from "next/link";

import {
  CaseMatterEventTimeline,
  CaseMatterInquiryLinkSection,
  CaseMatterPartiesSection,
  CaseMatterSubmissionSection,
  CaseMatterSummaryCards,
  RequiredDocumentSummarySection
} from "@/components/admin/case-matter-detail-sections";
import { CaseAccountingMemoPanel } from "@/components/admin/case-accounting-memo-panel";
import { CaseTaskManagementPanel } from "@/components/admin/case-task-management-panel";
import { ImmigrationCaseHintPanel } from "@/components/admin/immigration-case-hint-panel";
import { CaseMatterStatusForm } from "@/components/admin/case-matter-status-form";
import { RequiredDocumentStatusPanel } from "@/components/admin/required-document-status-panel";
import { SupplementRequestManagementPanel } from "@/components/admin/supplement-request-management-panel";
import { Card } from "@/components/ui/card";
import { adminCasesMessages } from "@/i18n/locales/admin-cases";
import { createTranslator, normalizeUiLocale } from "@/i18n/shared";
import { normalizeAdminEntityId } from "@/lib/http/admin-id";
import { formatCaseMatterTypeLabel } from "@/lib/immigration";
import { getAllowedCaseMatterTransitions } from "@/lib/services/case-matter-status-transition-helpers";
import { getCaseMatterById } from "@/lib/services/case-matter-service";
import { getAllowedRequiredDocumentTransitions } from "@/lib/services/required-document-status-transition-helpers";
import {
  caseTaskPriorityValues,
  caseTaskStatusValues,
  normalizeCaseMatterStatus,
  normalizeRequiredDocumentStatus,
  supplementStatusValues
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
    description: item.description,
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
  const caseTasks = caseMatter.tasks.map((task) => ({
    id: task.id,
    title: task.title,
    details: task.details,
    description: task.description,
    status: caseTaskStatusValues.includes(task.status) ? task.status : "TODO",
    priority: caseTaskPriorityValues.includes(task.priority) ? task.priority : "NORMAL",
    dueDate: task.dueDate,
    assignedTo: task.assignedTo,
    completedAt: task.completedAt,
    updatedAt: task.updatedAt.toISOString()
  }));
  const supplementRequests = caseMatter.supplementRequests.map((request) => ({
    id: request.id,
    title: request.title,
    description: request.description,
    status: supplementStatusValues.includes(request.status) ? request.status : "RECEIVED",
    receivedAt: request.receivedAt,
    dueDate: request.dueDate,
    respondedAt: request.respondedAt,
    requestedDocsJson: request.requestedDocsJson,
    responseNote: request.responseNote,
    updatedAt: request.updatedAt.toISOString()
  }));
  const accountingMemo = caseMatter.accountingMemo
    ? {
        id: caseMatter.accountingMemo.id,
        feeAmount: caseMatter.accountingMemo.feeAmount,
        feeStatus: caseMatter.accountingMemo.feeStatus,
        paymentStatus: caseMatter.accountingMemo.paymentStatus,
        paidAmount: caseMatter.accountingMemo.paidAmount,
        paidAt: caseMatter.accountingMemo.paidAt,
        paymentMemo: caseMatter.accountingMemo.paymentMemo,
        invoiceMemo: caseMatter.accountingMemo.invoiceMemo,
        ledgerMemo: caseMatter.accountingMemo.ledgerMemo,
        updatedAt: caseMatter.accountingMemo.updatedAt.toISOString()
      }
    : null;

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="ui-kicker">{t("detailKicker")}</p>
            <h2 className="mt-2 text-2xl font-semibold text-text-strong">{caseMatter.title}</h2>
            <p className="mt-2 text-sm text-text-muted">
              {caseMatter.caseNo ?? t("caseNoMissing")} | {formatCaseMatterTypeLabel(caseMatter.matterType)}
            </p>
          </div>
          <Link
            href="/admin/cases"
            className="inline-flex h-10 items-center rounded-lg border border-line bg-surface px-4 text-sm font-medium text-text-strong transition hover:border-line-strong hover:bg-surface-muted"
          >
            {t("backToList")}
          </Link>
        </div>

        <div className="mt-5 rounded-xl border border-line bg-surface-muted p-3">
          <p className="text-xs text-text-muted">{t("cardNextAction")}</p>
          <p className="mt-1 text-sm font-semibold text-text-strong">{caseMatter.nextAction.message}</p>
        </div>
      </Card>

      <CaseMatterSummaryCards caseMatter={caseMatter} status={currentStatus} locale={locale} />
      <CaseMatterPartiesSection parties={caseMatter.parties} />
      <CaseMatterInquiryLinkSection inquiry={caseMatter.inquiry} />
      <ImmigrationCaseHintPanel matterType={caseMatter.matterType} />
      <RequiredDocumentSummarySection documents={requiredDocuments} locale={locale} />

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

      <CaseTaskManagementPanel
        caseMatterId={caseMatter.id}
        caseMatterUpdatedAt={caseMatter.updatedAt.toISOString()}
        tasks={caseTasks}
      />
      <SupplementRequestManagementPanel
        caseMatterId={caseMatter.id}
        caseMatterUpdatedAt={caseMatter.updatedAt.toISOString()}
        supplementRequests={supplementRequests}
      />
      <CaseAccountingMemoPanel
        caseMatterId={caseMatter.id}
        caseMatterUpdatedAt={caseMatter.updatedAt.toISOString()}
        accountingMemo={accountingMemo}
        quoteReferences={caseMatter.quotes.map((quote) => ({
          status: quote.status,
          totalMin: quote.totalMin,
          totalMax: quote.totalMax
        }))}
        contractReferences={caseMatter.contractDrafts.map((contract) => ({
          status: contract.status
        }))}
      />
      <CaseMatterSubmissionSection
        submissionPackages={caseMatter.submissionPackages}
        submissions={caseMatter.submissions}
        supplementRequests={caseMatter.supplementRequests}
      />
      <CaseMatterEventTimeline events={caseMatter.events} />
    </div>
  );
}
