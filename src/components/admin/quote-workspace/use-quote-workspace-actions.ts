"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

import { parseClientApiError } from "@/lib/http/client-api";
import type { QuoteSummarySnapshot } from "@/lib/quote-engine/types";

type Tone = "default" | "success" | "error";

type ActionsState = {
  inquiryId: string;
  quote: QuoteSummarySnapshot | null;
  selectedServices: string[];
  selectedOptions: string[];
  urgencyRuleCode: string;
  consultRuleCode: string;
  paymentRuleCode: string;
  rangeMode: boolean;
  draftNotes: string;
  specialTerms: string;
  quoteStatus: QuoteSummarySnapshot["status"];
  caseDueDate: string;
  caseInternalMemo: string;
  lineItems: QuoteSummarySnapshot["lineItems"];
  adjustments: QuoteSummarySnapshot["adjustments"];
  paymentPlans: QuoteSummarySnapshot["paymentPlans"];
  applyQuote: (next: QuoteSummarySnapshot) => void;
  setFeedback: (message: string, tone: Tone) => void;
};

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

  return { ok: true, quote: payload.quote };
}

export function useQuoteWorkspaceActions(state: ActionsState) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  async function handleCreateQuote() {
    state.setFeedback("", "default");
    startTransition(async () => {
      try {
        const response = await fetch(`/api/admin/inquiries/${state.inquiryId}/quotes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ create: true })
        });
        const parsed = await readQuotePayload(response, "견적 초안을 만들지 못했습니다.");
        if (!parsed.ok) {
          state.setFeedback(parsed.message, "error");
          return;
        }
        state.applyQuote(parsed.quote);
        state.setFeedback("견적 초안을 생성했습니다.", "success");
        router.refresh();
      } catch {
        state.setFeedback("견적 초안 생성 중 네트워크 오류가 발생했습니다.", "error");
        return;
      }
    });
  }

  async function handleRecalculate() {
    if (!state.quote) return;
    state.setFeedback("", "default");
    startTransition(async () => {
      try {
        const response = await fetch(`/api/admin/quotes/${state.quote!.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode: "recalculate",
            selectedServiceLegacyIds: state.selectedServices,
            selectedOptionLegacyIds: state.selectedOptions,
            urgencyRuleCode: state.urgencyRuleCode,
            consultRuleCode: state.consultRuleCode,
            paymentRuleCode: state.paymentRuleCode,
            rangeMode: state.rangeMode,
            draftNotes: state.draftNotes,
            stageOverrides: Object.fromEntries(
              state.paymentPlans.map((plan) => [plan.stageKind, { percentage: Number(plan.percentage), dueText: plan.dueText }])
            )
          })
        });
        const parsed = await readQuotePayload(response, "견적을 다시 계산하지 못했습니다.");
        if (!parsed.ok) {
          state.setFeedback(parsed.message, "error");
          return;
        }
        state.applyQuote(parsed.quote);
        state.setFeedback("견적 계산을 갱신했습니다.", "success");
        router.refresh();
      } catch {
        state.setFeedback("견적 계산 중 네트워크 오류가 발생했습니다.", "error");
        return;
      }
    });
  }

  async function handleSaveManualEdits() {
    if (!state.quote) return;
    state.setFeedback("", "default");
    startTransition(async () => {
      try {
        const response = await fetch(`/api/admin/quotes/${state.quote!.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode: "manual",
            draftNotes: state.draftNotes,
            specialTerms: state.quote!.contractDraft ? state.specialTerms : undefined,
            lineItems: state.lineItems.map((line, index) => ({
              id: line.id,
              label: line.label,
              description: line.description,
              amountMin: Number(line.amountMin),
              amountMax: Number(line.amountMax),
              sortOrder: index
            })),
            adjustments: state.adjustments.map((adjustment, index) => ({
              id: adjustment.id,
              label: adjustment.label,
              description: adjustment.description,
              computedMin: Number(adjustment.computedMin),
              computedMax: Number(adjustment.computedMax),
              sortOrder: index
            })),
            paymentPlans: state.paymentPlans.map((plan, index) => ({
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
          state.setFeedback(parsed.message, "error");
          return;
        }
        state.applyQuote(parsed.quote);
        state.setFeedback("수정 내용을 저장했습니다.", "success");
        router.refresh();
      } catch {
        state.setFeedback("수정 내용 저장 중 네트워크 오류가 발생했습니다.", "error");
        return;
      }
    });
  }

  async function handleCreateContractDraft() {
    if (!state.quote) return;
    state.setFeedback("", "default");
    startTransition(async () => {
      try {
        const response = await fetch(`/api/admin/quotes/${state.quote!.id}/contract-draft`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ create: true })
        });
        const parsed = await readQuotePayload(response, "계약 초안을 만들지 못했습니다.");
        if (!parsed.ok) {
          state.setFeedback(parsed.message, "error");
          return;
        }
        state.applyQuote(parsed.quote);
        state.setFeedback("계약 초안을 생성했습니다.", "success");
        router.refresh();
      } catch {
        state.setFeedback("계약 초안 생성 중 네트워크 오류가 발생했습니다.", "error");
        return;
      }
    });
  }

  async function handleUpdateQuoteStatus() {
    if (!state.quote) return;
    state.setFeedback("", "default");
    startTransition(async () => {
      try {
        const response = await fetch(`/api/admin/quotes/${state.quote!.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode: "status",
            status: state.quoteStatus,
            caseDueDate: state.caseDueDate,
            caseInternalMemo: state.caseInternalMemo
          })
        });
        const parsed = await readQuotePayload(response, "상태를 바꾸지 못했습니다.");
        if (!parsed.ok) {
          state.setFeedback(parsed.message, "error");
          return;
        }
        state.applyQuote(parsed.quote);
        state.setFeedback("상태를 반영했습니다.", "success");
        router.refresh();
      } catch {
        state.setFeedback("상태 반영 중 네트워크 오류가 발생했습니다.", "error");
        return;
      }
    });
  }

  return {
    isPending,
    handleCreateQuote,
    handleRecalculate,
    handleSaveManualEdits,
    handleCreateContractDraft,
    handleUpdateQuoteStatus,
  };
}
