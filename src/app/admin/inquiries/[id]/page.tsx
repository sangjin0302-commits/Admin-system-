import { DeadlineCalculatorCard } from "@/components/admin/deadline-calculator-card";
import { ConsultationScriptPanel } from "@/components/admin/consultation-script-panel";
import { InquiryPromoteButton } from "@/components/admin/inquiry-promote-button";
import { InquiryActionChecklistPanel } from "@/components/admin/inquiry-action-checklist-panel";
import { LawbotOutcomePrediction } from "@/components/admin/lawbot-outcome-prediction";
import { QuoteGuidanceCard } from "@/components/admin/quote-guidance-card";
import { SimilarInquiriesCard } from "@/components/admin/similar-inquiries-card";
import { LawbotPlaybookCard } from "@/components/admin/lawbot-playbook-card";
import { LawbotPrecedentsCard } from "@/components/admin/lawbot-precedents-card";
import type { LawbotResponse } from "@/lib/services/lawbot-case-analysis-types";
import { InquiryCaseConversionPanel } from "@/components/admin/inquiry-case-conversion-panel";
import { InquiryLawbotRerunButton } from "@/components/admin/inquiry-lawbot-rerun-button";
import { LawbotDocumentDraftPanel } from "@/components/admin/lawbot-document-draft-panel";
import { LawbotMessageDraftPanel } from "@/components/admin/lawbot-message-draft-panel";
import {
  InquiryDetailEvidenceSection,
  InquiryDetailIntakeCategorySection,
  InquiryDetailIntakeSourceTrackingSection,
  InquiryDetailInternalMemoSection
} from "@/components/admin/inquiry-detail-content-sections";
import { InquiryDetailUnavailable } from "@/components/admin/inquiry-detail-common";
import { InquiryQuickActions } from "@/components/admin/inquiry-quick-actions";
import { ReplyDraftButton } from "@/components/admin/reply-draft-button";
import { InquiryLabels } from "@/components/admin/inquiry-labels";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
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
import { WorkflowProgressPanelSafeV3 } from "@/components/admin/workflow-progress-panel";
import { Card } from "@/components/ui/card";
import { ReviewTemplateCopy } from "@/components/admin/review-template-copy";
import { ClientProfileEnrichmentCard } from "@/components/admin/client-profile-enrichment-card";
import { AcceptanceAdvisorCard } from "@/components/admin/acceptance-advisor-card";
import { EmotionTrendChart } from "@/components/admin/emotion-trend-chart";
import { normalizeAdminEntityId } from "@/lib/http/admin-id";
import { buildInquiryDetailPageData } from "@/lib/services/inquiry-detail-page-data";
import { safeGetInquiryForDetail } from "@/lib/services/inquiry-detail-loaders";
import { buildCustomerEmailProviderReadiness } from "@/lib/services/customer-email-provider-config";
import { buildIntakeSourceTrackingViewModel } from "@/lib/services/intake-source-tracking";
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
import { logger } from "@/lib/utils/logger";
import { predictDuration } from "@/lib/services/duration-predictor-service";

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
    const durationPrediction = await predictDuration(inquiry.intakeCategory, "NORMAL").catch(() => null);

    let lawbotSnapshotForCards: Partial<LawbotResponse> | null = null;
    if (inquiry.lawbotSnapshotPayload) {
      try {
        const parsed = JSON.parse(inquiry.lawbotSnapshotPayload);
        lawbotSnapshotForCards =
          (parsed && typeof parsed === "object" && "payload" in parsed
            ? (parsed as { payload?: Partial<LawbotResponse> }).payload ?? parsed
            : parsed) as Partial<LawbotResponse>;
      } catch {
        lawbotSnapshotForCards = null;
      }
    }
    const publicTrackingCode = getPublicTrackingCodeFromInquiry(inquiry);
    const intakeSourceTracking = buildIntakeSourceTrackingViewModel(inquiry);
    const emailProviderReadiness = buildCustomerEmailProviderReadiness(process.env);
    const [kakaoEnabled, chipsEnabled, kakaoPresetEnabled, replyDraftEnabled, labelingEnabled, promoteEnabled] = await Promise.all([
      isFeatureEnabled("inquiry_kakao_deeplink_action"),
      isFeatureEnabled("inquiry_next_action_chips"),
      isFeatureEnabled("kakao_first_message_preset"),
      isFeatureEnabled("reply_draft_auto"),
      isFeatureEnabled("inquiry_auto_labeling"),
      isFeatureEnabled("inquiry_case_promote_oneclick"),
    ]);
    const kakaoChannelId = process.env.KAKAO_CHANNEL_ID ?? null;

    return (
      <div className="space-y-6">
        {(kakaoEnabled || chipsEnabled || kakaoPresetEnabled) ? (
          <InquiryQuickActions
            inquiryId={inquiry.id}
            phone={inquiry.phone}
            email={inquiry.email}
            kakaoChannelId={kakaoChannelId}
            kakaoEnabled={kakaoEnabled}
            chipsEnabled={chipsEnabled}
            kakaoPresetEnabled={kakaoPresetEnabled}
            contactName={inquiry.contactName}
            inquiryTitle={inquiry.title}
          />
        ) : null}
        {replyDraftEnabled ? <ReplyDraftButton inquiryId={inquiry.id} enabled={replyDraftEnabled} variantsEnabled={await isFeatureEnabled("reply_draft_variants")} /> : null}
        {labelingEnabled ? <InquiryLabels inquiryId={inquiry.id} enabled={labelingEnabled} /> : null}
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
              {durationPrediction && (
                <p className="text-xs text-text-muted">
                  예상 처리{" "}
                  <span className="font-semibold text-text-strong">
                    {durationPrediction.p50Days}일
                  </span>{" "}
                  (P90: {durationPrediction.p90Days}일)
                </p>
              )}
              <div className="flex justify-end">
                <InquiryLawbotRerunButton inquiryId={inquiry.id} />
              </div>
              {promoteEnabled && <InquiryPromoteButton inquiryId={inquiry.id} enabled={promoteEnabled} />}
              <InquiryCaseConversionPanel
                inquiryId={inquiry.id}
                inquiryTitle={inquiry.title}
                inquiryType={inquiryType}
                intakeCategory={inquiry.intakeCategory ?? null}
                latestCaseMatter={
                  latestCaseMatter
                    ? {
                        id: latestCaseMatter.id,
                        caseNo: latestCaseMatter.caseNo,
                        title: latestCaseMatter.title,
                        matterType: latestCaseMatter.matterType,
                        status: latestCaseMatter.status
                      }
                    : null
                }
              />
            </div>
          )}
        />

        <InquiryDetailQuickNav />

        {lawbotSnapshotForCards && (
          <LawbotOutcomePrediction snapshot={lawbotSnapshotForCards as LawbotResponse} />
        )}

        <div className="grid gap-4 lg:grid-cols-2">
          <QuoteGuidanceCard
            snapshot={(lawbotSnapshotForCards as LawbotResponse | null) ?? null}
            category={inquiry.intakeCategory ?? null}
          />
          <DeadlineCalculatorCard defaultCategory={inquiry.intakeCategory ?? null} />
        </div>

        {lawbotSnapshotForCards && (
          <LawbotPlaybookCard
            inquiryId={inquiry.id}
            snapshot={lawbotSnapshotForCards}
          />
        )}

        {lawbotSnapshotForCards && (
          <LawbotPrecedentsCard snapshot={lawbotSnapshotForCards} />
        )}

        <SimilarInquiriesCard inquiryId={inquiry.id} />

        <ConsultationScriptPanel inquiryId={inquiry.id} />

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

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <LawbotDocumentDraftPanel inquiryId={inquiry.id} />
          <LawbotMessageDraftPanel inquiryId={inquiry.id} />
        </div>

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
            <InquiryDetailIntakeSourceTrackingSection tracking={intakeSourceTracking} />
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
              inquiryId: inquiry.id,
              drafts: communicationDrafts,
              recommendedDraftIds: recommendedCommunicationIds,
              recommendationLabel: routeRecommendation.recommendationLabel,
              publicTrackingCode,
              emailProviderReadiness
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

        <ClientProfileEnrichmentCard email={inquiry.email} />
        <AcceptanceAdvisorCard inquiryId={inquiry.id} status={String(inquiry.status)} />
        <EmotionTrendChart inquiryId={inquiry.id} />

        <Card className="p-5">
          <p className="ui-kicker">v4.8 검토 응답 템플릿 (Quick Copy)</p>
          <p className="mt-1 text-sm text-text-muted">한·영·아랍어 — 모든 채널(톡톡·카카오·이메일·텔레그램) 동일 사용.</p>
          <div className="mt-4">
            <ReviewTemplateCopy />
          </div>
        </Card>
      </div>
    );
  } catch (error) {
    logger.error("Failed to render admin inquiry detail page", { inquiryId, error });
    return (
      <InquiryDetailUnavailable
        title="문의 상세 화면을 준비하지 못했습니다."
        message="렌더링 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요."
        detail={error instanceof Error ? error.message : "알 수 없는 오류"}
      />
    );
  }
}
