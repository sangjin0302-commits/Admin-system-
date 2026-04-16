import { notFound } from "next/navigation";

import { InquiryCaseAnalysisPanel } from "@/components/admin/inquiry-case-analysis-panel";
import { InquiryCommunicationCenter } from "@/components/admin/inquiry-communication-center";
import { LawbotCaseAnalysisPanel } from "@/components/admin/lawbot-case-analysis-panel";
import { InquiryManagementForm } from "@/components/admin/inquiry-management-form";
import { InquiryMessagePreview } from "@/components/admin/inquiry-message-preview";
import { InquiryOperationsFeedPanel } from "@/components/admin/inquiry-operations-feed-panel";
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

function buildOperationsFeed(input: {
  createdAt: Date;
  updatedAt: Date;
  statusLabel: string;
  quoteStatus?: string | null;
  caseStage?: string | null;
  lawbotStatus: string;
  dueDate?: Date | null;
}) {
  const feed = [
    {
      label: "접수 생성",
      description: "초기 문의가 등록되고 요약 및 사전진단 정보가 생성되었습니다.",
      timestamp: formatDateTime(input.createdAt)
    },
    {
      label: "현재 상태 반영",
      description: `현재 운영 상태는 ${input.statusLabel} 단계입니다.`,
      timestamp: formatDateTime(input.updatedAt)
    }
  ];

  if (input.lawbotStatus === "available") {
    feed.push({
      label: "Lawbot 참고 분석 완료",
      description: "관련 법령, 판례, 해석례 추천과 후속 검색어가 연결되었습니다.",
      timestamp: formatDateTime(input.updatedAt)
    });
  }

  if (input.quoteStatus) {
    feed.push({
      label: "견적 흐름 연결",
      description: `견적 상태는 ${input.quoteStatus} 단계까지 연결되어 있습니다.`,
      timestamp: formatDateTime(input.updatedAt)
    });
  }

  if (input.caseStage) {
    feed.push({
      label: "사건 진행 상태",
      description: `사건 기록은 ${input.caseStage} 단계까지 반영되어 있습니다.`,
      timestamp: formatDateTime(input.updatedAt)
    });
  }

  if (input.dueDate) {
    feed.push({
      label: "일정 정보 반영",
      description: `희망 일정 또는 마감 일정이 ${formatDateTime(input.dueDate)} 기준으로 입력되어 있습니다.`,
      timestamp: formatDateTime(input.updatedAt)
    });
  }

  return feed;
}

function buildOperationsDraft(input: {
  contactName: string;
  statusLabel: string;
  strengthLabel: string;
  probability: number;
  recommendedAction: string;
  lawbotStatus: string;
  missingFacts: string[];
}) {
  return [
    `[운영 메모] ${input.contactName}님 건은 현재 ${input.statusLabel} 단계입니다.`,
    `AI 사건 강도는 ${input.strengthLabel}, 해결 가능성 평가는 ${input.probability}/100 기준입니다.`,
    input.recommendedAction,
    input.lawbotStatus === "available"
      ? "Lawbot 참고 분석까지 확보되어 있어 법령·판례 방향을 함께 검토할 수 있습니다."
      : "Lawbot 참고 분석은 아직 연결 전이거나 재확인이 필요합니다.",
    "",
    "[우선 확인 사항]",
    ...input.missingFacts.slice(0, 4).map((item, index) => `${index + 1}. ${item}`),
    "",
    "확인 후 상담 연결, 자료 요청, 견적 진행 중 어느 경로로 보낼지 바로 결정합니다."
  ].join("\n");
}

function buildAutomationActions(input: {
  contactName: string;
  strengthLabel: "강함" | "보통" | "주의" | "불리";
  recommendedAction: string;
  missingFacts: string[];
}) {
  const topFacts = input.missingFacts.slice(0, 4);
  const factLines = topFacts.map((item, index) => `${index + 1}. ${item}`).join("\n");

  return [
    {
      label: "자료 요청 준비",
      status: "IN_REVIEW" as InquiryStatus,
      description: "누락 정보와 기본 서류부터 정리하도록 내부 메모를 남기고 검토 상태로 전환합니다.",
      memo: [
        `[자동 액션] ${input.contactName}님 건을 자료 요청 중심으로 전환`,
        input.recommendedAction,
        "",
        "[먼저 확인할 자료]",
        factLines || "1. 기본 사실관계와 서류 보유 여부"
      ].join("\n")
    },
    {
      label: "상담 진행",
      status: "CONSULTATION_REQUIRED" as InquiryStatus,
      description: "상담 연결이 필요한 건으로 보고 상담 중심 메모를 남깁니다.",
      memo: [
        `[자동 액션] ${input.contactName}님 건을 상담 진행 흐름으로 전환`,
        `현재 사건 강도는 ${input.strengthLabel}이며 상담 시 아래 항목을 우선 확인합니다.`,
        factLines || "1. 현재 상태와 목표 결과"
      ].join("\n")
    },
    {
      label: "견적 진행",
      status: "QUOTE_DRAFTED" as InquiryStatus,
      description: "견적 검토 단계로 넘기고, 견적 전에 확인할 포인트를 메모로 남깁니다.",
      memo: [
        `[자동 액션] ${input.contactName}님 건을 견적 진행 흐름으로 전환`,
        input.recommendedAction,
        "",
        "[견적 전 확인]",
        factLines || "1. 범위와 일정 확정"
      ].join("\n")
    },
    {
      label: "보류 검토",
      status: "ON_HOLD" as InquiryStatus,
      description: "불리 요소나 자료 부족이 큰 경우 보류 메모를 남기고 상태를 전환합니다.",
      memo: [
        `[자동 액션] ${input.contactName}님 건을 보류 검토 상태로 전환`,
        "현재 자료만으로는 바로 진행하기보다 추가 사실 확인과 보수적 검토가 먼저 필요합니다.",
        "",
        "[보류 사유 메모]",
        factLines || "1. 핵심 사실관계 추가 확인 필요"
      ].join("\n")
    }
  ];
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
  const inquiryStatus = inquiry.status as InquiryStatus;
  const inquiryUrgency = inquiry.urgencyLevel as keyof typeof urgencyLabels;
  const inquiryType = inquiry.inquiryType as keyof typeof inquiryTypeLabels;
  const inquiryLanguage = inquiry.preferredLanguage as keyof typeof languageCodeLabels;
  const inquiryClientType = inquiry.clientType as keyof typeof clientTypeLabels;
  const requestedInquiryType = (inquiry.requestedInquiryType ?? "UNKNOWN") as keyof typeof inquiryTypeLabels;
  const declaredUrgency = (inquiry.declaredUrgency ?? "MEDIUM") as keyof typeof urgencyLabels;
  const quickStatuses = getQuickStatuses(caseAnalysis.strengthLabel);
  const quickStatusOptions = quickStatuses.map((status) => ({
    code: status,
    label: inquiryStatusLabels[status].ko,
  }));
  const workflowStep = getWorkflowStep({
    inquiryStatus,
    quoteStatus: quoteWorkspace.latestQuote?.status ?? null,
    caseStage: quoteWorkspace.latestQuote?.caseRecord?.currentStage ?? null,
  });
  const operationsFeed = buildOperationsFeed({
    createdAt: inquiry.createdAt,
    updatedAt: inquiry.updatedAt,
    statusLabel: inquiryStatusLabels[inquiryStatus].ko,
    quoteStatus: quoteWorkspace.latestQuote?.status ?? null,
    caseStage: quoteWorkspace.latestQuote?.caseRecord?.currentStage ?? null,
    lawbotStatus: lawbotAnalysis.status,
    dueDate: inquiry.dueDate
  });
  const operationsDraft = buildOperationsDraft({
    contactName: inquiry.contactName,
    statusLabel: inquiryStatusLabels[inquiryStatus].ko,
    strengthLabel: caseAnalysis.strengthLabel,
    probability: caseAnalysis.resolutionProbabilityPercent,
    recommendedAction: caseAnalysis.recommendedAction,
    lawbotStatus: lawbotAnalysis.status,
    missingFacts: caseAnalysis.missingFacts
  });
  const communicationDrafts = [
    {
      id: "receipt",
      label: "접수 완료 안내",
      description: "고객이 접수 직후 받는 기본 안내문입니다.",
      content: inquiry.generatedReceiptMessage,
      badge: "기본",
      recommendedWhen: "문의가 접수된 직후",
      channelHint: "이메일 또는 문자"
    },
    {
      id: "guidance",
      label: "준비 서류 안내",
      description: "초기 접수 후 가장 먼저 보낼 수 있는 준비 서류 안내입니다.",
      content: inquiry.generatedGuidance,
      badge: "서류",
      recommendedWhen: "초기 검토 후 자료 요청이 필요할 때",
      channelHint: "이메일 또는 카카오톡"
    },
    {
      id: "client-summary",
      label: "사건 검토 안내",
      description: "AI 사건 분석 기준으로 고객에게 현재 상황을 설명하는 문안입니다.",
      content: caseAnalysis.communicationGuidance.clientSummary,
      badge: "AI",
      recommendedWhen: "상담 전 또는 1차 검토 결과를 설명할 때",
      channelHint: "이메일 또는 상담 후 안내문"
    },
    {
      id: "document-request",
      label: "자료 요청 문안",
      description: "누락 사실과 필요 자료를 기준으로 바로 보내는 요청문입니다.",
      content: caseAnalysis.communicationGuidance.documentRequest,
      badge: "요청",
      recommendedWhen: "핵심 사실관계가 부족하거나 서류 보완이 필요할 때",
      channelHint: "이메일, 문자, 카카오톡"
    },
    {
      id: "operations-note",
      label: "운영 메모 초안",
      description: "내부 공유 또는 상담 전 요약 메모로 쓰는 문안입니다.",
      content: operationsDraft,
      badge: "내부",
      recommendedWhen: "담당자 인수인계 또는 상담 준비 시",
      channelHint: "내부 메모"
    }
  ];
  const automationActions = buildAutomationActions({
    contactName: inquiry.contactName,
    strengthLabel: caseAnalysis.strengthLabel,
    recommendedAction: caseAnalysis.recommendedAction,
    missingFacts: caseAnalysis.missingFacts
  });

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="status" status={inquiry.status}>
                {inquiryStatusLabels[inquiryStatus].ko}
              </Badge>
              <Badge tone="urgency" urgency={inquiry.urgencyLevel}>
                {urgencyLabels[inquiryUrgency].ko}
              </Badge>
              <Badge>
                {inquiryTypeLabels[inquiryType].ko}
              </Badge>
              <Badge tone="language" language={inquiry.preferredLanguage}>
                {languageCodeLabels[inquiryLanguage].ko}
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
              <p>의뢰 형태: {clientTypeLabels[inquiryClientType].ko}</p>
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
                automationActions={automationActions}
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
              <InfoItem label="요청 문의유형" value={inquiryTypeLabels[requestedInquiryType].ko} />
              <InfoItem label="체감 긴급도" value={urgencyLabels[declaredUrgency].ko} />
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
              <InfoItem label="문의 유형" value={inquiryTypeLabels[inquiryType].ko} />
              <InfoItem label="긴급도" value={urgencyLabels[inquiryUrgency].ko} />
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
      <InquiryCommunicationCenter drafts={communicationDrafts} />
          <InquiryOperationsFeedPanel items={operationsFeed} communicationDraft={operationsDraft} />
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
