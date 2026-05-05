import { InquiryActionChecklistPanel } from "@/components/admin/inquiry-action-checklist-panel";
import {
  InquiryDetailEvidenceSection,
  InquiryDetailIntakeCategorySection,
  InquiryDetailInternalMemoSection
} from "@/components/admin/inquiry-detail-content-sections";
import { InquiryDetailUnavailable } from "@/components/admin/inquiry-detail-common";
import {
  InquiryDetailAnalysisHub,
  InquiryDetailHeaderCard,
  InquiryDetailQuickNav,
  InquiryDetailRiskBoard
} from "@/components/admin/inquiry-detail-layout-sections";
import { InquiryDetailRightColumn } from "@/components/admin/inquiry-detail-right-column";
import { InquiryManagementForm } from "@/components/admin/inquiry-management-form";
import { InquiryOperationalSummary } from "@/components/admin/inquiry-operational-summary";
import { QuoteWorkspacePanel } from "@/components/admin/quote-workspace";
import { WorkflowProgressPanelSafeV3 } from "@/components/admin/workflow-progress-panel-safe-v3";
import { Card } from "@/components/ui/card";
import { normalizeAdminEntityId } from "@/lib/http/admin-id";
import { buildInquiryDetailPageData } from "@/lib/services/inquiry-detail-page-data";
import { safeGetInquiryForDetail } from "@/lib/services/inquiry-detail-loaders";
import { buildIntakeCategoryDetailSummary } from "@/lib/services/intake-category-detail-summary";
import { getPublicTrackingCodeFromInquiry } from "@/lib/services/public-tracking-code-service";
import { formatDateTime } from "@/lib/utils";
import {
  getClientTypeLabel,
  getInquiryStatusLabel,
  getInquiryTypeLabel,
  getLanguageCodeLabel,
  getUrgencyLabel
} from "@/types/inquiry";

export const dynamic = "force-dynamic";

export default async function AdminInquiryDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const inquiryId = normalizeAdminEntityId(id);

  if (!inquiryId) {
    return (
      <InquiryDetailUnavailable
        title="잘못된 문의 ID입니다."
        message="URL 형식이 올바르지 않아 문의 상세를 불러올 수 없습니다."
        detail={id.trim() || "empty-id"}
      />
    );
  }

  try {
    const inquiryLoad = await safeGetInquiryForDetail(inquiryId);

    if (!inquiryLoad.inquiry) {
      if (inquiryLoad.errorMessage) {
        return (
          <InquiryDetailUnavailable
            title="문의 상세를 불러오지 못했습니다."
            message="데이터 조회 중 오류가 발생했습니다. 잠시 후 다시 시도하거나 문의 목록으로 돌아가 주세요."
            detail={inquiryLoad.errorMessage}
          />
        );
      }

      return (
        <InquiryDetailUnavailable
          title="문의를 찾을 수 없습니다."
          message="이미 삭제되었거나 접근할 수 없는 문의입니다."
        />
      );
    }

    const inquiry = inquiryLoad.inquiry;
    const {
      inquiryReceiptCode,
      tags,
      precheckDocs,
      previews,
      caseAnalysis,
      quoteWorkspace,
      lawbotAnalysis,
      referenceRecommendations,
      latestCaseMatter,
      lawbotConnectionSnapshot,
      storedLawbotSnapshot,
      inquiryStatus,
      inquiryUrgency,
      inquiryType,
      inquiryLanguage,
      inquiryClientType,
      requestedInquiryType,
      declaredUrgency,
      quickStatuses,
      workflowStep,
      routeRecommendation,
      quickStatusOptions,
      statusGuardPreview,
      recommendedCommunicationIds,
      analysisHubSignals,
      crossAnalysisSummary,
      mockMarketAnalyzeSignal,
      externalInsightSlots,
      checklistSnapshot,
      internalMemoWithoutChecklist,
      operationsFeed,
      lawbotSnapshotComparison,
      caseTimeline,
      structuredInternalMemo,
      internalMemoDisplay,
      communicationLogs,
      statusHistoryItems,
      suggestedCommunicationChecklist,
      operationsDraft,
      operationsDraftDisplay,
      communicationDrafts,
      automationActions,
      classificationConfidencePercent,
      detailRiskHighlights,
      detailImmediateActions,
      checklistActionItems
    } = await buildInquiryDetailPageData(inquiry);
    const intakeCategorySummary = buildIntakeCategoryDetailSummary(inquiry.description);
    const publicTrackingCode = getPublicTrackingCodeFromInquiry(inquiry);

    return (
      <div className="space-y-6">
        <InquiryDetailHeaderCard
          status={inquiryStatus}
          urgency={inquiryUrgency}
          language={inquiryLanguage}
          statusLabel={getInquiryStatusLabel(inquiryStatus)}
          urgencyLabel={getUrgencyLabel(inquiryUrgency)}
          inquiryTypeLabel={getInquiryTypeLabel(inquiryType)}
          languageLabel={getLanguageCodeLabel(inquiryLanguage)}
          title={inquiry.title}
          generatedSummary={inquiry.generatedSummary}
          inquiryReceiptCode={inquiryReceiptCode}
          createdAtLabel={formatDateTime(inquiry.createdAt)}
          updatedAtLabel={formatDateTime(inquiry.updatedAt)}
          contactName={inquiry.contactName}
          email={inquiry.email}
          phone={inquiry.phone}
          clientTypeLabel={getClientTypeLabel(inquiryClientType)}
          isCorporateRequest={inquiry.isCorporateRequest}
          sidePanel={(
            <div className="space-y-4">
              <InquiryOperationalSummary
                inquiryId={inquiry.id}
                inquiryUpdatedAt={inquiry.updatedAt.toISOString()}
                strengthLabel={caseAnalysis.strengthLabel}
                strengthScore={caseAnalysis.strengthScore}
                qualificationScore={inquiry.qualificationScore}
                recommendedAction={caseAnalysis.recommendedAction}
                quickStatuses={quickStatusOptions}
                missingFacts={caseAnalysis.missingFacts}
                lawbotStatus={lawbotAnalysis.status}
                automationActions={automationActions}
                routeRecommendationLabel={routeRecommendation.recommendationLabel}
                routeRecommendationReason={routeRecommendation.recommendationReason}
                marketSignalSummary={`${Math.min(mockMarketAnalyzeSignal.demandScore, 92)} / 100 · ${mockMarketAnalyzeSignal.metrics.find((metric) => metric.label === "응답 템포")?.value ?? "-"}`}
                recommendedDraftIds={recommendedCommunicationIds}
              />
              <Card muted className="p-5">
                <InquiryManagementForm
                  inquiryId={inquiry.id}
                  status={inquiryStatus}
                  updatedAt={inquiry.updatedAt.toISOString()}
                  internalMemo={internalMemoWithoutChecklist}
                  internalMemoTail={checklistSnapshot.block}
                  quickStatuses={quickStatuses}
                  statusGuardPreview={statusGuardPreview}
                />
              </Card>
            </div>
          )}
        />

        <InquiryDetailQuickNav />

        <InquiryDetailRiskBoard
          detailRiskHighlights={detailRiskHighlights}
          detailImmediateActions={detailImmediateActions}
        />

        <InquiryActionChecklistPanel
          inquiryId={inquiry.id}
          updatedAt={inquiry.updatedAt.toISOString()}
          baseInternalMemo={internalMemoWithoutChecklist}
          items={checklistActionItems}
          initialDoneIds={checklistSnapshot.doneIds}
        />

        <InquiryDetailAnalysisHub
          analysisHubSignals={analysisHubSignals}
          crossAnalysisSummary={crossAnalysisSummary}
          mockMarketAnalyzeSignal={mockMarketAnalyzeSignal}
          externalInsightSlots={externalInsightSlots}
        />

        <div id="detail-core-ops">
          <WorkflowProgressPanelSafeV3
            currentKey={workflowStep}
            lawbotStatus={lawbotAnalysis.status}
            quoteStatus={quoteWorkspace.latestQuote?.status ?? null}
            caseStage={
              latestCaseMatter?.status ?? quoteWorkspace.latestQuote?.caseRecord?.currentStage ?? null
            }
          />
        </div>

        <div className="space-y-6">
          <div className="space-y-6">
            <InquiryDetailEvidenceSection
              requestedInquiryTypeLabel={getInquiryTypeLabel(requestedInquiryType)}
              declaredUrgencyLabel={getUrgencyLabel(declaredUrgency)}
              dueDateLabel={formatDateTime(inquiry.dueDate)}
              nationality={inquiry.nationality}
              currentStatus={inquiry.currentStatus}
              documentCountry={inquiry.documentCountry}
              targetAgency={inquiry.targetAgency}
              hasPreparedDocuments={inquiry.hasPreparedDocuments}
              needsTranslation={inquiry.needsTranslation}
              wantsCallback={inquiry.wantsCallback}
              description={intakeCategorySummary.cleanedDescription}
              requestedOutcome={inquiry.requestedOutcome}
            />
            <InquiryDetailIntakeCategorySection
              summary={intakeCategorySummary}
              urgencyLabel={getUrgencyLabel(declaredUrgency)}
              publicTrackingCode={publicTrackingCode}
            />
            <InquiryDetailInternalMemoSection
              structuredInternalMemo={structuredInternalMemo}
              internalMemoDisplay={internalMemoDisplay}
            />
          </div>

          <InquiryDetailRightColumn
            precheck={{
              inquiryTypeLabel: getInquiryTypeLabel(inquiryType),
              urgencyLabel: getUrgencyLabel(inquiryUrgency),
              consultationRequired: inquiry.consultationRequired,
              classificationConfidencePercent,
              qualificationScore: inquiry.qualificationScore,
              classificationReason: inquiry.classificationReason,
              riskComplexityHint: inquiry.riskComplexityHint,
              recommendedNextStep: inquiry.recommendedNextStep,
              precheckDocs,
              tags
            }}
            caseAnalysis={caseAnalysis}
            lawbotAnalysis={lawbotAnalysis}
            references={referenceRecommendations}
            qualificationScore={inquiry.qualificationScore}
            caseTimelineItems={caseTimeline}
            statusHistoryItems={statusHistoryItems}
            communicationPanel={{
              inquiryId: inquiry.id,
              logs: communicationLogs,
              latestContactAt: inquiry.latestContactAt?.toISOString() ?? null,
              latestContactChannel: inquiry.latestContactChannel,
              latestContactSummary: inquiry.latestContactSummary,
              nextContactAt: inquiry.nextContactAt?.toISOString() ?? null,
              responsePending: inquiry.responsePending,
              suggestedChecklist: suggestedCommunicationChecklist
            }}
            communicationCenter={{
              drafts: communicationDrafts,
              recommendedDraftIds: recommendedCommunicationIds,
              recommendationLabel: routeRecommendation.recommendationLabel,
              publicTrackingCode
            }}
            snapshotCompare={{
              headline: lawbotSnapshotComparison.headline,
              description: lawbotSnapshotComparison.description,
              fields: lawbotSnapshotComparison.fields
            }}
            operationsFeed={{
              items: operationsFeed,
              communicationDraft: operationsDraft,
              communicationDraftDisplay: operationsDraftDisplay
            }}
            lawbotPanel={{
              inquiryId: inquiry.id,
              initialResult: lawbotAnalysis,
              connectionSnapshot: lawbotConnectionSnapshot,
              storedSnapshot: storedLawbotSnapshot
            }}
            referenceRecommendations={referenceRecommendations}
            previews={previews}
            generatedGuidance={inquiry.generatedGuidance}
            generatedReceiptMessage={inquiry.generatedReceiptMessage}
          />
        </div>

        <div id="detail-quote">
          <QuoteWorkspacePanel inquiryId={inquiry.id} workspace={quoteWorkspace} />
        </div>
      </div>
    );
  } catch (error) {
    console.error("Failed to render admin inquiry detail page", { inquiryId, error });
    return (
      <InquiryDetailUnavailable
        title="문의 상세 화면을 준비하지 못했습니다."
        message="렌더링 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요."
        detail={error instanceof Error ? error.message : "알 수 없는 오류"}
      />
    );
  }
}
