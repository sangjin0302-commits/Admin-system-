"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { EmptyState, ErrorState, StateInline } from "@/components/ui/state-panel";
import { Table, TableContainer } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/lib/quote-engine/utils";
import type { QuoteSummarySnapshot, QuoteWorkspace } from "@/lib/quote-engine/types";

const stageKindLabels = {
  RETAINER: "착수금",
  MIDTERM: "중도금",
  SUCCESS: "성공보수"
} as const;

const quoteStatusLabels = {
  DRAFT: "초안",
  READY_TO_SEND: "발송 준비",
  SENT: "발송됨",
  ACCEPTED: "수락",
  REJECTED: "거절",
  EXPIRED: "만료"
} as const;

const paymentCollectionStatusLabels = {
  NOT_REQUESTED: "결제 요청 전",
  REQUESTED: "결제 요청됨",
  PAID: "입금 확인",
  CANCELLED: "결제 취소"
} as const;

type PaymentCollectionStatusValue = keyof typeof paymentCollectionStatusLabels;

const caseStageLabels = {
  CONTRACT_PREPARATION: "계약 준비",
  DOCUMENT_COLLECTION: "서류 수집",
  UNDER_REVIEW: "검토중",
  SUBMITTED: "제출 완료",
  SUPPLEMENT_REQUESTED: "보완 요청",
  COMPLETED: "완료",
  ON_HOLD: "보류",
  CLOSED: "종결"
} as const;

function formatRange(min: number, max: number) {
  if (min === max) {
    return `${formatCurrency(min)}원`;
  }

  return `${formatCurrency(min)}원 ~ ${formatCurrency(max)}원`;
}

type QuoteWorkspaceProps = {
  inquiryId: string;
  workspace: QuoteWorkspace;
};

type QuoteAiDraft = {
  proposalHeadline: string;
  customerSummary: string;
  scopeSummary: string;
  nextStepGuide: string;
  internalMemo: string;
};

export function QuoteWorkspacePanel({ inquiryId, workspace }: QuoteWorkspaceProps) {
  const router = useRouter();
  const [quote, setQuote] = useState<QuoteSummarySnapshot | null>(workspace.latestQuote);
  const [message, setMessage] = useState("");
  const [tone, setTone] = useState<"default" | "success" | "error">("default");
  const [aiDraft, setAiDraft] = useState<QuoteAiDraft | null>(null);
  const [isPending, startTransition] = useTransition();
  const [contractShareUrl, setContractShareUrl] = useState(
    workspace.latestQuote?.contractDraft?.contractShareUrl ?? ""
  );
  const [paymentLinkUrl, setPaymentLinkUrl] = useState(
    workspace.latestQuote?.contractDraft?.paymentLinkUrl ?? ""
  );
  const [paymentProvider, setPaymentProvider] = useState(
    workspace.latestQuote?.contractDraft?.paymentProvider ?? ""
  );
  const [paymentStatus, setPaymentStatus] = useState<PaymentCollectionStatusValue>(
    workspace.latestQuote?.contractDraft?.paymentStatus ?? "NOT_REQUESTED"
  );
  const [paymentReference, setPaymentReference] = useState(
    workspace.latestQuote?.contractDraft?.paymentReference ?? ""
  );
  const [paymentMemo, setPaymentMemo] = useState(
    workspace.latestQuote?.contractDraft?.paymentMemo ?? ""
  );

  const groupedServices = useMemo(() => {
    const bucket = new Map<string, typeof workspace.masters.serviceTypes>();

    for (const service of workspace.masters.serviceTypes) {
      const items = bucket.get(service.category) ?? [];
      items.push(service);
      bucket.set(service.category, items);
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
    workspace.latestQuote?.paymentRuleCode ??
      workspace.masters.paymentRules.find((rule) => rule.isDefault)?.code ??
      "PAYMENT_STANDARD"
  );
  const [rangeMode, setRangeMode] = useState(workspace.latestQuote?.rangeMode ?? true);
  const [quoteStatus, setQuoteStatus] = useState(workspace.latestQuote?.status ?? "DRAFT");
  const [draftNotes, setDraftNotes] = useState(workspace.latestQuote?.draftNotes ?? "");
  const [caseDueDate, setCaseDueDate] = useState(
    workspace.latestQuote?.caseRecord?.dueDate
      ? workspace.latestQuote.caseRecord.dueDate.slice(0, 10)
      : ""
  );
  const [caseInternalMemo, setCaseInternalMemo] = useState(
    workspace.latestQuote?.caseRecord?.internalMemo ?? ""
  );
  const [lineItems, setLineItems] = useState(workspace.latestQuote?.lineItems ?? []);
  const [adjustments, setAdjustments] = useState(workspace.latestQuote?.adjustments ?? []);
  const [paymentPlans, setPaymentPlans] = useState(workspace.latestQuote?.paymentPlans ?? []);

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
    setCaseDueDate(nextQuote.caseRecord?.dueDate ? nextQuote.caseRecord.dueDate.slice(0, 10) : "");
    setCaseInternalMemo(nextQuote.caseRecord?.internalMemo ?? "");
    setLineItems(nextQuote.lineItems);
    setAdjustments(nextQuote.adjustments);
    setPaymentPlans(nextQuote.paymentPlans);
    setContractShareUrl(nextQuote.contractDraft?.contractShareUrl ?? "");
    setPaymentLinkUrl(nextQuote.contractDraft?.paymentLinkUrl ?? "");
    setPaymentProvider(nextQuote.contractDraft?.paymentProvider ?? "");
    setPaymentStatus(nextQuote.contractDraft?.paymentStatus ?? "NOT_REQUESTED");
    setPaymentReference(nextQuote.contractDraft?.paymentReference ?? "");
    setPaymentMemo(nextQuote.contractDraft?.paymentMemo ?? "");
  }

  function setFeedback(nextMessage: string, nextTone: "default" | "success" | "error") {
    setMessage(nextMessage);
    setTone(nextTone);
  }

  function toggleSelection(
    values: string[],
    setValues: (nextValues: string[]) => void,
    target: string
  ) {
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
      setFeedback("레거시 단가표 기준으로 견적 초안을 생성했습니다.", "success");
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
          mode: "recalculate",
          selectedServiceLegacyIds: selectedServices,
          selectedOptionLegacyIds: selectedOptions,
          urgencyRuleCode,
          consultRuleCode,
          paymentRuleCode,
          rangeMode,
          draftNotes,
          stageOverrides: Object.fromEntries(
            paymentPlans.map((plan) => [
              plan.stageKind,
              { percentage: Number(plan.percentage), dueText: plan.dueText }
            ])
          )
        })
      });

      const payload = await response.json();

      if (!response.ok) {
        setFeedback(payload.error ?? "자동 재계산 중 오류가 발생했습니다.", "error");
        return;
      }

      applyQuote(payload.quote);
      setFeedback("레거시 계산 규칙으로 견적을 다시 계산했습니다.", "success");
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
        setFeedback(payload.error ?? "수동 조정 저장 중 오류가 발생했습니다.", "error");
        return;
      }

      applyQuote(payload.quote);
      setFeedback("항목별 수정 사항을 저장했습니다.", "success");
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
      setFeedback("견적 데이터를 기반으로 계약 초안을 생성했습니다.", "success");
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
        setFeedback(payload.error ?? "상태 변경 중 오류가 발생했습니다.", "error");
        return;
      }

      applyQuote(payload.quote);
      setFeedback("견적 상태를 반영했습니다.", "success");
      router.refresh();
    });
  }

  async function handleCopyMessage(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text);
      setFeedback(`${label} 문구를 클립보드에 복사했습니다.`, "success");
    } catch {
      setFeedback("클립보드 복사에 실패했습니다.", "error");
    }
  }

  async function handleGenerateAiDraft() {
    if (!quote) return;

    setFeedback("", "default");

    startTransition(async () => {
      const response = await fetch(`/api/admin/quotes/${quote.id}/ai-draft`, {
        method: "POST"
      });

      const payload = await response.json();

      if (!response.ok) {
        setFeedback(payload.error ?? "AI 제안서 초안을 생성하지 못했습니다.", "error");
        return;
      }

      setAiDraft(payload.draft);
      setFeedback("AI 제안서 초안을 생성했습니다.", "success");
    });
  }

  async function handleContractPaymentAutomation(action: "sendContract" | "markSigned" | "sendPayment" | "savePayment" | "markPaid") {
    if (!quote) return;

    setFeedback("", "default");

    startTransition(async () => {
      const response = await fetch(`/api/admin/quotes/${quote.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "contractPayment",
          contractShareUrl,
          sendContractNow: action === "sendContract",
          markContractSigned: action === "markSigned",
          paymentLinkUrl,
          paymentProvider,
          sendPaymentNow: action === "sendPayment",
          paymentStatus: action === "markPaid" ? "PAID" : paymentStatus,
          paymentReference,
          paymentMemo
        })
      });

      const payload = await response.json();

      if (!response.ok) {
        setFeedback(payload.error ?? "계약/결제 자동화 상태를 반영하지 못했습니다.", "error");
        return;
      }

      applyQuote(payload.quote);
      setFeedback(
        action === "markPaid"
          ? "입금 확인과 사건 전환 상태를 반영했습니다."
          : "계약/결제 상태를 반영했습니다.",
        "success"
      );
      router.refresh();
    });
  }

  function updateLineField<T extends keyof (typeof lineItems)[number]>(
    id: string,
    field: T,
    value: (typeof lineItems)[number][T]
  ) {
    setLineItems((current) =>
      current.map((line) => (line.id === id ? { ...line, [field]: value } : line))
    );
  }

  function updateAdjustmentField<T extends keyof (typeof adjustments)[number]>(
    id: string,
    field: T,
    value: (typeof adjustments)[number][T]
  ) {
    setAdjustments((current) =>
      current.map((adjustment) =>
        adjustment.id === id ? { ...adjustment, [field]: value } : adjustment
      )
    );
  }

  function updatePaymentPlanField<T extends keyof (typeof paymentPlans)[number]>(
    id: string,
    field: T,
    value: (typeof paymentPlans)[number][T]
  ) {
    setPaymentPlans((current) =>
      current.map((plan) => (plan.id === id ? { ...plan, [field]: value } : plan))
    );
  }

  const paymentPercentageTotal = paymentPlans.reduce((sum, plan) => sum + Number(plan.percentage), 0);

  return (
    <div className="space-y-6">
      {!quote ? (
        <EmptyState
          title="견적 초안이 아직 없습니다."
          description="레거시 admin_suite 단가표 기준으로 자동 초안을 만든 뒤, 관리자 검토용으로 세부 항목을 조정할 수 있습니다."
          className="text-left"
        />
      ) : null}

      {!quote ? (
        <Card className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="ui-section-title">견적 초안 생성</h3>
              <p className="ui-section-copy mt-2">
                문의 분류와 레거시 단가표를 바탕으로 초안을 생성합니다.
              </p>
            </div>
            <Button onClick={handleCreateQuote} disabled={isPending}>
              {isPending ? "생성 중..." : "견적 생성"}
            </Button>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <InfoPanel
              label="자동 추천 업무"
              value={
                workspace.suggestedServiceLegacyIds
                  .map(
                    (legacyId) =>
                      workspace.masters.serviceTypes.find((service) => service.legacyId === legacyId)?.name ??
                      legacyId
                  )
                  .join(", ")
              }
            />
            <InfoPanel
              label="기본 긴급도 규칙"
              value={
                workspace.masters.urgencyRules.find((rule) => rule.code === workspace.suggestedUrgencyRuleCode)
                  ?.label ?? workspace.suggestedUrgencyRuleCode
              }
            />
          </div>
          {message ? <StateInline tone={tone}>{message}</StateInline> : null}
        </Card>
      ) : (
        <>
          <Card className="p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge>견적 초안</Badge>
                  <Badge className="border-primary/20 bg-primary-soft text-primary">
                    상태: {quoteStatusLabels[quote.status]}
                  </Badge>
                  {quote.successFeeRestricted ? (
                    <Badge className="border-rose-200 bg-rose-50 text-danger">
                      행정심판/이의신청 성공보수 제한
                    </Badge>
                  ) : null}
                </div>
                <h3 className="mt-4 ui-section-title">실무형 견적 워크스페이스</h3>
                <p className="ui-section-copy mt-2 whitespace-pre-line">
                  {quote.calculationSummary ?? "자동 계산 요약이 아직 없습니다."}
                </p>
              </div>
              <div className="grid w-full gap-3 sm:grid-cols-2 lg:max-w-xl">
                <InfoPanel label="기본 합계" value={formatRange(quote.serviceBaseMin, quote.serviceBaseMax)} />
                <InfoPanel label="소계" value={formatRange(quote.subtotalMin, quote.subtotalMax)} />
                <InfoPanel label="VAT" value={formatRange(quote.vatAmountMin, quote.vatAmountMax)} />
                <InfoPanel label="총액" value={formatRange(quote.totalMin, quote.totalMax)} />
                <InfoPanel
                  label="상담료"
                  value={
                    quote.consultFee > 0
                      ? `${formatCurrency(quote.consultFee)}원 (수임 시 면제)`
                      : "미적용"
                  }
                />
                <InfoPanel label="최종 수정일" value={new Date(quote.updatedAt).toLocaleString("ko-KR")} />
              </div>
            </div>
          </Card>

          <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
            <Card className="p-6">
              <h3 className="ui-section-title">자동 계산 기준</h3>
              <p className="ui-section-copy mt-2">
                서비스 선택과 옵션 조합을 바꾸면 레거시 계산 순서대로 다시 계산합니다.
              </p>
              <div className="mt-5 space-y-6">
                <FieldGroup>
                  <Field label="업무 유형">
                    <div className="space-y-4">
                      {groupedServices.map(([category, services]) => (
                        <div key={category} className="rounded-md border border-line bg-surface-muted p-4">
                          <p className="text-sm font-semibold text-text-strong">{category}</p>
                          <div className="mt-3 space-y-2">
                            {services.map((service) => (
                              <label
                                key={service.legacyId}
                                className="flex items-start gap-3 rounded-md bg-surface px-3 py-2 text-sm text-text"
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedServices.includes(service.legacyId)}
                                  onChange={() =>
                                    toggleSelection(selectedServices, setSelectedServices, service.legacyId)
                                  }
                                  className="mt-1 h-4 w-4 rounded border-line-strong text-primary focus:ring-primary/20"
                                />
                                <span>
                                  <span className="font-medium text-text-strong">{service.name}</span>
                                  <span className="mt-1 block text-xs text-text-muted">
                                    {formatRange(service.minPrice, service.maxPrice)}
                                    {service.isAppeal ? " · appeal 제한 적용" : ""}
                                  </span>
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </Field>
                  <Field label="추가 옵션">
                    <div className="grid gap-2">
                      {workspace.masters.pricingOptions.map((option) => (
                        <label
                          key={option.legacyId}
                          className="flex items-start gap-3 rounded-md border border-line bg-surface-muted px-3 py-3 text-sm text-text"
                        >
                          <input
                            type="checkbox"
                            checked={selectedOptions.includes(option.legacyId)}
                            onChange={() => toggleSelection(selectedOptions, setSelectedOptions, option.legacyId)}
                            className="mt-1 h-4 w-4 rounded border-line-strong text-primary focus:ring-primary/20"
                          />
                          <span>
                            <span className="font-medium text-text-strong">{option.name}</span>
                            <span className="mt-1 block text-xs text-text-muted">
                              {option.description}
                              {option.unitLabel ? ` · ${option.unitLabel}` : ""}
                            </span>
                          </span>
                        </label>
                      ))}
                    </div>
                  </Field>
                </FieldGroup>

                <FieldGroup>
                  <Field label="긴급도">
                    <Select value={urgencyRuleCode} onChange={(event) => setUrgencyRuleCode(event.target.value)}>
                      {workspace.masters.urgencyRules.map((rule) => (
                        <option key={rule.code} value={rule.code}>
                          {rule.label}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="상담료">
                    <Select value={consultRuleCode} onChange={(event) => setConsultRuleCode(event.target.value)}>
                      {workspace.masters.consultRules.map((rule) => (
                        <option key={rule.code} value={rule.code}>
                          {rule.label}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="납입 구조">
                    <Select value={paymentRuleCode} onChange={(event) => setPaymentRuleCode(event.target.value)}>
                      {workspace.masters.paymentRules.map((rule) => (
                        <option key={rule.code} value={rule.code}>
                          {rule.label}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="표시 방식">
                    <label className="flex h-11 items-center gap-3 rounded-md border border-line bg-surface px-3 text-sm text-text">
                      <input
                        type="checkbox"
                        checked={rangeMode}
                        onChange={(event) => setRangeMode(event.target.checked)}
                        className="h-4 w-4 rounded border-line-strong text-primary focus:ring-primary/20"
                      />
                      범위 견적으로 표시
                    </label>
                  </Field>
                  <Field label="견적 상태">
                    <Select
                      value={quoteStatus}
                      onChange={(event) =>
                        setQuoteStatus(event.target.value as QuoteSummarySnapshot["status"])
                      }
                    >
                      {Object.entries(quoteStatusLabels).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="사건 예정일">
                    <Input
                      type="date"
                      value={caseDueDate}
                      onChange={(event) => setCaseDueDate(event.target.value)}
                    />
                  </Field>
                  <Field label="사건 내부 메모">
                    <Textarea
                      rows={3}
                      value={caseInternalMemo}
                      onChange={(event) => setCaseInternalMemo(event.target.value)}
                      placeholder="수락/거절 사유 또는 계약 준비 메모를 기록합니다."
                    />
                  </Field>
                  <Field label="관리 메모">
                    <Textarea
                      rows={5}
                      value={draftNotes}
                      onChange={(event) => setDraftNotes(event.target.value)}
                      placeholder="견적 전제, 고객 협의 포인트, 제외 조건 등을 기록합니다."
                    />
                  </Field>
                </FieldGroup>

                <div className="flex flex-wrap gap-3">
                  <Button onClick={handleRecalculate} disabled={isPending || selectedServices.length === 0}>
                    {isPending ? "계산 중..." : "자동 재계산"}
                  </Button>
                  <Button variant="secondary" onClick={handleSaveManualEdits} disabled={isPending}>
                    {isPending ? "저장 중..." : "항목 조정 저장"}
                  </Button>
                  <Button variant="secondary" onClick={handleUpdateQuoteStatus} disabled={isPending}>
                    {isPending ? "반영 중..." : "상태 반영"}
                  </Button>
                  <Button variant="secondary" onClick={handleCreateContractDraft} disabled={isPending}>
                    {isPending ? "생성 중..." : "계약 초안 생성"}
                  </Button>
                </div>
                {message ? <StateInline tone={tone}>{message}</StateInline> : null}
              </div>
            </Card>

            <div className="space-y-6">
              <Card className="p-6">
                <h3 className="ui-section-title">항목별 견적 미리보기</h3>
                <p className="ui-section-copy mt-2">
                  자동 계산 결과를 바탕으로 항목 금액을 최종 조정할 수 있습니다.
                </p>

                <div className="mt-5 space-y-6">
                  <TableContainer>
                    <Table>
                      <thead>
                        <tr>
                          <th>구분</th>
                          <th>항목</th>
                          <th>최소</th>
                          <th>최대</th>
                        </tr>
                      </thead>
                      <tbody>
                        {lineItems.map((line) => (
                          <tr key={line.id}>
                            <td>{line.kind === "SERVICE" ? "기본업무" : "긴급도"}</td>
                            <td>
                              <div className="space-y-2">
                                <Input
                                  value={line.label}
                                  onChange={(event) => updateLineField(line.id, "label", event.target.value)}
                                />
                                <Input
                                  value={line.description ?? ""}
                                  onChange={(event) =>
                                    updateLineField(line.id, "description", event.target.value || null)
                                  }
                                  placeholder="설명"
                                />
                              </div>
                            </td>
                            <td>
                              <Input
                                type="number"
                                value={line.amountMin}
                                onChange={(event) =>
                                  updateLineField(line.id, "amountMin", Number(event.target.value))
                                }
                              />
                            </td>
                            <td>
                              <Input
                                type="number"
                                value={line.amountMax}
                                onChange={(event) =>
                                  updateLineField(line.id, "amountMax", Number(event.target.value))
                                }
                              />
                            </td>
                          </tr>
                        ))}
                        {adjustments.map((adjustment) => (
                          <tr key={adjustment.id}>
                            <td>{adjustment.isVat ? "VAT" : "가산"}</td>
                            <td>
                              <div className="space-y-2">
                                <Input
                                  value={adjustment.label}
                                  onChange={(event) =>
                                    updateAdjustmentField(adjustment.id, "label", event.target.value)
                                  }
                                />
                                <Input
                                  value={adjustment.description ?? ""}
                                  onChange={(event) =>
                                    updateAdjustmentField(
                                      adjustment.id,
                                      "description",
                                      event.target.value || null
                                    )
                                  }
                                  placeholder="설명"
                                />
                              </div>
                            </td>
                            <td>
                              <Input
                                type="number"
                                value={adjustment.computedMin}
                                onChange={(event) =>
                                  updateAdjustmentField(
                                    adjustment.id,
                                    "computedMin",
                                    Number(event.target.value)
                                  )
                                }
                              />
                            </td>
                            <td>
                              <Input
                                type="number"
                                value={adjustment.computedMax}
                                onChange={(event) =>
                                  updateAdjustmentField(
                                    adjustment.id,
                                    "computedMax",
                                    Number(event.target.value)
                                  )
                                }
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </TableContainer>

                  <div className="grid gap-4 md:grid-cols-2">
                    <Card muted className="ui-stat-card p-5">
                      <p className="ui-kicker">금액 요약</p>
                      <div className="mt-4 space-y-2 text-sm text-text">
                        <SummaryRow label="기본 합계" value={formatRange(quote.serviceBaseMin, quote.serviceBaseMax)} />
                        <SummaryRow label="소계" value={formatRange(quote.subtotalMin, quote.subtotalMax)} />
                        <SummaryRow label="VAT" value={formatRange(quote.vatAmountMin, quote.vatAmountMax)} />
                        <SummaryRow
                          label="상담료"
                          value={
                            quote.consultFee > 0
                              ? `${formatCurrency(quote.consultFee)}원`
                              : "미적용"
                          }
                        />
                        <SummaryRow label="총액" value={formatRange(quote.totalMin, quote.totalMax)} emphasized />
                      </div>
                    </Card>

                    <Card muted className="ui-stat-card p-5">
                      <p className="ui-kicker">납입 구조</p>
                      <div className="mt-4 space-y-4">
                        {paymentPlans.map((plan) => (
                          <div key={plan.id} className="rounded-md border border-line bg-surface px-4 py-3">
                            <p className="text-sm font-semibold text-text-strong">
                              {stageKindLabels[plan.stageKind]}
                            </p>
                            <div className="mt-3 grid gap-3 sm:grid-cols-[110px_1fr]">
                              <Input
                                type="number"
                                value={plan.percentage}
                                onChange={(event) =>
                                  updatePaymentPlanField(
                                    plan.id,
                                    "percentage",
                                    Number(event.target.value)
                                  )
                                }
                              />
                              <Input
                                value={plan.dueText}
                                onChange={(event) =>
                                  updatePaymentPlanField(plan.id, "dueText", event.target.value)
                                }
                              />
                            </div>
                            <p className="mt-2 text-xs text-text-muted">
                              현재 계산 금액: {formatRange(plan.amountMin, plan.amountMax)}
                            </p>
                          </div>
                        ))}
                        {paymentPercentageTotal !== 100 ? (
                          <ErrorState
                            title="납입 비율 합계 확인"
                            description={`현재 합계는 ${paymentPercentageTotal}%입니다. 100%로 맞춰야 저장됩니다.`}
                          />
                        ) : null}
                      </div>
                    </Card>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="ui-section-title">AI 제안서 초안</h3>
                    <p className="ui-section-copy mt-2">
                      현재 문의와 견적 계산 결과를 바탕으로 고객 안내용 제안 문안과 내부 메모를
                      초안으로 생성합니다.
                    </p>
                  </div>
                  <Button variant="secondary" onClick={handleGenerateAiDraft} disabled={isPending}>
                    {isPending ? "생성 중..." : "AI 제안서 초안 생성"}
                  </Button>
                </div>

                {aiDraft ? (
                  <div className="mt-5 grid gap-4">
                    <Card muted className="ui-stat-card p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-text-strong">제안 헤드라인</p>
                        <Button
                          size="sm"
                          variant="secondary"
                          className="ui-toolbar-button"
                          onClick={() => handleCopyMessage(aiDraft.proposalHeadline, "제안 헤드라인")}
                        >
                          복사
                        </Button>
                      </div>
                      <p className="mt-3 text-sm text-text">{aiDraft.proposalHeadline}</p>
                    </Card>

                    <Card muted className="ui-stat-card p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-text-strong">고객 요약</p>
                        <Button
                          size="sm"
                          variant="secondary"
                          className="ui-toolbar-button"
                          onClick={() => handleCopyMessage(aiDraft.customerSummary, "고객 요약")}
                        >
                          복사
                        </Button>
                      </div>
                      <pre className="mt-3 whitespace-pre-wrap text-sm text-text">
                        {aiDraft.customerSummary}
                      </pre>
                    </Card>

                    <Card muted className="ui-stat-card p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-text-strong">업무 범위 설명</p>
                        <Button
                          size="sm"
                          variant="secondary"
                          className="ui-toolbar-button"
                          onClick={() => handleCopyMessage(aiDraft.scopeSummary, "업무 범위 설명")}
                        >
                          복사
                        </Button>
                      </div>
                      <pre className="mt-3 whitespace-pre-wrap text-sm text-text">
                        {aiDraft.scopeSummary}
                      </pre>
                    </Card>

                    <div className="grid gap-4 xl:grid-cols-2">
                      <Card muted className="ui-stat-card p-4">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-semibold text-text-strong">다음 단계 안내</p>
                          <Button
                            size="sm"
                            variant="secondary"
                            className="ui-toolbar-button"
                            onClick={() => handleCopyMessage(aiDraft.nextStepGuide, "다음 단계 안내")}
                          >
                            복사
                          </Button>
                        </div>
                        <pre className="mt-3 whitespace-pre-wrap text-sm text-text">
                          {aiDraft.nextStepGuide}
                        </pre>
                      </Card>

                      <Card muted className="ui-stat-card p-4">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-semibold text-text-strong">내부 메모</p>
                          <Button
                            size="sm"
                            variant="secondary"
                            className="ui-toolbar-button"
                            onClick={() => handleCopyMessage(aiDraft.internalMemo, "내부 메모")}
                          >
                            복사
                          </Button>
                        </div>
                        <pre className="mt-3 whitespace-pre-wrap text-sm text-text">
                          {aiDraft.internalMemo}
                        </pre>
                      </Card>
                    </div>
                  </div>
                ) : (
                  <EmptyState
                    title="AI 제안서 초안이 아직 없습니다."
                    description="견적 계산 결과가 정리된 뒤 버튼을 눌러 고객 안내용 문안과 내부 메모 초안을 생성할 수 있습니다."
                    className="mt-5"
                  />
                )}
              </Card>

              <Card className="p-6">
                <h3 className="ui-section-title">견적 발송/수락 메시지 초안</h3>
                <p className="ui-section-copy mt-2">
                  이메일·문자·알림톡 연동 전 단계에서 그대로 복사해 사용할 수 있는 관리자용 문구입니다.
                </p>
                <div className="mt-5 space-y-4">
                  <Card muted className="ui-stat-card p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-text-strong">견적 발송 안내 (KO)</p>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="ui-toolbar-button"
                        onClick={() => handleCopyMessage(quote.messageDrafts.quoteSendKo, "견적 발송 안내")}
                      >
                        복사
                      </Button>
                    </div>
                    <pre className="mt-3 whitespace-pre-wrap text-sm text-text">
                      {quote.messageDrafts.quoteSendKo}
                    </pre>
                  </Card>
                  <Card muted className="ui-stat-card p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-text-strong">수락 후 계약 준비 안내 (KO)</p>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="ui-toolbar-button"
                        onClick={() => handleCopyMessage(quote.messageDrafts.acceptedKo, "수락 안내")}
                      >
                        복사
                      </Button>
                    </div>
                    <pre className="mt-3 whitespace-pre-wrap text-sm text-text">
                      {quote.messageDrafts.acceptedKo}
                    </pre>
                  </Card>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="ui-section-title">계약 초안 및 사건 흐름</h3>
                <p className="ui-section-copy mt-2">
                  견적 수락 시 계약 초안과 사건 레코드가 자동 연결됩니다.
                </p>
                {quote.contractDraft ? (
                  <div className="mt-5 space-y-4">
                    <Card muted className="ui-stat-card p-5">
                      <p className="text-sm font-semibold text-text-strong">{quote.contractDraft.title}</p>
                      <p className="mt-2 text-xs text-text-muted">
                        마지막 업데이트: {new Date(quote.contractDraft.updatedAt).toLocaleString("ko-KR")}
                      </p>
                      <pre className="mt-4 whitespace-pre-wrap text-sm text-text">
                        {quote.contractDraft.bodyText}
                      </pre>
                    </Card>

                    <Card muted className="ui-stat-card p-5">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-text-strong">계약 / 결제 자동화</p>
                          <p className="mt-1 text-xs text-text-muted">
                            외부 전자계약·PG를 아직 안 붙여도 계약 링크와 결제 링크를 관리하면서 수임 전환 흐름을 이어갈 수 있습니다.
                          </p>
                        </div>
                        <Badge>{paymentCollectionStatusLabels[quote.contractDraft.paymentStatus]}</Badge>
                      </div>

                      <FieldGroup className="mt-4">
                        <Field label="계약 링크">
                          <Input
                            value={contractShareUrl}
                            onChange={(event) => setContractShareUrl(event.target.value)}
                            placeholder="예: 전자계약 또는 PDF 공유 링크"
                          />
                        </Field>
                        <Field label="결제 링크">
                          <Input
                            value={paymentLinkUrl}
                            onChange={(event) => setPaymentLinkUrl(event.target.value)}
                            placeholder="예: Toss / Stripe / 계좌안내 링크"
                          />
                        </Field>
                        <Field label="결제 수단 / 제공사">
                          <Input
                            value={paymentProvider}
                            onChange={(event) => setPaymentProvider(event.target.value)}
                            placeholder="예: Toss Payments, Stripe, 수기 계좌이체"
                          />
                        </Field>
                        <Field label="결제 상태">
                          <Select
                            value={paymentStatus}
                            onChange={(event) => setPaymentStatus(event.target.value as PaymentCollectionStatusValue)}
                          >
                            {Object.entries(paymentCollectionStatusLabels).map(([value, label]) => (
                              <option key={value} value={value}>
                                {label}
                              </option>
                            ))}
                          </Select>
                        </Field>
                        <Field label="입금 확인 / 거래 참고번호">
                          <Input
                            value={paymentReference}
                            onChange={(event) => setPaymentReference(event.target.value)}
                            placeholder="예: 입금자명, 거래번호, 내부 확인 메모"
                          />
                        </Field>
                        <Field label="계약/결제 메모">
                          <Textarea
                            rows={3}
                            value={paymentMemo}
                            onChange={(event) => setPaymentMemo(event.target.value)}
                            placeholder="예: 계약 링크 발송일, 유선 안내 내용, 결제 확인 메모"
                          />
                        </Field>
                      </FieldGroup>

                      <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
                        <Button variant="secondary" disabled={isPending} onClick={() => handleContractPaymentAutomation("sendContract")}>
                          계약 링크 발송 기록
                        </Button>
                        <Button variant="secondary" disabled={isPending} onClick={() => handleContractPaymentAutomation("markSigned")}>
                          계약 체결 처리
                        </Button>
                        <Button variant="secondary" disabled={isPending} onClick={() => handleContractPaymentAutomation("sendPayment")}>
                          결제 링크 발송 기록
                        </Button>
                        <Button variant="secondary" disabled={isPending} onClick={() => handleContractPaymentAutomation("savePayment")}>
                          결제 정보 저장
                        </Button>
                        <Button disabled={isPending} onClick={() => handleContractPaymentAutomation("markPaid")}>
                          입금 확인 후 사건 전환
                        </Button>
                      </div>

                      <div className="mt-4 grid gap-2 text-xs text-text-muted sm:grid-cols-2">
                        <p>계약 발송: {quote.contractDraft.contractSentAt ? new Date(quote.contractDraft.contractSentAt).toLocaleString("ko-KR") : "-"}</p>
                        <p>계약 체결: {quote.contractDraft.contractSignedAt ? new Date(quote.contractDraft.contractSignedAt).toLocaleString("ko-KR") : "-"}</p>
                        <p>결제 요청: {quote.contractDraft.paymentRequestedAt ? new Date(quote.contractDraft.paymentRequestedAt).toLocaleString("ko-KR") : "-"}</p>
                        <p>입금 확인: {quote.contractDraft.paidAt ? new Date(quote.contractDraft.paidAt).toLocaleString("ko-KR") : "-"}</p>
                      </div>
                    </Card>
                  </div>
                ) : (
                  <EmptyState
                    title="계약 초안이 아직 없습니다."
                    description="견적 초안이 확정되면 계약 초안 생성 버튼으로 납입 구조와 성공보수 제한 문구를 그대로 반영할 수 있습니다."
                    className="mt-5"
                  />
                )}

                {quote.caseRecord ? (
                  <Card muted className="ui-stat-card mt-4 p-5">
                    <p className="text-sm font-semibold text-text-strong">
                      사건번호: {quote.caseRecord.caseNumber}
                    </p>
                    <div className="mt-3 grid gap-2 text-sm text-text-muted sm:grid-cols-2">
                      <p>현재 단계: {caseStageLabels[quote.caseRecord.currentStage]}</p>
                      <p>예정일: {quote.caseRecord.dueDate ? quote.caseRecord.dueDate.slice(0, 10) : "-"}</p>
                      <p className="sm:col-span-2">
                        내부 메모: {quote.caseRecord.internalMemo || "-"}
                      </p>
                    </div>
                  </Card>
                ) : (
                  <EmptyState
                    title="사건 레코드가 아직 없습니다."
                    description="견적 수락(ACCEPTED) 상태로 변경하거나 계약 초안을 생성하면 사건번호가 생성됩니다."
                    className="mt-4"
                  />
                )}
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function InfoPanel({ label, value }: { label: string; value: string }) {
  return (
    <Card muted className="ui-stat-card p-4">
      <p className="ui-kicker">{label}</p>
      <p className="mt-2 text-sm font-medium text-text-strong">{value}</p>
    </Card>
  );
}

function SummaryRow({
  label,
  value,
  emphasized = false
}: {
  label: string;
  value: string;
  emphasized?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-text-muted">{label}</span>
      <span className={emphasized ? "font-semibold text-text-strong" : "text-text-strong"}>{value}</span>
    </div>
  );
}
