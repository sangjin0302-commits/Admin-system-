"use client";

import { useMemo, useState } from "react";

import { CollapsibleSection } from "@/components/admin/quote-workspace-ui";
import {
  QuoteAnalysisSection,
  QuoteContractSection,
  QuoteMessagesSection,
  QuoteSummarySection
} from "@/components/admin/quote-workspace-sections";
import { QuoteConditionsPanel } from "@/components/admin/quote-workspace/quote-conditions-panel";
import { QuoteEmptyStateCard } from "@/components/admin/quote-workspace/quote-empty-state-card";
import { QuoteItemsPanel } from "@/components/admin/quote-workspace/quote-items-panel";
import { QuotePaymentPlansPanel } from "@/components/admin/quote-workspace/quote-payment-plans-panel";
import { QuoteShortcutBar } from "@/components/admin/quote-workspace/quote-shortcut-bar";
import { useQuoteWorkspaceActions } from "@/components/admin/quote-workspace/use-quote-workspace-actions";
import { StateInline } from "@/components/ui/state-panel";
import type { QuoteSummarySnapshot, QuoteWorkspace } from "@/lib/quote-engine/types";
import {
  buildActionChecklist,
  buildActionTemplates,
  buildCaseAnalysisDraft,
  buildLawbotAnalysisDraft,
  buildRecommendedSpecialTerms
} from "@/lib/services/quote-workspace-helpers";

type QuoteWorkspaceProps = {
  inquiryId: string;
  workspace: QuoteWorkspace;
  operationsSettings?: unknown;
};

export function QuoteWorkspacePanel({ inquiryId, workspace }: QuoteWorkspaceProps) {
  const [quote, setQuote] = useState<QuoteSummarySnapshot | null>(workspace.latestQuote);
  const [message, setMessage] = useState("");
  const [tone, setTone] = useState<"default" | "success" | "error">("default");

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
    if (!normalizedServiceSearch) return groupedServices;
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
    if (!normalizedOptionSearch) return workspace.masters.pricingOptions;
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

  const {
    isPending,
    handleCreateQuote,
    handleRecalculate,
    handleSaveManualEdits,
    handleCreateContractDraft,
    handleUpdateQuoteStatus,
  } = useQuoteWorkspaceActions({
    inquiryId,
    quote,
    selectedServices,
    selectedOptions,
    urgencyRuleCode,
    consultRuleCode,
    paymentRuleCode,
    rangeMode,
    draftNotes,
    specialTerms,
    quoteStatus,
    caseDueDate,
    caseInternalMemo,
    lineItems,
    adjustments,
    paymentPlans,
    applyQuote,
    setFeedback,
  });

  function toggleSelection(values: string[], setValues: (next: string[]) => void, target: string) {
    if (values.includes(target)) {
      setValues(values.filter((value) => value !== target));
      return;
    }
    setValues([...values, target]);
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
        <QuoteEmptyStateCard
          workspace={workspace}
          isPending={isPending}
          message={message}
          tone={tone}
          onCreateQuote={handleCreateQuote}
        />
      ) : (
        <>
          <QuoteShortcutBar />

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

          <QuoteConditionsPanel
            workspace={workspace}
            filteredGroupedServices={filteredGroupedServices}
            filteredOptions={filteredOptions}
            selectedServices={selectedServices}
            selectedOptions={selectedOptions}
            serviceSearch={serviceSearch}
            optionSearch={optionSearch}
            urgencyRuleCode={urgencyRuleCode}
            consultRuleCode={consultRuleCode}
            paymentRuleCode={paymentRuleCode}
            rangeMode={rangeMode}
            draftNotes={draftNotes}
            isPending={isPending}
            open={showConditions}
            onToggle={() => setShowConditions((current) => !current)}
            onServiceSearchChange={setServiceSearch}
            onOptionSearchChange={setOptionSearch}
            onToggleService={(legacyId) => toggleSelection(selectedServices, setSelectedServices, legacyId)}
            onToggleOption={(legacyId) => toggleSelection(selectedOptions, setSelectedOptions, legacyId)}
            onUrgencyRuleChange={setUrgencyRuleCode}
            onConsultRuleChange={setConsultRuleCode}
            onPaymentRuleChange={setPaymentRuleCode}
            onRangeModeChange={setRangeMode}
            onDraftNotesChange={setDraftNotes}
            onRecalculate={handleRecalculate}
            onSaveManualEdits={handleSaveManualEdits}
          />

          <QuoteItemsPanel
            lineItems={lineItems}
            adjustments={adjustments}
            open={showItems}
            onToggle={() => setShowItems((current) => !current)}
            updateLineField={updateLineField}
            updateAdjustmentField={updateAdjustmentField}
          />

          <QuotePaymentPlansPanel
            paymentPlans={paymentPlans}
            paymentPercentageTotal={paymentPercentageTotal}
            open={showPaymentPlans}
            onToggle={() => setShowPaymentPlans((current) => !current)}
            updatePaymentPlanField={updatePaymentPlanField}
          />

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
