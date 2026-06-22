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
import { LawbotAnalysisPanel } from "@/components/admin/lawbot-analysis-panel";
import { CaseTaskManagementPanel } from "@/components/admin/case-task-management-panel";
import { ImmigrationCaseDetailPanel } from "@/components/admin/immigration-case-detail-panel";
import { ImmigrationCaseHintPanel } from "@/components/admin/immigration-case-hint-panel";
import { AdminAppealDetailPanel } from "@/components/admin/admin-appeal-detail-panel";
import { ContractDetailPanel } from "@/components/admin/contract-detail-panel";
import { LicenseDetailPanel } from "@/components/admin/license-detail-panel";
import { CaseMatterCategoryPanel } from "@/components/admin/case-matter-category-panel";
import { PortalUploadedFilesPanel } from "@/components/admin/portal-uploaded-files-panel";
import { ClientMessageBox } from "@/components/admin/client-message-box";
import { prisma } from "@/lib/prisma/client";
import { CaseMatterStatusForm } from "@/components/admin/case-matter-status-form";
import { RequiredDocumentStatusPanel } from "@/components/admin/required-document-status-panel";
import { SupplementRequestManagementPanel } from "@/components/admin/supplement-request-management-panel";
import { Card } from "@/components/ui/card";
import { adminCasesMessages } from "@/i18n/locales/admin-cases";
import { createTranslator, normalizeUiLocale } from "@/i18n/shared";
import { normalizeAdminEntityId } from "@/lib/http/admin-id";
import { formatCaseMatterTypeLabel, type ImmigrationDocumentDraftCaseData } from "@/lib/immigration";
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

type CaseMatterDetail = NonNullable<Awaited<ReturnType<typeof getCaseMatterById>>>;

function buildImmigrationDraftReadinessCaseData({
  caseMatter,
  immigrationDetail,
  requiredDocuments
}: {
  caseMatter: CaseMatterDetail;
  immigrationDetail: ImmigrationDocumentDraftCaseData["immigrationDetail"];
  requiredDocuments: Array<{ id: string; name: string }>;
}): ImmigrationDocumentDraftCaseData {
  return {
    caseMatter: {
      caseNo: caseMatter.caseNo,
      title: caseMatter.title,
      summary: caseMatter.summary,
      dueDate: caseMatter.dueDate
    },
    immigrationDetail,
    requiredDocuments: requiredDocuments.map((document) => ({ id: document.id, name: document.name })),
    caseParties: caseMatter.parties.map((party) => ({
      role: party.role,
      name: party.name
    })),
    caseEvents: caseMatter.events.map((event) => ({
      eventType: event.eventType,
      message: event.message
    }))
  };
}

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
  const immigrationDetail = caseMatter.immigrationDetail
    ? {
        id: caseMatter.immigrationDetail.id,
        dispositionType: caseMatter.immigrationDetail.dispositionType,
        dispositionDate: caseMatter.immigrationDetail.dispositionDate,
        noticeDate: caseMatter.immigrationDetail.noticeDate,
        serviceDate: caseMatter.immigrationDetail.serviceDate,
        appealDeadline: caseMatter.immigrationDetail.appealDeadline,
        departureDeadline: caseMatter.immigrationDetail.departureDeadline,
        detentionStartDate: caseMatter.immigrationDetail.detentionStartDate,
        stayExpiryDate: caseMatter.immigrationDetail.stayExpiryDate,
        submissionDeadline: caseMatter.immigrationDetail.submissionDeadline,
        supplementDeadline: caseMatter.immigrationDetail.supplementDeadline,
        resultExpectedDate: caseMatter.immigrationDetail.resultExpectedDate,
        nationality: caseMatter.immigrationDetail.nationality,
        currentStayStatus: caseMatter.immigrationDetail.currentStayStatus,
        familyInKoreaSummary: caseMatter.immigrationDetail.familyInKoreaSummary,
        residenceBaseSummary: caseMatter.immigrationDetail.residenceBaseSummary,
        employmentOrSchoolSummary: caseMatter.immigrationDetail.employmentOrSchoolSummary,
        violationHistorySummary: caseMatter.immigrationDetail.violationHistorySummary,
        scopeReviewRequired: caseMatter.immigrationDetail.scopeReviewRequired,
        attorneyScopeRisk: caseMatter.immigrationDetail.attorneyScopeRisk,
        officialFormCheckRequired: caseMatter.immigrationDetail.officialFormCheckRequired,
        deadlineVerifiedAt: caseMatter.immigrationDetail.deadlineVerifiedAt,
        verifiedBy: caseMatter.immigrationDetail.verifiedBy,
        updatedAt: caseMatter.immigrationDetail.updatedAt.toISOString()
      }
    : null;
  const immigrationDraftReadinessCaseData = buildImmigrationDraftReadinessCaseData({
    caseMatter,
    immigrationDetail,
    requiredDocuments
  });

  // 의뢰인 포털 업로드 자료 — inquiry.email 매칭
  const inquiryEmail = caseMatter.inquiry?.email ?? null;
  const portalUploads = inquiryEmail
    ? await prisma.portalUploadedFile.findMany({
        where: {
          client: { email: inquiryEmail }
        },
        orderBy: { uploadedAt: "desc" },
        take: 30
      })
    : [];

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
          <div className="flex flex-wrap gap-2">
            <a
              href={`/api/admin/case-matters/${caseMatter.id}/contract-pdf`}
              className="inline-flex h-10 items-center rounded-lg border border-gold/40 bg-surface px-4 text-sm font-medium text-primary transition hover:bg-gold-soft/30"
            >
              계약서 PDF
            </a>
            <a
              href={`/api/admin/case-matters/${caseMatter.id}/contract-docx?template=SERVICE`}
              className="inline-flex h-10 items-center rounded-lg border border-gold/40 bg-surface px-4 text-sm font-medium text-primary transition hover:bg-gold-soft/30"
            >
              계약서 DOCX (용역)
            </a>
            {(caseMatter.category === "CONTRACT_INVESTIGATION" || caseMatter.contractDetail) && (
              <a
                href={`/api/admin/case-matters/${caseMatter.id}/report-pdf`}
                className="inline-flex h-10 items-center rounded-lg border border-gold/40 bg-surface px-4 text-sm font-medium text-primary transition hover:bg-gold-soft/30"
              >
                조사보고서 PDF
              </a>
            )}
            {(caseMatter.category === "ADMIN_APPEAL" || caseMatter.adminAppealDetail) && (
              <a
                href={`/api/admin/case-matters/${caseMatter.id}/appeal-pdf`}
                className="inline-flex h-10 items-center rounded-lg border border-gold/40 bg-surface px-4 text-sm font-medium text-primary transition hover:bg-gold-soft/30"
              >
                심판 청구서 PDF
              </a>
            )}
            <Link
              href="/admin/cases"
              className="inline-flex h-10 items-center rounded-lg border border-line bg-surface px-4 text-sm font-medium text-text-strong transition hover:border-line-strong hover:bg-surface-muted"
            >
              {t("backToList")}
            </Link>
          </div>
        </div>

        <div className="mt-5 rounded-xl border border-line bg-surface-muted p-3">
          <p className="text-xs text-text-muted">{t("cardNextAction")}</p>
          <p className="mt-1 text-sm font-semibold text-text-strong">{caseMatter.nextAction.message}</p>
        </div>
      </Card>

      <CaseMatterCategoryPanel
        caseMatterId={caseMatter.id}
        currentCategory={caseMatter.category ?? "OTHER"}
      />
      <CaseMatterSummaryCards caseMatter={caseMatter} status={currentStatus} locale={locale} />
      <LawbotAnalysisPanel caseId={caseMatter.id} />
      <CaseMatterPartiesSection parties={caseMatter.parties} />
      <CaseMatterInquiryLinkSection inquiry={caseMatter.inquiry} />
      {(caseMatter.category === "VISA_STAY" || caseMatter.immigrationDetail) && (
        <>
          <ImmigrationCaseHintPanel
            matterType={caseMatter.matterType}
            caseData={immigrationDraftReadinessCaseData}
          />
          <ImmigrationCaseDetailPanel
            caseMatterId={caseMatter.id}
            caseMatterUpdatedAt={caseMatter.updatedAt.toISOString()}
            immigrationDetail={immigrationDetail}
          />
        </>
      )}

      {(caseMatter.category === "ADMIN_APPEAL" || caseMatter.adminAppealDetail) && (
        <AdminAppealDetailPanel
          caseMatterId={caseMatter.id}
          caseMatterUpdatedAt={caseMatter.updatedAt.toISOString()}
          appealDetail={caseMatter.adminAppealDetail ? {
            ...caseMatter.adminAppealDetail,
            updatedAt: caseMatter.adminAppealDetail.updatedAt.toISOString()
          } : null}
        />
      )}

      {(caseMatter.category === "CONTRACT_INVESTIGATION" || caseMatter.contractDetail) && (
        <ContractDetailPanel
          caseMatterId={caseMatter.id}
          caseMatterUpdatedAt={caseMatter.updatedAt.toISOString()}
          contractDetail={caseMatter.contractDetail ? {
            ...caseMatter.contractDetail,
            updatedAt: caseMatter.contractDetail.updatedAt.toISOString()
          } : null}
        />
      )}

      {(caseMatter.category === "LICENSE_PERMIT" || caseMatter.licenseDetail) && (
        <LicenseDetailPanel
          caseMatterId={caseMatter.id}
          caseMatterUpdatedAt={caseMatter.updatedAt.toISOString()}
          licenseDetail={caseMatter.licenseDetail ? {
            ...caseMatter.licenseDetail,
            updatedAt: caseMatter.licenseDetail.updatedAt.toISOString()
          } : null}
        />
      )}
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
      <PortalUploadedFilesPanel uploads={portalUploads} />
      <ClientMessageBox caseId={caseMatter.id} />
      <CaseMatterEventTimeline events={caseMatter.events} />
    </div>
  );
}
