"use client";

import { useMemo, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { EmptyState, StateInline } from "@/components/ui/state-panel";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/lib/quote-engine/utils";
import type { QuoteSummarySnapshot, QuoteWorkspace } from "@/lib/quote-engine/types";
import type { LawbotCaseAnalysisResult } from "@/lib/services/lawbot-case-analysis-service";

const stageKindLabels: Record<string, string> = {
  RETAINER: "착수금",
  MIDTERM: "중도금",
  SUCCESS: "성공보수"
};

const quoteStatusLabels: Record<string, string> = {
  DRAFT: "초안",
  READY_TO_SEND: "발송 준비",
  SENT: "발송 완료",
  ACCEPTED: "수락",
  REJECTED: "거절",
  EXPIRED: "만료"
};

const caseStageLabels: Record<string, string> = {
  CONTRACT_PREPARATION: "계약 준비",
  DOCUMENT_COLLECTION: "서류 수집",
  UNDER_REVIEW: "검토 중",
  ACTIVE: "진행 중",
  SUBMITTED: "제출 완료",
  SUPPLEMENT_REQUESTED: "보완 요청",
  COMPLETED: "완료",
  ON_HOLD: "보류",
  CLOSED: "종결"
};

function formatRange(min: number, max: number) {
  if (min === max) {
    return formatCurrency(min);
  }

  return `${formatCurrency(min)} ~ ${formatCurrency(max)}`;
}

function buildCaseAnalysisDraft(workspace: QuoteWorkspace) {
  const analysis = workspace.caseAnalysis;
  return [
    "[AI 사건 분석 요약]",
    `- 사건 강도: ${analysis.strengthLabel} (${analysis.strengthScore}점)`,
    `- 사건 요약: ${analysis.summary}`,
    "",
    "[핵심 쟁점]",
    ...analysis.issues.map((item) => `- ${item}`),
    "",
    "[유리 요소]",
    ...analysis.favorableFactors.map((item) => `- ${item}`),
    "",
    "[불리 요소]",
    ...analysis.riskFactors.map((item) => `- ${item}`),
    "",
    "[추가 확인 필요 사실]",
    ...analysis.missingFacts.map((item) => `- ${item}`),
    "",
    "[참고 법령]",
    ...analysis.lawReferences.map((item) => `- ${item.title}: ${item.summary}`),
    "",
    "[판례 검색어]",
    ...analysis.precedentReferences.map((item) => `- ${item.query}`)
  ].join("\n");
}

function buildLawbotAnalysisDraft(result: LawbotCaseAnalysisResult) {
  if (result.status !== "available") {
    return null;
  }

  const data = result.data;
  return [
    "[Lawbot 참고 분석]",
    `- 입력 요약: ${data.input_summary}`,
    "",
    "[Lawbot 핵심 쟁점]",
    ...(data.key_issues.length > 0 ? data.key_issues.map((item) => `- ${item}`) : ["- 원문 명시 없음"]),
    "",
    "[Lawbot 추가 확인 사실]",
    ...(data.followup_facts.length > 0 ? data.followup_facts.map((item) => `- ${item}`) : ["- 원문 명시 없음"]),
    "",
    "[Lawbot 참고 법령]",
    ...(data.applicable_laws.length > 0 ? data.applicable_laws.map((item) => `- ${item.law}: ${item.summary}`) : ["- 원문 명시 없음"]),
    "",
    "[Lawbot 참고 판례]",
    ...(data.related_precedents?.length
      ? data.related_precedents.map((item) =>
          `- ${item.case_name} / ${item.case_number}${item.court_name ? ` / ${item.court_name}` : ""}${item.decision_date ? ` / ${item.decision_date}` : ""}`
        )
      : ["- 원문 명시 없음"])
  ].join("\n");
}

function buildActionChecklist(workspace: QuoteWorkspace) {
  const actions = [
    workspace.caseAnalysis.recommendedAction,
    ...workspace.caseAnalysis.missingFacts.slice(0, 3).map((item) => `${item} 확인`),
  ];

  if (workspace.lawbotAnalysis.status === "available") {
    actions.push(...workspace.lawbotAnalysis.data.next_search_recommendations.slice(0, 3));
  }

  return [...new Set(actions.filter(Boolean))];
}

function buildActionTemplates(workspace: QuoteWorkspace, quote: QuoteSummarySnapshot | null) {
  const missingFacts = workspace.caseAnalysis.missingFacts.slice(0, 3);
  const lawbotMissingFacts =
    workspace.lawbotAnalysis.status === "available"
      ? workspace.lawbotAnalysis.data.followup_facts.slice(0, 3)
      : [];

  const combinedMissingFacts = [...new Set([...missingFacts, ...lawbotMissingFacts])].slice(0, 4);
  const documentRequest = [
    `${workspace.inquiry.contactName}님, 문의 내용 검토 결과 우선 아래 자료를 먼저 확인하면 다음 단계 판단이 훨씬 빨라집니다.`,
    "",
    ...combinedMissingFacts.map((item, index) => `${index + 1}. ${item}`),
    "",
    "자료를 보내주시면 확인 후 상담 또는 견적 진행 방향을 순차적으로 안내드리겠습니다."
  ].join("\n");

  const cautiousReview = [
    `${workspace.inquiry.contactName}님, 현재 내용만으로는 바로 진행 판단을 확정하기보다 추가 사실 확인이 먼저 필요한 상태입니다.`,
    workspace.caseAnalysis.recommendedAction,
    "",
    "관련 자료를 보완해 주시면 가능 범위와 주의할 점을 정리해서 다시 안내드리겠습니다."
  ].join("\n");

  const quoteAdvance = [
    `${workspace.inquiry.contactName}님, 현재 검토 기준으로는 견적 또는 수임 검토 단계로 이어갈 수 있는 여지가 있습니다.`,
    quote ? `예상 견적 범위는 ${formatRange(quote.totalMin, quote.totalMax)}입니다.` : "세부 견적은 자료 확인 후 확정됩니다.",
    workspace.caseAnalysis.recommendedAction,
    "",
    "원하시면 바로 견적 설명과 다음 준비 절차를 안내드리겠습니다."
  ].join("\n");

  return { documentRequest, cautiousReview, quoteAdvance };
}

function buildRecommendedSpecialTerms(workspace: QuoteWorkspace) {
  const missingFacts = workspace.caseAnalysis.missingFacts.slice(0, 3);
  const lawbotFollowups =
    workspace.lawbotAnalysis.status === "available"
      ? workspace.lawbotAnalysis.data.followup_facts.slice(0, 3)
      : [];

  const factChecklist = [...new Set([...missingFacts, ...lawbotFollowups])];

  return [
    "[권장 특약 초안]",
    "1. 의뢰인은 사실관계와 제출자료를 정확하게 제공하고, 추가 확인 요청이 있는 경우 지체 없이 협조합니다.",
    "2. 행정기관 또는 관계기관의 심사 기준, 재량 판단, 보완 요구, 제도 변경에 따라 결과와 소요 기간이 달라질 수 있습니다.",
    "3. 업무 범위에 포함되지 않은 번역, 공증, 외부 수수료, 추가 보완 대응, 현장 방문은 별도 협의 또는 추가 비용 대상이 될 수 있습니다.",
    "4. 실제 제출 전 사실관계 또는 서류 상태가 달라질 경우 보수와 진행 전략이 조정될 수 있습니다.",
    factChecklist.length > 0 ? "" : null,
    factChecklist.length > 0 ? "[추가 확인 필요 사항]" : null,
    ...factChecklist.map((item, index) => `${index + 1}. ${item}`)
  ]
    .filter(Boolean)
    .join("\n");
}

type QuoteWorkspaceProps = {
  inquiryId: string;
  workspace: QuoteWorkspace;
  operationsSettings?: unknown;
};

export function QuoteWorkspacePanel({ inquiryId, workspace }: QuoteWorkspaceProps) {
  const router = useRouter();
  const [quote, setQuote] = useState<QuoteSummarySnapshot | null>(workspace.latestQuote);
  const [message, setMessage] = useState("");
  const [tone, setTone] = useState<"default" | "success" | "error">("default");
  const [isPending, startTransition] = useTransition();

  const groupedServices = useMemo(() => {
    const bucket = new Map<string, typeof workspace.masters.serviceTypes>();
    for (const service of workspace.masters.serviceTypes) {
      const current = bucket.get(service.category) ?? [];
      current.push(service);
      bucket.set(service.category, current);
    }
    return Array.from(bucket.entries());
  }, [workspace.masters.serviceTypes]);

  const [selectedServices, setSelectedServices] = useState<string[]>(
    workspace.latestQuote?.selectedServiceLegacyIds ?? workspace.suggestedServiceLegacyIds
  );
  const [selectedOptions, setSelectedOptions] = useState<string[]>(
    workspace.latestQuote?.selectedOptionLegacyIds ?? []
  );
  const [urgencyRuleCode, setUrgencyRuleCode] = useState(
    workspace.latestQuote?.urgencyRuleCode ?? workspace.suggestedUrgencyRuleCode
  );
  const [consultRuleCode, setConsultRuleCode] = useState(
    workspace.latestQuote?.consultRuleCode ?? workspace.masters.consultRules.find((rule) => rule.isDefault)?.code ?? "CONSULT_NONE"
  );
  const [paymentRuleCode, setPaymentRuleCode] = useState(
    workspace.latestQuote?.paymentRuleCode ?? workspace.masters.paymentRules.find((rule) => rule.isDefault)?.code ?? "PAYMENT_STANDARD"
  );
  const [rangeMode, setRangeMode] = useState(workspace.latestQuote?.rangeMode ?? true);
  const [quoteStatus, setQuoteStatus] = useState<QuoteSummarySnapshot["status"]>(workspace.latestQuote?.status ?? "DRAFT");
  const [draftNotes, setDraftNotes] = useState(workspace.latestQuote?.draftNotes ?? "");
  const [specialTerms, setSpecialTerms] = useState(workspace.latestQuote?.contractDraft?.specialTerms ?? "");
  const [caseDueDate, setCaseDueDate] = useState(
    workspace.latestQuote?.caseRecord?.dueDate ? workspace.latestQuote.caseRecord.dueDate.slice(0, 10) : ""
  );
  const [caseInternalMemo, setCaseInternalMemo] = useState(workspace.latestQuote?.caseRecord?.internalMemo ?? "");
  const [lineItems, setLineItems] = useState(workspace.latestQuote?.lineItems ?? []);
  const [adjustments, setAdjustments] = useState(workspace.latestQuote?.adjustments ?? []);
  const [paymentPlans, setPaymentPlans] = useState(workspace.latestQuote?.paymentPlans ?? []);
  const [showConditions, setShowConditions] = useState(true);
  const [showItems, setShowItems] = useState(false);
  const [showPaymentPlans, setShowPaymentPlans] = useState(false);
  const [showMessages, setShowMessages] = useState(false);
  const [serviceSearch, setServiceSearch] = useState("");
  const [optionSearch, setOptionSearch] = useState("");
  const caseAnalysisDraft = useMemo(() => buildCaseAnalysisDraft(workspace), [workspace]);
  const lawbotAnalysisDraft = useMemo(() => buildLawbotAnalysisDraft(workspace.lawbotAnalysis), [workspace.lawbotAnalysis]);
  const actionChecklist = useMemo(() => buildActionChecklist(workspace), [workspace]);
  const actionTemplates = useMemo(() => buildActionTemplates(workspace, quote), [workspace, quote]);
  const recommendedSpecialTerms = useMemo(() => buildRecommendedSpecialTerms(workspace), [workspace]);
  const normalizedServiceSearch = serviceSearch.trim().toLowerCase();
  const normalizedOptionSearch = optionSearch.trim().toLowerCase();
  const filteredGroupedServices = useMemo(() => {
    if (!normalizedServiceSearch) {
      return groupedServices;
    }

    return groupedServices
      .map(([category, services]) => [
        category,
        services.filter((service) =>
          [service.name, service.category, service.legacyId]
            .filter(Boolean)
            .some((value) => value.toLowerCase().includes(normalizedServiceSearch))
        )
      ] as const)
      .filter(([, services]) => services.length > 0);
  }, [groupedServices, normalizedServiceSearch]);
  const filteredOptions = useMemo(() => {
    if (!normalizedOptionSearch) {
      return workspace.masters.pricingOptions;
    }

    return workspace.masters.pricingOptions.filter((option) =>
      [option.name, option.description ?? "", option.legacyId]
        .some((value) => value.toLowerCase().includes(normalizedOptionSearch))
    );
  }, [normalizedOptionSearch, workspace.masters.pricingOptions]);

  function applyQuote(nextQuote: QuoteSummarySnapshot) {
    setQuote(nextQuote);
    setQuoteStatus(nextQuote.status);
    setSelectedServices(nextQuote.selectedServiceLegacyIds);
    setSelectedOptions(nextQuote.selectedOptionLegacyIds);
    setUrgencyRuleCode(nextQuote.urgencyRuleCode);
    setConsultRuleCode(nextQuote.consultRuleCode);
    setPaymentRuleCode(nextQuote.paymentRuleCode);
    setRangeMode(nextQuote.rangeMode);
    setDraftNotes(nextQuote.draftNotes ?? "");
    setSpecialTerms(nextQuote.contractDraft?.specialTerms ?? "");
    setCaseDueDate(nextQuote.caseRecord?.dueDate ? nextQuote.caseRecord.dueDate.slice(0, 10) : "");
    setCaseInternalMemo(nextQuote.caseRecord?.internalMemo ?? "");
    setLineItems(nextQuote.lineItems);
    setAdjustments(nextQuote.adjustments);
    setPaymentPlans(nextQuote.paymentPlans);
  }

  function setFeedback(nextMessage: string, nextTone: "default" | "success" | "error") {
    setMessage(nextMessage);
    setTone(nextTone);
  }

  function toggleSelection(values: string[], setValues: (nextValues: string[]) => void, target: string) {
    if (values.includes(target)) {
      setValues(values.filter((value) => value !== target));
      return;
    }
    setValues([...values, target]);
  }

  async function handleCreateQuote() {
    setFeedback("", "default");
    startTransition(async () => {
      const response = await fetch(`/api/admin/inquiries/${inquiryId}/quotes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ create: true })
      });
      const payload = await response.json();
      if (!response.ok) {
        setFeedback(payload.error ?? "견적 초안을 만들지 못했습니다.", "error");
        return;
      }
      applyQuote(payload.quote);
      setFeedback("견적 초안을 생성했습니다.", "success");
      router.refresh();
    });
  }

  async function handleRecalculate() {
    if (!quote) return;
    setFeedback("", "default");
    startTransition(async () => {
      const response = await fetch(`/api/admin/quotes/${quote.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selectedServiceLegacyIds: selectedServices,
          selectedOptionLegacyIds: selectedOptions,
          urgencyRuleCode,
          consultRuleCode,
          paymentRuleCode,
          rangeMode,
          draftNotes,
          stageOverrides: Object.fromEntries(
            paymentPlans.map((plan) => [plan.stageKind, { percentage: Number(plan.percentage), dueText: plan.dueText }])
          )
        })
      });
      const payload = await response.json();
      if (!response.ok) {
        setFeedback(payload.error ?? "견적을 다시 계산하지 못했습니다.", "error");
        return;
      }
      applyQuote(payload.quote);
      setFeedback("견적 계산을 갱신했습니다.", "success");
      router.refresh();
    });
  }

  async function handleSaveManualEdits() {
    if (!quote) return;
    setFeedback("", "default");
    startTransition(async () => {
      const response = await fetch(`/api/admin/quotes/${quote.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "manual",
          draftNotes,
          specialTerms: quote.contractDraft ? specialTerms : undefined,
          lineItems: lineItems.map((line, index) => ({
            id: line.id,
            label: line.label,
            description: line.description,
            amountMin: Number(line.amountMin),
            amountMax: Number(line.amountMax),
            sortOrder: index
          })),
          adjustments: adjustments.map((adjustment, index) => ({
            id: adjustment.id,
            label: adjustment.label,
            description: adjustment.description,
            computedMin: Number(adjustment.computedMin),
            computedMax: Number(adjustment.computedMax),
            sortOrder: index
          })),
          paymentPlans: paymentPlans.map((plan, index) => ({
            id: plan.id,
            stageKind: plan.stageKind,
            percentage: Number(plan.percentage),
            dueText: plan.dueText,
            sortOrder: index
          }))
        })
      });
      const payload = await response.json();
      if (!response.ok) {
        setFeedback(payload.error ?? "수정 내용을 저장하지 못했습니다.", "error");
        return;
      }
      applyQuote(payload.quote);
      setFeedback("수정 내용을 저장했습니다.", "success");
      router.refresh();
    });
  }

  async function handleCreateContractDraft() {
    if (!quote) return;
    setFeedback("", "default");
    startTransition(async () => {
      const response = await fetch(`/api/admin/quotes/${quote.id}/contract-draft`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ create: true })
      });
      const payload = await response.json();
      if (!response.ok) {
        setFeedback(payload.error ?? "계약 초안을 만들지 못했습니다.", "error");
        return;
      }
      applyQuote(payload.quote);
      setFeedback("계약 초안을 생성했습니다.", "success");
      router.refresh();
    });
  }

  async function handleUpdateQuoteStatus() {
    if (!quote) return;
    setFeedback("", "default");
    startTransition(async () => {
      const response = await fetch(`/api/admin/quotes/${quote.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "status",
          status: quoteStatus,
          caseDueDate,
          caseInternalMemo
        })
      });
      const payload = await response.json();
      if (!response.ok) {
        setFeedback(payload.error ?? "상태를 바꾸지 못했습니다.", "error");
        return;
      }
      applyQuote(payload.quote);
      setFeedback("상태를 반영했습니다.", "success");
      router.refresh();
    });
  }

  async function handleCopyMessage(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text);
      setFeedback(`${label} 문구를 복사했습니다.`, "success");
    } catch {
      setFeedback("문구를 복사하지 못했습니다.", "error");
    }
  }

  function updateLineField<T extends keyof (typeof lineItems)[number]>(id: string, field: T, value: (typeof lineItems)[number][T]) {
    setLineItems((current) => current.map((line) => (line.id === id ? { ...line, [field]: value } : line)));
  }

  function updateAdjustmentField<T extends keyof (typeof adjustments)[number]>(id: string, field: T, value: (typeof adjustments)[number][T]) {
    setAdjustments((current) => current.map((adjustment) => (adjustment.id === id ? { ...adjustment, [field]: value } : adjustment)));
  }

  function updatePaymentPlanField<T extends keyof (typeof paymentPlans)[number]>(id: string, field: T, value: (typeof paymentPlans)[number][T]) {
    setPaymentPlans((current) => current.map((plan) => (plan.id === id ? { ...plan, [field]: value } : plan)));
  }

  const paymentPercentageTotal = paymentPlans.reduce((sum, plan) => sum + Number(plan.percentage), 0);

  return (
    <div id="quote-workspace" className="space-y-6 scroll-mt-6">
      {!quote ? (
        <Card className="p-6">
          <h3 className="ui-section-title">견적 초안 생성</h3>
          <p className="mt-2 text-sm text-text-muted">문의 내용을 기준으로 추천 서비스와 사건 분석을 반영해 견적 초안을 만듭니다.</p>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <InfoPanel label="추천 서비스" value={workspace.suggestedServiceLegacyIds.map((legacyId) => workspace.masters.serviceTypes.find((service) => service.legacyId === legacyId)?.name ?? legacyId).join(", ")} />
            <InfoPanel label="추천 긴급도 규칙" value={workspace.masters.urgencyRules.find((rule) => rule.code === workspace.suggestedUrgencyRuleCode)?.label ?? workspace.suggestedUrgencyRuleCode} />
          </div>
          <div className="mt-5">
            <Button onClick={handleCreateQuote} disabled={isPending}>{isPending ? "생성 중..." : "견적 초안 만들기"}</Button>
          </div>
          {message ? <StateInline tone={tone}>{message}</StateInline> : null}
        </Card>
      ) : (
        <>
          <Card className="p-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge>작업 바로가기</Badge>
              <a
                href="#quote-analysis"
                className="inline-flex h-9 items-center justify-center rounded-md border border-line px-3 text-xs font-medium text-text-strong transition hover:bg-surface"
              >
                사건 분석 보기
              </a>
              <a
                href="#quote-contract"
                className="inline-flex h-9 items-center justify-center rounded-md border border-line px-3 text-xs font-medium text-text-strong transition hover:bg-surface"
              >
                계약 초안으로 이동
              </a>
              <a
                href="#quote-messages"
                className="inline-flex h-9 items-center justify-center rounded-md border border-line px-3 text-xs font-medium text-text-strong transition hover:bg-surface"
              >
                안내 문구 보기
              </a>
            </div>
          </Card>

          <Card id="quote-analysis" className="p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge>사건 분석</Badge>
                  <Badge className="border-primary/20 bg-primary-soft text-primary">{workspace.caseAnalysis.strengthLabel} · {workspace.caseAnalysis.strengthScore}점</Badge>
                </div>
                <h3 className="mt-4 ui-section-title">견적 전 사건 분석</h3>
                <p className="mt-2 text-sm text-text-muted">사건 분석 요약을 견적 메모와 계약 초안 특약에 바로 반영할 수 있습니다.</p>
              </div>
              <Button
                variant="secondary"
                onClick={() =>
                  setDraftNotes((current) => {
                    const sections = [current?.trim(), caseAnalysisDraft, lawbotAnalysisDraft].filter(Boolean);
                    return sections.join("\n\n");
                  })
                }
              >
                메모에 반영
              </Button>
            </div>
            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              <ListCard title="핵심 쟁점" items={workspace.caseAnalysis.issues} />
              <ListCard title="추가 확인 필요 사실" items={workspace.caseAnalysis.missingFacts} />
            </div>
            <div className="mt-5">
              <ListCard title="권장 액션" items={actionChecklist} />
            </div>
            {workspace.lawbotAnalysis.status === "available" ? (
              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                <ListCard title="Lawbot 핵심 쟁점" items={workspace.lawbotAnalysis.data.key_issues} />
                <ListCard
                  title="Lawbot 참고 판례"
                  items={
                    workspace.lawbotAnalysis.data.related_precedents?.map(
                      (item) =>
                        `${item.case_name} / ${item.case_number}${item.court_name ? ` / ${item.court_name}` : ""}${item.decision_date ? ` / ${item.decision_date}` : ""}`
                    ) ?? []
                  }
                />
              </div>
            ) : null}
            <div className="mt-5 grid gap-4 xl:grid-cols-3">
              <MessageCard
                title="추가서류 요청"
                message={actionTemplates.documentRequest}
                onCopy={() => handleCopyMessage(actionTemplates.documentRequest, "추가서류 요청")}
              />
              <MessageCard
                title="보수 검토 안내"
                message={actionTemplates.cautiousReview}
                onCopy={() => handleCopyMessage(actionTemplates.cautiousReview, "보수 검토 안내")}
              />
              <MessageCard
                title="견적 진행 안내"
                message={actionTemplates.quoteAdvance}
                onCopy={() => handleCopyMessage(actionTemplates.quoteAdvance, "견적 진행 안내")}
              />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex flex-wrap items-center gap-2">
              <Badge>견적 관리</Badge>
              <Badge className="border-primary/20 bg-primary-soft text-primary">상태: {quoteStatusLabels[quote.status]}</Badge>
            </div>
            <h3 className="mt-4 ui-section-title">견적 요약</h3>
            <p className="mt-2 whitespace-pre-line text-sm text-text-muted">{quote.calculationSummary ?? "계산 요약이 아직 없습니다."}</p>
            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <InfoPanel label="서비스 기본가" value={formatRange(quote.serviceBaseMin, quote.serviceBaseMax)} />
              <InfoPanel label="소계" value={formatRange(quote.subtotalMin, quote.subtotalMax)} />
              <InfoPanel label="VAT" value={formatRange(quote.vatAmountMin, quote.vatAmountMax)} />
              <InfoPanel label="총액" value={formatRange(quote.totalMin, quote.totalMax)} />
              <InfoPanel label="상담료" value={quote.consultFee > 0 ? `${formatCurrency(quote.consultFee)} (수임 시 공제)` : "없음"} />
              <InfoPanel label="최종 수정" value={new Date(quote.updatedAt).toLocaleString("ko-KR")} />
            </div>
          </Card>

          <CollapsibleSection
            title="견적 조건 조정"
            description="서비스, 옵션, 규칙, 메모를 조정하는 영역입니다. 필요할 때만 펼쳐서 수정하면 됩니다."
            open={showConditions}
            onToggle={() => setShowConditions((current) => !current)}
          >
            <div className="grid gap-6 xl:grid-cols-2">
              <div className="space-y-5">
                <div>
                  <p className="text-sm font-semibold text-text-strong">서비스 선택</p>
                  <div className="mt-3">
                    <Input
                      value={serviceSearch}
                      onChange={(event) => setServiceSearch(event.target.value)}
                      placeholder="서비스명, 분야, 코드로 검색"
                    />
                  </div>
                  <div className="mt-3 space-y-4">
                    {filteredGroupedServices.length === 0 ? (
                      <EmptyState
                        title="검색 결과가 없습니다."
                        description="다른 키워드로 다시 검색해 보세요."
                      />
                    ) : null}
                    {filteredGroupedServices.map(([category, services]) => (
                      <Card key={category} muted className="p-4">
                        <p className="text-sm font-semibold text-text-strong">{category}</p>
                        <div className="mt-3 space-y-2">
                          {services.map((service) => (
                            <label key={service.legacyId} className="flex items-start gap-3 rounded-md bg-surface px-3 py-2 text-sm text-text">
                              <input
                                type="checkbox"
                                checked={selectedServices.includes(service.legacyId)}
                                onChange={() => toggleSelection(selectedServices, setSelectedServices, service.legacyId)}
                                className="mt-1 h-4 w-4 rounded border-line-strong text-primary focus:ring-primary/20"
                              />
                              <span>
                                <span className="font-medium text-text-strong">{service.name}</span>
                                <span className="mt-1 block text-xs text-text-muted">{formatRange(service.minPrice, service.maxPrice)}</span>
                              </span>
                            </label>
                          ))}
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold text-text-strong">옵션 선택</p>
                  <div className="mt-3">
                    <Input
                      value={optionSearch}
                      onChange={(event) => setOptionSearch(event.target.value)}
                      placeholder="옵션명, 설명, 코드로 검색"
                    />
                  </div>
                  <div className="mt-3 grid gap-2">
                    {filteredOptions.length === 0 ? (
                      <EmptyState
                        title="검색 결과가 없습니다."
                        description="원하는 옵션 키워드를 다시 입력해 보세요."
                      />
                    ) : null}
                    {filteredOptions.map((option) => (
                      <label key={option.legacyId} className="flex items-start gap-3 rounded-md border border-line bg-surface-muted px-3 py-3 text-sm text-text">
                        <input
                          type="checkbox"
                          checked={selectedOptions.includes(option.legacyId)}
                          onChange={() => toggleSelection(selectedOptions, setSelectedOptions, option.legacyId)}
                          className="mt-1 h-4 w-4 rounded border-line-strong text-primary focus:ring-primary/20"
                        />
                        <span>
                          <span className="font-medium text-text-strong">{option.name}</span>
                          <span className="mt-1 block text-xs text-text-muted">{option.description}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <FieldBlock label="긴급도 규칙">
                    <Select value={urgencyRuleCode} onChange={(event) => setUrgencyRuleCode(event.target.value)}>
                      {workspace.masters.urgencyRules.map((rule) => (
                        <option key={rule.code} value={rule.code}>{rule.label}</option>
                      ))}
                    </Select>
                  </FieldBlock>
                  <FieldBlock label="상담료 규칙">
                    <Select value={consultRuleCode} onChange={(event) => setConsultRuleCode(event.target.value)}>
                      {workspace.masters.consultRules.map((rule) => (
                        <option key={rule.code} value={rule.code}>{rule.label}</option>
                      ))}
                    </Select>
                  </FieldBlock>
                  <FieldBlock label="결제 규칙">
                    <Select value={paymentRuleCode} onChange={(event) => setPaymentRuleCode(event.target.value)}>
                      {workspace.masters.paymentRules.map((rule) => (
                        <option key={rule.code} value={rule.code}>{rule.label}</option>
                      ))}
                    </Select>
                  </FieldBlock>
                  <FieldBlock label="범위 모드">
                    <label className="flex h-11 items-center gap-3 rounded-md border border-line bg-surface px-3 text-sm text-text">
                      <input type="checkbox" checked={rangeMode} onChange={(event) => setRangeMode(event.target.checked)} />
                      금액 범위를 유지합니다.
                    </label>
                  </FieldBlock>
                </div>

                <FieldBlock label="견적 메모">
                  <Textarea rows={10} value={draftNotes} onChange={(event) => setDraftNotes(event.target.value)} />
                </FieldBlock>

                <div className="flex flex-wrap gap-3">
                  <Button onClick={handleRecalculate} disabled={isPending}>{isPending ? "계산 중..." : "견적 다시 계산"}</Button>
                  <Button variant="secondary" onClick={handleSaveManualEdits} disabled={isPending}>수정 내용 저장</Button>
                </div>
              </div>
            </div>
          </CollapsibleSection>

          <CollapsibleSection
            title="항목 조정"
            description="서비스 라인과 가감 항목 금액을 직접 손볼 수 있습니다."
            open={showItems}
            onToggle={() => setShowItems((current) => !current)}
          >
            <div className="space-y-5">
              <div className="space-y-3">
                {lineItems.map((line) => (
                  <Card key={line.id} muted className="p-4">
                    <div className="grid gap-3 md:grid-cols-[1.3fr_0.7fr_0.7fr]">
                      <div className="space-y-2">
                        <Input value={line.label} onChange={(event) => updateLineField(line.id, "label", event.target.value)} />
                        <Input value={line.description ?? ""} onChange={(event) => updateLineField(line.id, "description", event.target.value || null)} placeholder="설명" />
                      </div>
                      <Input type="number" value={line.amountMin} onChange={(event) => updateLineField(line.id, "amountMin", Number(event.target.value))} />
                      <Input type="number" value={line.amountMax} onChange={(event) => updateLineField(line.id, "amountMax", Number(event.target.value))} />
                    </div>
                  </Card>
                ))}
              </div>

              <div className="space-y-3">
                {adjustments.map((adjustment) => (
                  <Card key={adjustment.id} muted className="p-4">
                    <div className="grid gap-3 md:grid-cols-[1.3fr_0.7fr_0.7fr]">
                      <div className="space-y-2">
                        <Input value={adjustment.label} onChange={(event) => updateAdjustmentField(adjustment.id, "label", event.target.value)} />
                        <Input value={adjustment.description ?? ""} onChange={(event) => updateAdjustmentField(adjustment.id, "description", event.target.value || null)} placeholder="설명" />
                      </div>
                      <Input type="number" value={adjustment.computedMin} onChange={(event) => updateAdjustmentField(adjustment.id, "computedMin", Number(event.target.value))} />
                      <Input type="number" value={adjustment.computedMax} onChange={(event) => updateAdjustmentField(adjustment.id, "computedMax", Number(event.target.value))} />
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </CollapsibleSection>

          <CollapsibleSection
            title="결제 계획"
            description="착수금, 중도금, 성공보수 비율과 안내 문구를 조정합니다."
            open={showPaymentPlans}
            onToggle={() => setShowPaymentPlans((current) => !current)}
          >
            <div className="grid gap-4 md:grid-cols-3">
              {paymentPlans.map((plan) => (
                <Card key={plan.id} muted className="p-4">
                  <p className="text-sm font-semibold text-text-strong">{stageKindLabels[plan.stageKind]}</p>
                  <div className="mt-3 space-y-2">
                    <Input type="number" value={plan.percentage} onChange={(event) => updatePaymentPlanField(plan.id, "percentage", Number(event.target.value))} />
                    <Input value={plan.dueText} onChange={(event) => updatePaymentPlanField(plan.id, "dueText", event.target.value)} />
                  </div>
                  <p className="mt-2 text-xs text-text-muted">예상 금액 {formatRange(plan.amountMin, plan.amountMax)}</p>
                </Card>
              ))}
            </div>
            {paymentPercentageTotal !== 100 ? (
              <StateInline tone="error">현재 결제 비율 합계는 {paymentPercentageTotal}%입니다. 100%로 맞춰 주세요.</StateInline>
            ) : null}
          </CollapsibleSection>

          <Card id="quote-contract" className="p-6">
            <h3 className="ui-section-title">상태 변경 및 계약 초안</h3>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <FieldBlock label="견적 상태">
                <Select value={quoteStatus} onChange={(event) => setQuoteStatus(event.target.value as QuoteSummarySnapshot["status"])}>
                  {Object.entries(quoteStatusLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </Select>
              </FieldBlock>
              <FieldBlock label="사건 기한">
                <Input type="date" value={caseDueDate} onChange={(event) => setCaseDueDate(event.target.value)} />
              </FieldBlock>
            </div>
            <div className="mt-4">
              <FieldBlock label="사건 내부 메모">
                <Textarea rows={4} value={caseInternalMemo} onChange={(event) => setCaseInternalMemo(event.target.value)} />
              </FieldBlock>
            </div>
            <div className="mt-4">
              <FieldBlock label="특약 직접 편집">
                <div className="mb-3 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setSpecialTerms((current) => [current?.trim(), recommendedSpecialTerms].filter(Boolean).join("\n\n"))}
                    disabled={!quote.contractDraft}
                  >
                    권장 특약 불러오기
                  </Button>
                </div>
                <Textarea
                  rows={8}
                  value={specialTerms}
                  onChange={(event) => setSpecialTerms(event.target.value)}
                  placeholder={
                    quote.contractDraft
                      ? "환불 기준, 추가 비용 정산, 자료 제출 협조, 업무 제외 범위 등 사건별 특약을 직접 적어둘 수 있습니다."
                      : "계약 초안을 먼저 생성하면 사건별 특약을 직접 편집할 수 있습니다."
                  }
                  disabled={!quote.contractDraft}
                />
              </FieldBlock>
              <p className="mt-2 text-xs text-text-muted">
                계약 초안이 이미 생성된 경우 이 특약은 수정 내용 저장 후 유지됩니다. 자동 분석 참고는 아래 문서 미리보기에도 함께 반영됩니다.
              </p>
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <Button onClick={handleUpdateQuoteStatus} disabled={isPending}>{isPending ? "반영 중..." : "상태 반영"}</Button>
              <Button variant="secondary" onClick={handleCreateContractDraft} disabled={isPending}>{isPending ? "생성 중..." : "계약 초안 생성"}</Button>
            </div>

            {quote.contractDraft ? (
              <Card muted className="mt-5 p-5">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-text-strong">{quote.contractDraft.title}</p>
                    <p className="mt-2 text-xs text-text-muted">최근 수정: {new Date(quote.contractDraft.updatedAt).toLocaleString("ko-KR")}</p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <a
                      href={`/api/admin/quotes/${quote.id}/contract-draft/export`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-white transition hover:opacity-90"
                    >
                      계약 초안 열기
                    </a>
                    <a
                      href={`/api/admin/quotes/${quote.id}/contract-draft/export?download=1`}
                      className="inline-flex h-11 items-center justify-center rounded-md border border-line-strong px-4 text-sm font-medium text-text-strong transition hover:bg-surface"
                    >
                      파일 다운로드
                    </a>
                  </div>
                </div>
                <div className="mt-5 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
                  <DocumentBlock title="계약 본문" content={quote.contractDraft.bodyText} />
                  <div className="space-y-4">
                    {quote.contractDraft.scopeText ? (
                      <DocumentBlock title="업무 범위" content={quote.contractDraft.scopeText} compact />
                    ) : null}
                    {quote.contractDraft.paymentSummary ? (
                      <DocumentBlock title="결제 안내" content={quote.contractDraft.paymentSummary} compact />
                    ) : null}
                    {quote.contractDraft.specialTerms ? (
                      <DocumentBlock title="특약 및 사건 분석 참고" content={quote.contractDraft.specialTerms} compact />
                    ) : null}
                  </div>
                </div>
              </Card>
            ) : (
              <EmptyState title="계약 초안이 아직 없습니다." description="계약 초안 생성 버튼을 누르면 화면 미리보기와 다운로드 파일이 함께 준비됩니다." className="mt-5" />
            )}

            {quote.caseRecord ? (
              <Card muted className="mt-4 p-5">
                <p className="text-sm font-semibold text-text-strong">사건 번호: {quote.caseRecord.caseNumber}</p>
                <div className="mt-3 grid gap-2 text-sm text-text-muted sm:grid-cols-2">
                  <p>현재 단계: {caseStageLabels[quote.caseRecord.currentStage]}</p>
                  <p>기한: {quote.caseRecord.dueDate ? quote.caseRecord.dueDate.slice(0, 10) : "-"}</p>
                  <p className="sm:col-span-2">내부 메모: {quote.caseRecord.internalMemo || "-"}</p>
                </div>
              </Card>
            ) : null}
          </Card>

          <CollapsibleSection
            id="quote-messages"
            title="안내 문구"
            description="카카오톡, 이메일, 상담 안내에 바로 붙여 쓸 문구입니다."
            open={showMessages}
            onToggle={() => setShowMessages((current) => !current)}
          >
            <div className="grid gap-4 xl:grid-cols-2">
              <MessageCard title="견적 발송 문구 (KO)" message={quote.messageDrafts.quoteSendKo} onCopy={() => handleCopyMessage(quote.messageDrafts.quoteSendKo, "견적 발송 문구")}/>
              <MessageCard title="견적 발송 문구 (EN)" message={quote.messageDrafts.quoteSendEn} onCopy={() => handleCopyMessage(quote.messageDrafts.quoteSendEn, "영문 견적 발송 문구")}/>
              <MessageCard title="수락 안내 문구 (KO)" message={quote.messageDrafts.acceptedKo} onCopy={() => handleCopyMessage(quote.messageDrafts.acceptedKo, "수락 안내 문구")}/>
              <MessageCard title="수락 안내 문구 (EN)" message={quote.messageDrafts.acceptedEn} onCopy={() => handleCopyMessage(quote.messageDrafts.acceptedEn, "영문 수락 안내 문구")}/>
            </div>
          </CollapsibleSection>

          {message ? <StateInline tone={tone}>{message}</StateInline> : null}
        </>
      )}
    </div>
  );
}

function FieldBlock({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium text-text-strong">{label}</p>
      {children}
    </div>
  );
}

function CollapsibleSection({
  id,
  title,
  description,
  open,
  onToggle,
  children
}: {
  id?: string;
  title: string;
  description: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <Card id={id} className="p-6 scroll-mt-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="ui-section-title">{title}</h3>
          <p className="mt-2 text-sm text-text-muted">{description}</p>
        </div>
        <Button variant="secondary" onClick={onToggle}>
          {open ? "접기" : "펼쳐서 보기"}
        </Button>
      </div>
      {open ? <div className="mt-5">{children}</div> : null}
    </Card>
  );
}

function InfoPanel({ label, value }: { label: string; value: string }) {
  return (
    <Card muted className="p-4">
      <p className="ui-kicker">{label}</p>
      <p className="mt-2 text-sm font-medium text-text-strong">{value}</p>
    </Card>
  );
}

function ListCard({ title, items }: { title: string; items: string[] }) {
  return (
    <Card muted className="p-5">
      <p className="ui-kicker">{title}</p>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-text">
        {items.map((item) => (
          <li key={`${title}-${item}`}>{item}</li>
        ))}
      </ul>
    </Card>
  );
}

function DocumentBlock({
  title,
  content,
  compact = false
}: {
  title: string;
  content: string;
  compact?: boolean;
}) {
  return (
    <Card muted className={compact ? "p-4" : "p-5"}>
      <p className="ui-kicker">{title}</p>
      <pre className="mt-3 whitespace-pre-wrap text-sm text-text">{content}</pre>
    </Card>
  );
}

function MessageCard({ title, message, onCopy }: { title: string; message: string; onCopy: () => void }) {
  return (
    <Card muted className="p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-text-strong">{title}</p>
        <Button size="sm" variant="secondary" onClick={onCopy}>복사</Button>
      </div>
      <pre className="mt-3 whitespace-pre-wrap text-sm text-text">{message}</pre>
    </Card>
  );
}
