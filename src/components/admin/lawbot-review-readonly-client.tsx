"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  buildLawbotReviewReadonlyUiModel,
  type LawbotReviewReadonlyUiModel
} from "@/lib/services/lawbot-review-readonly-ui-model";
import {
  areLawbotApprovalChecksComplete,
  buildLawbotApprovalRequestBody,
  type LawbotReviewApprovalChecks
} from "@/lib/services/lawbot-review-approval-ui-model";
import {
  buildLawbotMessageSendReadinessUiModel,
  type LawbotMessageSendReadinessUiModel
} from "@/lib/services/lawbot-message-send-readiness-ui-model";

import { InternalApprovalPanel } from "./lawbot-review/internal-approval-panel";
import { MessageSendReadinessPanel } from "./lawbot-review/message-send-readiness-panel";
import { LoadingState } from "./lawbot-review/shared";
import {
  ApprovalGateCard,
  DraftList,
  ReviewQueueCard,
  ReviewSignalsCard,
  StatusCard
} from "./lawbot-review/status-cards";

export function LawbotReviewReadonlyClient({ inquiryId }: { inquiryId: string }) {
  const [state, setState] = useState<LoadingState>("idle");
  const [model, setModel] = useState<LawbotReviewReadonlyUiModel | null>(null);
  const [sendReadinessState, setSendReadinessState] = useState<LoadingState>("idle");
  const [sendReadinessModel, setSendReadinessModel] =
    useState<LawbotMessageSendReadinessUiModel | null>(null);
  const [sendReadinessError, setSendReadinessError] = useState<string | null>(null);
  const [approvalChecks, setApprovalChecks] = useState<LawbotReviewApprovalChecks>({
    manualReviewChecked: false,
    sourcesChecked: false,
    riskFlagsChecked: false,
    draftsReviewed: false
  });
  const [operatorNote, setOperatorNote] = useState("");
  const [approvalError, setApprovalError] = useState<string | null>(null);
  const [approvalProcessing, setApprovalProcessing] = useState(false);

  async function load() {
    setState("loading");
    try {
      const response = await fetch(`/api/admin/inquiries/${encodeURIComponent(inquiryId)}/lawbot-review`, {
        method: "GET",
        cache: "no-store"
      });

      if (!response.ok) {
        throw new Error("failed-to-load");
      }

      const payload = (await response.json()) as { result?: unknown };
      const nextModel = buildLawbotReviewReadonlyUiModel(payload.result ?? null);
      if (!nextModel) {
        throw new Error("invalid-response");
      }

      setModel(nextModel);
      setState("loaded");
    } catch {
      setState("error");
    }
  }

  async function loadMessageSendReadiness() {
    setSendReadinessState("loading");
    setSendReadinessError(null);
    try {
      const response = await fetch(
        `/api/admin/inquiries/${encodeURIComponent(inquiryId)}/lawbot-review/message-send-readiness`,
        {
          method: "GET",
          cache: "no-store"
        }
      );

      if (!response.ok) {
        throw new Error("failed-to-load-send-readiness");
      }

      const payload = (await response.json()) as { result?: unknown };
      const nextModel = buildLawbotMessageSendReadinessUiModel(payload.result ?? null);
      if (!nextModel) {
        throw new Error("invalid-send-readiness-response");
      }

      setSendReadinessModel(nextModel);
      setSendReadinessState("loaded");
    } catch {
      setSendReadinessError("메시지 발송 준비 상태를 불러오지 못했습니다.");
      setSendReadinessState("error");
    }
  }

  async function processInternalApproval() {
    if (!model || !areLawbotApprovalChecksComplete(approvalChecks)) {
      return;
    }

    const confirmed = window.confirm(
      "내부 승인 처리하시겠습니까? 이 작업은 발송/제출을 실행하지 않습니다."
    );
    if (!confirmed) {
      return;
    }

    setApprovalProcessing(true);
    setApprovalError(null);
    try {
      const response = await fetch(
        `/api/admin/inquiries/${encodeURIComponent(inquiryId)}/lawbot-review/approve`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(buildLawbotApprovalRequestBody(approvalChecks, operatorNote))
        }
      );

      if (!response.ok) {
        throw new Error("approval-failed");
      }

      const payload = (await response.json()) as { result?: unknown };
      const nextModel = buildLawbotReviewReadonlyUiModel(payload.result ?? null);
      if (!nextModel) {
        throw new Error("invalid-approval-response");
      }

      setModel(nextModel);
      setApprovalChecks({
        manualReviewChecked: false,
        sourcesChecked: false,
        riskFlagsChecked: false,
        draftsReviewed: false
      });
      setOperatorNote("");
      setState("loaded");
    } catch {
      setApprovalError("내부 승인 처리에 실패했습니다. 상태를 확인한 뒤 다시 시도하세요.");
    } finally {
      setApprovalProcessing(false);
    }
  }

  useEffect(() => {
    void load();
    void loadMessageSendReadiness();
  }, [inquiryId]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="ui-kicker">Lawbot 리뷰 (읽기 전용)</p>
          <h1 className="mt-1 text-2xl font-semibold text-text-strong">Lawbot 리뷰 결과</h1>
        </div>
        <Button variant="secondary" onClick={() => void load()} disabled={state === "loading"}>
          {state === "loading" ? "불러오는 중..." : "새로고침"}
        </Button>
      </div>

      {state === "error" && !model ? (
        <Card muted className="p-5">
          <p className="text-sm text-text-muted">리뷰 정보를 불러오지 못했습니다.</p>
        </Card>
      ) : null}

      {model ? (
        <>
          <StatusCard model={model} />
          <ApprovalGateCard model={model} />
          <MessageSendReadinessPanel
            model={sendReadinessModel}
            state={sendReadinessState}
            error={sendReadinessError}
            onRefresh={() => void loadMessageSendReadiness()}
          />
          <InternalApprovalPanel
            model={model}
            checks={approvalChecks}
            operatorNote={operatorNote}
            error={approvalError}
            processing={approvalProcessing}
            onCheckChange={(key, value) =>
              setApprovalChecks((current) => ({
                ...current,
                [key]: value
              }))
            }
            onOperatorNoteChange={setOperatorNote}
            onProcess={() => void processInternalApproval()}
          />
          <ReviewSignalsCard model={model} />
          <ReviewQueueCard model={model} />
          <DraftList title="문안 초안" items={model.reviewQueue.documentDrafts} />
          <DraftList title="연락문 초안" items={model.reviewQueue.messageDrafts} />
        </>
      ) : state === "loading" || state === "idle" ? (
        <Card muted className="p-5">
          <p className="text-sm text-text-muted">리뷰 정보를 불러오는 중입니다.</p>
        </Card>
      ) : (
        <Card muted className="p-5">
          <p className="text-sm text-text-muted">표시할 데이터가 없습니다.</p>
        </Card>
      )}
    </div>
  );
}
