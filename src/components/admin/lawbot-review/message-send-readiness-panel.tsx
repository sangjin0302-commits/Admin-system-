"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatDateTime } from "@/lib/utils";
import type { LawbotMessageSendReadinessUiModel } from "@/lib/services/lawbot-message-send-readiness-ui-model";

import { LoadingState, SafeBooleanLabel, toStatusBadgeTone } from "./shared";

export function MessageSendReadinessPanel({
  model,
  state,
  error,
  onRefresh
}: {
  model: LawbotMessageSendReadinessUiModel | null;
  state: LoadingState;
  error: string | null;
  onRefresh: () => void;
}) {
  const hasBlockingReason = model
    ? !model.sendReadiness.ready || model.sendReadiness.reasonCodes.length > 0
    : false;

  return (
    <Card muted className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="ui-kicker">메시지 발송 준비 상태</p>
          <h2 className="mt-1 text-lg font-semibold text-text-strong">Dry-run 점검</h2>
          <p className="mt-2 text-sm text-text-muted">
            이 패널은 발송 준비 상태만 점검합니다. 실제 발송은 실행하지 않습니다.
          </p>
          <p className="mt-1 text-sm text-text-muted">외부 발송은 별도 단계에서만 가능합니다.</p>
        </div>
        <Button variant="secondary" onClick={onRefresh} disabled={state === "loading"}>
          {state === "loading" ? "불러오는 중" : "새로고침"}
        </Button>
      </div>

      {error ? (
        <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
          메시지 발송 준비 상태를 불러오지 못했습니다.
        </p>
      ) : null}

      {!model && !error ? (
        <p className="mt-4 rounded-xl border border-line bg-surface px-3 py-2 text-sm text-text-muted">
          {state === "loading" || state === "idle"
            ? "메시지 발송 준비 상태를 불러오는 중입니다."
            : "표시할 메시지 발송 준비 상태가 없습니다."}
        </p>
      ) : null}

      {model ? (
        <div className="mt-4 space-y-4">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border border-line/80 bg-white px-3 py-3">
              <p className="text-xs text-text-muted">상태</p>
              <div className="mt-1">
                <Badge className={toStatusBadgeTone(model.sendReadiness.status)}>
                  {model.sendReadiness.status}
                </Badge>
              </div>
            </div>
            <div className="rounded-xl border border-line/80 bg-white px-3 py-3">
              <p className="text-xs text-text-muted">준비 여부</p>
              <p className="mt-1 text-sm font-semibold">
                <SafeBooleanLabel value={model.sendReadiness.ready} />
              </p>
            </div>
            <div className="rounded-xl border border-line/80 bg-white px-3 py-3">
              <p className="text-xs text-text-muted">Dry-run 점검</p>
              <p className="mt-1 text-sm font-semibold">
                <SafeBooleanLabel value={model.sendReadiness.dryRunOnly} />
              </p>
            </div>
            <div className="rounded-xl border border-line/80 bg-white px-3 py-3">
              <p className="text-xs text-text-muted">외부 발송 허용</p>
              <p className="mt-1 text-sm font-semibold">
                <SafeBooleanLabel value={model.sendReadiness.externalActionAllowed} />
              </p>
            </div>
          </div>

          {hasBlockingReason ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-800">
              <p className="font-semibold">준비 제한 사유</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {model.sendReadiness.reasonCodes.map((reason) => (
                  <Badge key={reason} className="border-amber-200 bg-white text-amber-800">
                    {reason}
                  </Badge>
                ))}
              </div>
            </div>
          ) : null}

          <div>
            <p className="text-sm font-semibold text-text-strong">메시지 초안</p>
            {model.messageDrafts.length === 0 ? (
              <p className="mt-2 rounded-xl border border-line bg-surface px-3 py-2 text-sm text-text-muted">
                표시할 메시지 초안이 없습니다.
              </p>
            ) : (
              <div className="mt-3 overflow-x-auto">
                <table className="w-full min-w-[800px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-line text-text-muted">
                      <th className="py-2 font-medium">초안 ID</th>
                      <th className="py-2 font-medium">상태</th>
                      <th className="py-2 font-medium">검토 필요</th>
                      <th className="py-2 font-medium">생성일</th>
                      <th className="py-2 font-medium">수정일</th>
                      <th className="py-2 font-medium">준비 상태</th>
                      <th className="py-2 font-medium">준비 제한 사유</th>
                    </tr>
                  </thead>
                  <tbody>
                    {model.messageDrafts.map((draft) => (
                      <tr key={draft.id} className="border-b border-line/70 text-text-strong last:border-b-0">
                        <td className="py-2">{draft.id}</td>
                        <td className="py-2">
                          <Badge className={toStatusBadgeTone(draft.status)}>{draft.status}</Badge>
                        </td>
                        <td className="py-2">
                          <SafeBooleanLabel value={draft.reviewRequired} />
                        </td>
                        <td className="py-2">{formatDateTime(draft.createdAt)}</td>
                        <td className="py-2">{formatDateTime(draft.updatedAt)}</td>
                        <td className="py-2">
                          <Badge className={toStatusBadgeTone(draft.readinessStatus)}>
                            {draft.readinessStatus}
                          </Badge>
                        </td>
                        <td className="py-2">
                          <div className="flex flex-wrap gap-1">
                            {draft.reasonCodes.map((reason) => (
                              <Badge key={reason} className="border-line-strong bg-surface text-text-strong">
                                {reason}
                              </Badge>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </Card>
  );
}
