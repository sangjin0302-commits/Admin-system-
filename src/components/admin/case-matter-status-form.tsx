"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";

import { parseClientApiError } from "@/lib/http/client-api";
import {
  caseMatterStatusValues,
  getCaseMatterStatusLabel,
  type CaseMatterStatusValue
} from "@/types/case-matter";

type CaseMatterStatusFormProps = {
  caseMatterId: string;
  currentStatus: CaseMatterStatusValue;
  currentUpdatedAt: string;
  allowedTransitions: readonly CaseMatterStatusValue[];
};

export function CaseMatterStatusForm({
  caseMatterId,
  currentStatus,
  currentUpdatedAt,
  allowedTransitions
}: CaseMatterStatusFormProps) {
  const router = useRouter();
  const [status, setStatus] = useState<CaseMatterStatusValue>(currentStatus);
  const [statusChangeNote, setStatusChangeNote] = useState("");
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const statusChanged = status !== currentStatus;
  const canSubmit = statusChanged && !isPending;
  const validTargets = allowedTransitions.length > 0 ? allowedTransitions : caseMatterStatusValues;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) {
      setMessage("변경할 상태가 없습니다.");
      return;
    }

    setMessage("");
    const note = statusChangeNote.trim();

    startTransition(async () => {
      const response = await fetch(`/api/admin/case-matters/${caseMatterId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          status,
          statusChangeNote: note || undefined,
          expectedUpdatedAt: currentUpdatedAt
        })
      });

      if (!response.ok) {
        setMessage(await parseClientApiError(response, "사건 상태를 변경하지 못했습니다."));
        if (response.status === 409 && response.headers.get("X-Current-Updated-At")) {
          router.refresh();
        }
        return;
      }

      setMessage("사건 상태가 변경되었습니다. 최신 상태를 다시 불러옵니다...");
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-2xl border border-line bg-surface-muted p-4">
      <div>
        <p className="text-sm font-semibold text-text-strong">사건 상태 전이</p>
        <p className="mt-1 text-xs text-text-muted">
          현재 상태: <span className="font-medium text-text-strong">{getCaseMatterStatusLabel(currentStatus)}</span>
        </p>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row">
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value as CaseMatterStatusValue)}
          className="h-10 flex-1 rounded-xl border border-line bg-surface px-3 text-sm text-text-strong outline-none focus:border-line-strong"
        >
          {validTargets.map((value) => (
            <option key={value} value={value}>
              {getCaseMatterStatusLabel(value)}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={!canSubmit}
          className="h-10 rounded-xl bg-ink px-4 text-sm font-semibold text-white transition hover:bg-trust disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "변경 중..." : "적용"}
        </button>
      </div>

      <textarea
        value={statusChangeNote}
        onChange={(event) => setStatusChangeNote(event.target.value)}
        rows={3}
        className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm text-text outline-none focus:border-line-strong"
        placeholder="감사 로그용 사유(선택)"
      />

      {message ? <p className="text-xs text-text-muted">{message}</p> : null}
    </form>
  );
}
