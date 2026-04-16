import { notFound } from "next/navigation";

import { InquiryCaseAnalysisPanel } from "@/components/admin/inquiry-case-analysis-panel";
import { LawbotCaseAnalysisPanel } from "@/components/admin/lawbot-case-analysis-panel";
import { InquiryManagementForm } from "@/components/admin/inquiry-management-form";
import { InquiryMessagePreview } from "@/components/admin/inquiry-message-preview";
import { InquiryOperationalSummary } from "@/components/admin/inquiry-operational-summary";
import { ReferenceRecommendationsPanel } from "@/components/admin/reference-recommendations-panel";
import { QuoteWorkspacePanel } from "@/components/admin/quote-workspace";
import { WorkflowProgressPanel } from "@/components/admin/workflow-progress-panel";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getNotionReferenceRecommendations } from "@/lib/integrations/notion";
import { analyzeInquiryCase } from "@/lib/services/case-analysis-service";
import { getLawbotCaseAnalysis } from "@/lib/services/lawbot-case-analysis-service";
import { formatDateTime, parseJsonArray } from "@/lib/utils";
import {
  getInquiryById,
  getInquiryMessagePreviewSet,
} from "@/lib/services/inquiry-service";
import { getQuoteWorkspaceForInquiry } from "@/lib/services/quote-service";
import {
  clientTypeLabels,
  type InquiryStatus,
  inquiryStatusLabels,
  inquiryTypeLabels,
  languageCodeLabels,
  urgencyLabels
} from "@/types/inquiry";

export const dynamic = "force-dynamic";

function getQuickStatuses(strengthLabel: "강함" | "보통" | "주의" | "불리"): InquiryStatus[] {
  if (strengthLabel === "강함") {
    return ["QUOTE_DRAFTED", "QUOTE_PENDING", "IN_REVIEW"];
  }

  if (strengthLabel === "보통") {
    return ["CONSULTATION_REQUIRED", "IN_REVIEW", "QUOTE_DRAFTED"];
  }

  if (strengthLabel === "주의") {
    return ["IN_REVIEW", "WAITING_CONSULTATION", "ON_HOLD"];
  }

  return ["IN_REVIEW", "ON_HOLD"];
}

function getWorkflowStep(input: {
  inquiryStatus: InquiryStatus;
  quoteStatus?: string | null;
  caseStage?: string | null;
}) {
  if (input.inquiryStatus === "CLOSED" || input.caseStage === "CLOSED" || input.caseStage === "COMPLETED") {
    return "CLOSED";
  }

  if (
    input.caseStage &&
    input.caseStage !== "CONTRACT_PREPARATION" &&
    input.caseStage !== "ON_HOLD"
  ) {
    return "CASEWORK";
  }

  if (input.inquiryStatus === "WON" || input.quoteStatus === "ACCEPTED" || input.caseStage === "CONTRACT_PREPARATION") {
    return "CONTRACT";
  }

  if (
    input.inquiryStatus === "QUOTE_DRAFTED" ||
    input.inquiryStatus === "QUOTE_PENDING" ||
    input.inquiryStatus === "QUOTE_SENT" ||
    input.quoteStatus
  ) {
    return "QUOTING";
  }

  if (
    input.inquiryStatus === "PRE_DIAGNOSED" ||
    input.inquiryStatus === "CONSULTATION_REQUIRED" ||
    input.inquiryStatus === "IN_REVIEW" ||
    input.inquiryStatus === "WAITING_CONSULTATION"
  ) {
    return "ANALYZED";
  }

  return "RECEIVED";
}

export default async function AdminInquiryDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const inquiry = await getInquiryById(id);

  if (!inquiry) {
    notFound();
  }

  const quoteWorkspace = await getQuoteWorkspaceForInquiry(id);
  const tags = parseJsonArray(inquiry.serviceTags);
  const precheckDocs = parseJsonArray(inquiry.precheckRecommendedDocs).map((entry) => String(entry));
  const previews = getInquiryMessagePreviewSet(inquiry);
  const caseAnalysis = analyzeInquiryCase(inquiry);
  const lawbotAnalysis = await getLawbotCaseAnalysis(inquiry);
  const referenceRecommendations = await getNotionReferenceRecommendations({
    inquiryType: inquiry.inquiryType,
    serviceTags: tags,
    inquiryTitle: inquiry.title,
  });
  const quickStatuses = getQuickStatuses(caseAnalysis.strengthLabel);
  const quickStatusOptions = quickStatuses.map((status) => ({
    code: status,
    label: inquiryStatusLabels[status].ko,
  }));
  const workflowStep = getWorkflowStep({
    inquiryStatus: inquiry.status,
    quoteStatus: quoteWorkspace.latestQuote?.status ?? null,
    caseStage: quoteWorkspace.latestQuote?.caseRecord?.currentStage ?? null,
  });

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="status" status={inquiry.status}>
                {inquiryStatusLabels[inquiry.status].ko}
              </Badge>
              <Badge tone="urgency" urgency={inquiry.urgencyLevel}>
                {urgencyLabels[inquiry.urgencyLevel].ko}
              </Badge>
              <Badge>
                {inquiryTypeLabels[inquiry.inquiryType].ko}
              </Badge>
              <Badge tone="language" language={inquiry.preferredLanguage}>
                {languageCodeLabels[inquiry.preferredLanguage].ko}
              </Badge>
            </div>
            <h2 className="mt-4 ui-page-title">{inquiry.title}</h2>
            <p className="mt-3 max-w-3xl text-sm text-text">{inquiry.generatedSummary}</p>
            <div className="mt-4 grid gap-2 text-sm text-text-muted sm:grid-cols-2 xl:grid-cols-3">
              <p>접수번호: {inquiry.id}</p>
              <p>접수일: {formatDateTime(inquiry.createdAt)}</p>
              <p>업데이트: {formatDateTime(inquiry.updatedAt)}</p>
              <p>이름: {inquiry.contactName}</p>
              <p>이메일: {inquiry.email}</p>
              <p>연락처: {inquiry.phone || "-"}</p>
              <p>의뢰 형태: {clientTypeLabels[inquiry.clientType].ko}</p>
              <p>기업 의뢰 여부: {inquiry.isCorporateRequest ? "예" : "아니오"}</p>
              <p>담당자: {inquiry.assignee || "-"}</p>
            </div>
          </div>
          <div className="w-full max-w-md">
            <div className="space-y-4">
              <InquiryOperationalSummary
                inquiryId={inquiry.id}
                strengthLabel={caseAnalysis.strengthLabel}
                strengthScore={caseAnalysis.strengthScore}
                qualificationScore={inquiry.qualificationScore}
                recommendedAction={caseAnalysis.recommendedAction}
                quickStatuses={quickStatusOptions}
                missingFacts={caseAnalysis.missingFacts}
                lawbotStatus={lawbotAnalysis.status}
              />
              <Card muted className="p-5">
                <InquiryManagementForm
                  inquiryId={inquiry.id}
                  status={inquiry.status}
                  assignee={inquiry.assignee}
                  internalMemo={inquiry.internalMemo}
                  quickStatuses={quickStatuses}
                />
              </Card>
            </div>
          </div>
        </div>
      </Card>

      <WorkflowProgressPanel
        currentKey={workflowStep}
        lawbotStatus={lawbotAnalysis.status}
        quoteStatus={quoteWorkspace.latestQuote?.status ?? null}
        caseStage={quoteWorkspace.latestQuote?.caseRecord?.currentStage ?? null}
      />

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="ui-section-title">문의 원문</h3>
            <div className="mt-5 grid gap-4 text-sm text-text sm:grid-cols-2">
              <InfoItem label="국적" value={inquiry.nationality} />
              <InfoItem label="현재 상태" value={inquiry.currentStatus} />
              <InfoItem label="문서 발행국" value={inquiry.documentCountry} />
              <InfoItem label="제출처" value={inquiry.targetAgency} />
              <InfoItem label="요청 문의유형" value={inquiryTypeLabels[inquiry.requestedInquiryType ?? "UNKNOWN"].ko} />
              <InfoItem label="체감 긴급도" value={urgencyLabels[inquiry.declaredUrgency ?? "MEDIUM"].ko} />
              <InfoItem label="희망 일정" value={formatDateTime(inquiry.dueDate)} />
              <InfoItem label="보유 서류 여부" value={inquiry.hasPreparedDocuments ? "보유" : "미보유"} />
              <InfoItem label="번역 필요 여부" value={inquiry.needsTranslation ? "예" : "아니오"} />
              <InfoItem label="전화상담 희망" value={inquiry.wantsCallback ? "예" : "아니오"} />
            </div>
            <Card muted className="mt-6 p-5">
              <p className="ui-kicker">상세 설명</p>
              <p className="mt-3 whitespace-pre-line text-sm text-text">{inquiry.description}</p>
            </Card>
            <Card muted className="mt-4 p-5">
              <p className="ui-kicker">원하는 결과</p>
              <p className="mt-3 whitespace-pre-line text-sm text-text">
                {inquiry.requestedOutcome || "미입력"}
              </p>
            </Card>
          </Card>

          <Card className="p-6">
            <h3 className="ui-section-title">내부 메모</h3>
            <Card muted className="mt-4 p-5">
              <p className="whitespace-pre-line text-sm text-text">
                {inquiry.internalMemo || "아직 저장된 내부 메모가 없습니다."}
              </p>
            </Card>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="ui-section-title">사전진단 결과</h3>
            <div className="mt-5 grid gap-3">
              <InfoItem label="문의 유형" value={inquiryTypeLabels[inquiry.inquiryType].ko} />
              <InfoItem label="긴급도" value={urgencyLabels[inquiry.urgencyLevel].ko} />
              <InfoItem label="상담 필요 여부" value={inquiry.consultationRequired ? "필요" : "기본 안내 후 진행"} />
              <InfoItem label="분류 신뢰도" value={`${Math.round(inquiry.classificationConfidence * 100)}%`} />
              <InfoItem label="수임 적합도" value={`${inquiry.qualificationScore} / 100`} />
            </div>
            <Card muted className="mt-5 p-5">
              <p className="ui-kicker">진단 근거</p>
              <p className="mt-3 text-sm text-text">{inquiry.classificationReason}</p>
            </Card>
            <Card muted className="mt-5 p-5">
              <p className="ui-kicker">리스크·난이도 힌트</p>
              <p className="mt-3 text-sm text-text">{inquiry.riskComplexityHint || "일반 수준"}</p>
            </Card>
            <Card muted className="mt-5 p-5">
              <p className="ui-kicker">권장 다음 조치</p>
              <p className="mt-3 text-sm text-text">{inquiry.recommendedNextStep}</p>
            </Card>
            <Card muted className="mt-5 p-5">
              <p className="ui-kicker">준비 권장 서류</p>
              <ul className="mt-3 list-decimal space-y-1 pl-5 text-sm text-text">
                {precheckDocs.length > 0 ? (
                  precheckDocs.map((doc) => <li key={doc}>{doc}</li>)
                ) : (
                  <li>서류 목록 자동 생성 없음</li>
                )}
              </ul>
            </Card>
            <div className="mt-4 flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Badge key={tag}>{tag}</Badge>
              ))}
            </div>
          </Card>

          <InquiryCaseAnalysisPanel analysis={caseAnalysis} />
          <LawbotCaseAnalysisPanel inquiryId={inquiry.id} initialResult={lawbotAnalysis} />
          <ReferenceRecommendationsPanel recommendations={referenceRecommendations} />

          <Card className="p-6">
            <h3 className="ui-section-title">자동 안내 메시지 미리보기</h3>
            <p className="mt-2 text-sm text-text-muted">
              추후 이메일, 문자, 알림톡으로 연결할 때 사용할 템플릿 구조입니다.
            </p>
            <div className="mt-5">
              <InquiryMessagePreview previews={previews} />
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="ui-section-title">현재 생성된 자동 텍스트</h3>
            <TextPanel title="준비 권장 서류" content={inquiry.generatedGuidance} />
            <TextPanel title="접수 완료 메시지" content={inquiry.generatedReceiptMessage} />
          </Card>
        </div>
      </div>

      <QuoteWorkspacePanel inquiryId={inquiry.id} workspace={quoteWorkspace} />
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value?: string | null }) {
  return (
    <Card muted className="p-4">
      <p className="ui-kicker">{label}</p>
      <p className="mt-2 text-sm text-text">{value || "-"}</p>
    </Card>
  );
}

function TextPanel({ title, content }: { title: string; content: string }) {
  return (
    <Card muted className="mt-4 p-5">
      <p className="ui-kicker">{title}</p>
      <p className="mt-3 whitespace-pre-line text-sm text-text">{content}</p>
    </Card>
  );
}
