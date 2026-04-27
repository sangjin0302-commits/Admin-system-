"use client";

import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatDateTime } from "@/lib/utils";
import {
  buildLawbotReviewReadonlyUiModel,
  type LawbotReviewReadonlyUiModel
} from "@/lib/services/lawbot-review-readonly-ui-model";

type LoadingState = "idle" | "loading" | "loaded" | "error";

function StatusCard({ model }: { model: LawbotReviewReadonlyUiModel }) {
  return (
    <Card muted className="p-5">
      <p className="ui-kicker">Lawbot Review Summary</p>
      <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-xl border border-line/80 bg-white px-3 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted">
            workflowStatus
          </p>
          <p className="mt-1 text-sm font-semibold text-text-strong">{model.workflowStatus}</p>
        </div>
        <div className="rounded-xl border border-line/80 bg-white px-3 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted">
            executionStatus
          </p>
          <p className="mt-1 text-sm font-semibold text-text-strong">{model.executionStatus}</p>
        </div>
        <div className="rounded-xl border border-line/80 bg-white px-3 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted">
            caseNumber
          </p>
          <p className="mt-1 text-sm font-semibold text-text-strong">{model.caseNumber ?? "-"}</p>
        </div>
        <div className="rounded-xl border border-line/80 bg-white px-3 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted">
            reviewRequired
          </p>
          <p className="mt-1 text-sm font-semibold text-text-strong">
            {model.reviewRequired ? "true" : "false"}
          </p>
        </div>
        <div className="rounded-xl border border-line/80 bg-white px-3 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted">
            updatedAt
          </p>
          <p className="mt-1 text-sm font-semibold text-text-strong">{formatDateTime(model.updatedAt)}</p>
        </div>
      </div>
      <p className="mt-3 text-sm text-text-muted">{model.executionSummary}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Badge className="border-line-strong bg-surface text-text-strong">inquiryId: {model.inquiryId}</Badge>
        <Badge className="border-line-strong bg-surface text-text-strong">
          caseId: {model.caseId ?? "-"}
        </Badge>
      </div>
    </Card>
  );
}

function ApprovalGateCard({ model }: { model: LawbotReviewReadonlyUiModel }) {
  return (
    <Card muted className="p-5">
      <p className="ui-kicker">Approval Gate</p>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-line/80 bg-white px-3 py-3">
          <p className="text-xs text-text-muted">approvalRequired</p>
          <p className="mt-1 text-sm font-semibold text-text-strong">
            {model.approvalGate.approvalRequired ? "true" : "false"}
          </p>
        </div>
        <div className="rounded-xl border border-line/80 bg-white px-3 py-3">
          <p className="text-xs text-text-muted">externalActionAllowed</p>
          <p className="mt-1 text-sm font-semibold text-text-strong">
            {model.approvalGate.externalActionAllowed ? "true" : "false"}
          </p>
        </div>
      </div>
      <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
        {model.readonlyNotice}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {model.approvalGate.reasonCodes.length > 0 ? (
          model.approvalGate.reasonCodes.map((reason) => (
            <Badge key={reason} className="border-line-strong bg-surface text-text-strong">
              {reason}
            </Badge>
          ))
        ) : (
          <span className="text-sm text-text-muted">reasonCodes 없음</span>
        )}
      </div>
    </Card>
  );
}

function ReviewSignalsCard({ model }: { model: LawbotReviewReadonlyUiModel }) {
  return (
    <Card muted className="p-5">
      <p className="ui-kicker">Review Signals</p>
      <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-line/80 bg-white px-3 py-3">
          <p className="text-xs text-text-muted">mustVerifyCount</p>
          <p className="mt-1 text-sm font-semibold text-text-strong">
            {model.reviewSignals.mustVerifyCount}
          </p>
        </div>
        <div className="rounded-xl border border-line/80 bg-white px-3 py-3">
          <p className="text-xs text-text-muted">mustVerifySourcesCount</p>
          <p className="mt-1 text-sm font-semibold text-text-strong">
            {model.reviewSignals.mustVerifySourcesCount}
          </p>
        </div>
        <div className="rounded-xl border border-line/80 bg-white px-3 py-3">
          <p className="text-xs text-text-muted">riskFlagsCount</p>
          <p className="mt-1 text-sm font-semibold text-text-strong">
            {model.reviewSignals.riskFlagsCount}
          </p>
        </div>
        <div className="rounded-xl border border-line/80 bg-white px-3 py-3">
          <p className="text-xs text-text-muted">sourceVerificationChecklist.totalRequired</p>
          <p className="mt-1 text-sm font-semibold text-text-strong">
            {model.reviewSignals.sourceVerificationChecklist.totalRequired}
          </p>
        </div>
      </div>
    </Card>
  );
}

function ReviewQueueCard({ model }: { model: LawbotReviewReadonlyUiModel }) {
  return (
    <Card muted className="p-5">
      <p className="ui-kicker">Review Queue</p>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-line/80 bg-white px-3 py-3">
          <p className="text-xs text-text-muted">totalDrafts</p>
          <p className="mt-1 text-sm font-semibold text-text-strong">{model.reviewQueue.totalDrafts}</p>
        </div>
        <div className="rounded-xl border border-line/80 bg-white px-3 py-3">
          <p className="text-xs text-text-muted">approvalPendingDrafts</p>
          <p className="mt-1 text-sm font-semibold text-text-strong">
            {model.reviewQueue.approvalPendingDrafts}
          </p>
        </div>
      </div>
    </Card>
  );
}

function DraftList({
  title,
  items
}: {
  title: string;
  items: LawbotReviewReadonlyUiModel["reviewQueue"]["documentDrafts"];
}) {
  return (
    <Card muted className="p-5">
      <p className="ui-kicker">{title}</p>
      {items.length === 0 ? (
        <p className="mt-3 text-sm text-text-muted">데이터가 없습니다.</p>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-text-muted">
                <th className="py-2 font-medium">id</th>
                <th className="py-2 font-medium">status</th>
                <th className="py-2 font-medium">reviewRequired</th>
                <th className="py-2 font-medium">createdAt</th>
                <th className="py-2 font-medium">updatedAt</th>
              </tr>
            </thead>
            <tbody>
              {items.map((draft) => (
                <tr key={draft.id} className="border-b border-line/70 text-text-strong last:border-b-0">
                  <td className="py-2">{draft.id}</td>
                  <td className="py-2">{draft.status}</td>
                  <td className="py-2">{draft.reviewRequired ? "true" : "false"}</td>
                  <td className="py-2">{formatDateTime(draft.createdAt)}</td>
                  <td className="py-2">{formatDateTime(draft.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

export function LawbotReviewReadonlyClient({ inquiryId }: { inquiryId: string }) {
  const [state, setState] = useState<LoadingState>("idle");
  const [model, setModel] = useState<LawbotReviewReadonlyUiModel | null>(null);

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

  useEffect(() => {
    void load();
  }, [inquiryId]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="ui-kicker">Lawbot Review (Read-Only)</p>
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
          <ReviewSignalsCard model={model} />
          <ReviewQueueCard model={model} />
          <DraftList title="documentDrafts" items={model.reviewQueue.documentDrafts} />
          <DraftList title="messageDrafts" items={model.reviewQueue.messageDrafts} />
        </>
      ) : state === "loading" || state === "idle" ? (
        <Card muted className="p-5">
          <p className="text-sm text-text-muted">리뷰 정보를 불러오는 중입니다.</p>
        </Card>
      ) : (
        <Card muted className="p-5">
          <p className="text-sm text-text-muted">데이터가 없습니다.</p>
        </Card>
      )}
    </div>
  );
}
