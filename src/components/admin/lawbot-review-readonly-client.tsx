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

function toStatusBadgeTone(status: string) {
  const normalized = status.trim().toUpperCase();
  if (normalized === "SUCCESS") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  if (normalized.includes("APPROVAL_PENDING")) {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }
  if (normalized.includes("FAILED") || normalized.includes("ERROR")) {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }
  return "border-line-strong bg-surface text-text-strong";
}

function BooleanBadge({ value }: { value: boolean }) {
  return (
    <Badge
      className={
        value ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-line-strong bg-surface text-text-strong"
      }
    >
      {value ? "예" : "아니오"}
    </Badge>
  );
}

function StatusCard({ model }: { model: LawbotReviewReadonlyUiModel }) {
  return (
    <Card muted className="p-5">
      <p className="ui-kicker">Lawbot 리뷰 요약</p>
      <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-xl border border-line/80 bg-white px-3 py-3">
          <p className="text-[11px] font-semibold tracking-[0.02em] text-text-muted">워크플로 상태</p>
          <div className="mt-1">
            <Badge className={toStatusBadgeTone(model.workflowStatus)}>{model.workflowStatus}</Badge>
          </div>
        </div>
        <div className="rounded-xl border border-line/80 bg-white px-3 py-3">
          <p className="text-[11px] font-semibold tracking-[0.02em] text-text-muted">실행 상태</p>
          <div className="mt-1">
            <Badge className={toStatusBadgeTone(model.executionStatus)}>{model.executionStatus}</Badge>
          </div>
        </div>
        <div className="rounded-xl border border-line/80 bg-white px-3 py-3">
          <p className="text-[11px] font-semibold tracking-[0.02em] text-text-muted">사건 번호</p>
          <p className="mt-1 text-sm font-semibold text-text-strong">{model.caseNumber ?? "-"}</p>
        </div>
        <div className="rounded-xl border border-line/80 bg-white px-3 py-3">
          <p className="text-[11px] font-semibold tracking-[0.02em] text-text-muted">검토 필요</p>
          <div className="mt-1">
            <BooleanBadge value={model.reviewRequired} />
          </div>
        </div>
        <div className="rounded-xl border border-line/80 bg-white px-3 py-3">
          <p className="text-[11px] font-semibold tracking-[0.02em] text-text-muted">최근 업데이트</p>
          <p className="mt-1 text-sm font-semibold text-text-strong">{formatDateTime(model.updatedAt)}</p>
        </div>
      </div>
      <p className="mt-3 text-sm text-text-muted">{model.executionSummary}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Badge className="border-line-strong bg-surface text-text-strong">문의 ID: {model.inquiryId}</Badge>
        <Badge className="border-line-strong bg-surface text-text-strong">사건 ID: {model.caseId ?? "-"}</Badge>
      </div>
    </Card>
  );
}

function ApprovalGateCard({ model }: { model: LawbotReviewReadonlyUiModel }) {
  return (
    <Card muted className="p-5">
      <p className="ui-kicker">승인 게이트</p>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-line/80 bg-white px-3 py-3">
          <p className="text-xs text-text-muted">관리자 승인 필요</p>
          <div className="mt-1">
            <BooleanBadge value={model.approvalGate.approvalRequired} />
          </div>
        </div>
        <div className="rounded-xl border border-line/80 bg-white px-3 py-3">
          <p className="text-xs text-text-muted">외부 실행 허용</p>
          <div className="mt-1">
            <BooleanBadge value={model.approvalGate.externalActionAllowed} />
          </div>
        </div>
      </div>
      <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
        {model.readonlyNotice}
      </p>
      <p className="mt-3 text-xs font-semibold tracking-[0.02em] text-text-muted">승인 제한 사유</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {model.approvalGate.reasonCodes.length > 0 ? (
          model.approvalGate.reasonCodes.map((reason) => (
            <Badge key={reason} className="border-line-strong bg-surface text-text-strong">
              {reason}
            </Badge>
          ))
        ) : (
          <span className="text-sm text-text-muted">승인 제한 사유 없음</span>
        )}
      </div>
    </Card>
  );
}

function ReviewSignalsCard({ model }: { model: LawbotReviewReadonlyUiModel }) {
  return (
    <Card muted className="p-5">
      <p className="ui-kicker">리뷰 신호 요약</p>
      <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-line/80 bg-white px-3 py-3">
          <p className="text-xs text-text-muted">수동 검토 항목</p>
          <p className="mt-1 text-sm font-semibold text-text-strong">{model.reviewSignals.mustVerifyCount}</p>
        </div>
        <div className="rounded-xl border border-line/80 bg-white px-3 py-3">
          <p className="text-xs text-text-muted">출처 확인 항목</p>
          <p className="mt-1 text-sm font-semibold text-text-strong">{model.reviewSignals.mustVerifySourcesCount}</p>
        </div>
        <div className="rounded-xl border border-line/80 bg-white px-3 py-3">
          <p className="text-xs text-text-muted">위험 신호</p>
          <p className="mt-1 text-sm font-semibold text-text-strong">{model.reviewSignals.riskFlagsCount}</p>
        </div>
        <div className="rounded-xl border border-line/80 bg-white px-3 py-3">
          <p className="text-xs text-text-muted">출처 확인 필요 수</p>
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
      <p className="ui-kicker">리뷰 큐 요약</p>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-line/80 bg-white px-3 py-3">
          <p className="text-xs text-text-muted">전체 초안 수</p>
          <p className="mt-1 text-sm font-semibold text-text-strong">{model.reviewQueue.totalDrafts}</p>
        </div>
        <div className="rounded-xl border border-line/80 bg-white px-3 py-3">
          <p className="text-xs text-text-muted">승인 대기 초안 수</p>
          <p className="mt-1 text-sm font-semibold text-text-strong">{model.reviewQueue.approvalPendingDrafts}</p>
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
        <p className="mt-3 text-sm text-text-muted">표시할 초안이 없습니다.</p>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-text-muted">
                <th className="py-2 font-medium">초안 ID</th>
                <th className="py-2 font-medium">상태</th>
                <th className="py-2 font-medium">검토 필요</th>
                <th className="py-2 font-medium">생성일</th>
                <th className="py-2 font-medium">수정일</th>
              </tr>
            </thead>
            <tbody>
              {items.map((draft) => (
                <tr key={draft.id} className="border-b border-line/70 text-text-strong last:border-b-0">
                  <td className="py-2">{draft.id}</td>
                  <td className="py-2">
                    <Badge className={toStatusBadgeTone(draft.status)}>{draft.status}</Badge>
                  </td>
                  <td className="py-2">{draft.reviewRequired ? "예" : "아니오"}</td>
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
