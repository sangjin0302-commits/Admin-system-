"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  CollapsibleSection,
  FieldBlock,
  InfoPanel,
} from "@/components/admin/quote-workspace-ui";
import {
  QuoteAnalysisSection,
  QuoteContractSection,
  QuoteMessagesSection,
  QuoteSummarySection
} from "@/components/admin/quote-workspace-sections";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { EmptyState, StateInline } from "@/components/ui/state-panel";
import { Textarea } from "@/components/ui/textarea";
import { parseClientApiError } from "@/lib/http/client-api";
import { formatCurrency } from "@/lib/quote-engine/utils";
import type { QuoteSummarySnapshot, QuoteWorkspace } from "@/lib/quote-engine/types";
import {
  buildActionChecklist,
  buildActionTemplates,
  buildCaseAnalysisDraft,
  buildLawbotAnalysisDraft,
  buildRecommendedSpecialTerms,
  caseStageLabels,
  formatRange,
  quoteStatusLabels,
  stageKindLabels
} from "@/lib/services/quote-workspace-helpers";

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

  async function readQuotePayload(
    response: Response,
    fallbackMessage: string
  ): Promise<{ ok: true; quote: QuoteSummarySnapshot } | { ok: false; message: string }> {
    if (!response.ok) {
      return {
        ok: false,
        message: await parseClientApiError(response, fallbackMessage)
      };
    }

    const payload = (await response.json().catch(() => null)) as { quote?: QuoteSummarySnapshot } | null;
    if (!payload?.quote) {
      return {
        ok: false,
        message: "서버 응답 형식이 올바르지 않아 처리하지 못했습니다."
      };
    }

    return {
      ok: true,
      quote: payload.quote
    };
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
      try {
        const response = await fetch(`/api/admin/inquiries/${inquiryId}/quotes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ create: true })
        });
        const parsed = await readQuotePayload(response, "견적 초안을 만들지 못했습니다.");
        if (!parsed.ok) {
          setFeedback(parsed.message, "error");
          return;
        }
        applyQuote(parsed.quote);
        setFeedback("견적 초안을 생성했습니다.", "success");
        router.refresh();
      } catch {
        setFeedback("견적 초안 생성 중 네트워크 오류가 발생했습니다.", "error");
        return;
      }
    });
  }

  async function handleRecalculate() {
    if (!quote) return;
    setFeedback("", "default");
    startTransition(async () => {
      try {
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
              paymentPlans.map((plan) => [plan.stageKind, { percentage: Number(plan.percentage), dueText: plan.dueText }])
            )
          })
        });
        const parsed = await readQuotePayload(response, "견적을 다시 계산하지 못했습니다.");
        if (!parsed.ok) {
          setFeedback(parsed.message, "error");
          return;
        }
        applyQuote(parsed.quote);
        setFeedback("견적 계산을 갱신했습니다.", "success");
        router.refresh();
      } catch {
        setFeedback("견적 계산 중 네트워크 오류가 발생했습니다.", "error");
        return;
      }
    });
  }

  async function handleSaveManualEdits() {
    if (!quote) return;
    setFeedback("", "default");
    startTransition(async () => {
      try {
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
        const parsed = await readQuotePayload(response, "수정 내용을 저장하지 못했습니다.");
        if (!parsed.ok) {
          setFeedback(parsed.message, "error");
          return;
        }
        applyQuote(parsed.quote);
        setFeedback("수정 내용을 저장했습니다.", "success");
        router.refresh();
      } catch {
        setFeedback("수정 내용 저장 중 네트워크 오류가 발생했습니다.", "error");
        return;
      }
    });
  }

  async function handleCreateContractDraft() {
    if (!quote) return;
    setFeedback("", "default");
    startTransition(async () => {
      try {
        const response = await fetch(`/api/admin/quotes/${quote.id}/contract-draft`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ create: true })
        });
        const parsed = await readQuotePayload(response, "계약 초안을 만들지 못했습니다.");
        if (!parsed.ok) {
          setFeedback(parsed.message, "error");
          return;
        }
        applyQuote(parsed.quote);
        setFeedback("계약 초안을 생성했습니다.", "success");
        router.refresh();
      } catch {
        setFeedback("계약 초안 생성 중 네트워크 오류가 발생했습니다.", "error");
        return;
      }
    });
  }

  async function handleUpdateQuoteStatus() {
    if (!quote) return;
    setFeedback("", "default");
    startTransition(async () => {
      try {
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
        const parsed = await readQuotePayload(response, "상태를 바꾸지 못했습니다.");
        if (!parsed.ok) {
          setFeedback(parsed.message, "error");
          return;
        }
        applyQuote(parsed.quote);
        setFeedback("상태를 반영했습니다.", "success");
        router.refresh();
      } catch {
        setFeedback("상태 반영 중 네트워크 오류가 발생했습니다.", "error");
        return;
      }
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

          <QuoteAnalysisSection
            workspace={workspace}
            caseAnalysisDraft={caseAnalysisDraft}
            lawbotAnalysisDraft={lawbotAnalysisDraft}
            actionChecklist={actionChecklist}
            actionTemplates={actionTemplates}
            onAppendDraftNotes={() =>
              setDraftNotes((current) => {
                const sections = [current?.trim(), caseAnalysisDraft, lawbotAnalysisDraft].filter(Boolean);
                return sections.join("\n\n");
              })
            }
            onCopyMessage={handleCopyMessage}
          />

          <QuoteSummarySection quote={quote} />

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

          <QuoteContractSection
            quote={quote}
            quoteStatus={quoteStatus}
            caseDueDate={caseDueDate}
            caseInternalMemo={caseInternalMemo}
            specialTerms={specialTerms}
            recommendedSpecialTerms={recommendedSpecialTerms}
            isPending={isPending}
            onQuoteStatusChange={setQuoteStatus}
            onCaseDueDateChange={setCaseDueDate}
            onCaseInternalMemoChange={setCaseInternalMemo}
            onSpecialTermsChange={setSpecialTerms}
            onAppendSpecialTerms={() =>
              setSpecialTerms((current) => [current?.trim(), recommendedSpecialTerms].filter(Boolean).join("\n\n"))
            }
            onUpdateStatus={handleUpdateQuoteStatus}
            onCreateContractDraft={handleCreateContractDraft}
          />

          <CollapsibleSection
            id="quote-messages"
            title="안내 문구"
            description="카카오톡, 이메일, 상담 안내에 바로 붙여 쓸 문구입니다."
            open={showMessages}
            onToggle={() => setShowMessages((current) => !current)}
          >
            <QuoteMessagesSection quote={quote} onCopyMessage={handleCopyMessage} />
          </CollapsibleSection>

          {message ? <StateInline tone={tone}>{message}</StateInline> : null}
        </>
      )}
    </div>
  );
}

