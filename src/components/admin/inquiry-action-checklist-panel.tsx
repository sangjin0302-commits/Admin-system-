"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StateInline } from "@/components/ui/state-panel";
import { parseClientApiError } from "@/lib/http/client-api";
import { mergeInquiryChecklistState } from "@/lib/services/inquiry-checklist-state";

type ChecklistItem = {
  id: string;
  label: string;
  description: string;
};

function buildInitialMap(items: ChecklistItem[], initialDoneIds: string[]) {
  const doneSet = new Set(initialDoneIds);
  return items.reduce<Record<string, boolean>>((acc, item) => {
    acc[item.id] = doneSet.has(item.id);
    return acc;
  }, {});
}

function areMapsEqual(items: ChecklistItem[], left: Record<string, boolean>, right: Record<string, boolean>) {
  return items.every((item) => Boolean(left[item.id]) === Boolean(right[item.id]));
}

function collectDoneIds(items: ChecklistItem[], map: Record<string, boolean>) {
  return items.filter((item) => map[item.id]).map((item) => item.id);
}

export function InquiryActionChecklistPanel({
  inquiryId,
  updatedAt,
  baseInternalMemo,
  items,
  initialDoneIds
}: {
  inquiryId: string;
  updatedAt: string;
  baseInternalMemo: string | null;
  items: ChecklistItem[];
  initialDoneIds: string[];
}) {
  const router = useRouter();
  const initialMap = useMemo(() => buildInitialMap(items, initialDoneIds), [items, initialDoneIds]);
  const [doneMap, setDoneMap] = useState<Record<string, boolean>>(initialMap);
  const [message, setMessage] = useState("");
  const [tone, setTone] = useState<"default" | "success" | "error">("default");
  const [isPending, startTransition] = useTransition();

  const doneCount = useMemo(
    () => items.filter((item) => doneMap[item.id]).length,
    [items, doneMap]
  );
  const hasChanges = useMemo(
    () => !areMapsEqual(items, doneMap, initialMap),
    [items, doneMap, initialMap]
  );
  const progressPercent = items.length > 0 ? Math.round((doneCount / items.length) * 100) : 0;

  function toggleItem(id: string) {
    setDoneMap((current) => ({
      ...current,
      [id]: !current[id]
    }));
    setMessage("");
  }

  function markAllDone() {
    const next = items.reduce<Record<string, boolean>>((acc, item) => {
      acc[item.id] = true;
      return acc;
    }, {});
    setDoneMap(next);
    setMessage("");
  }

  function clearAllDone() {
    const next = items.reduce<Record<string, boolean>>((acc, item) => {
      acc[item.id] = false;
      return acc;
    }, {});
    setDoneMap(next);
    setMessage("");
  }

  function handleSave() {
    if (isPending) return;

    startTransition(async () => {
      const doneIds = collectDoneIds(items, doneMap);
      const internalMemo = mergeInquiryChecklistState(baseInternalMemo, doneIds);
      const response = await fetch(`/api/admin/inquiries/${inquiryId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          internalMemo,
          expectedUpdatedAt: updatedAt
        })
      });

      if (!response.ok) {
        setTone("error");
        setMessage(await parseClientApiError(response, "체크리스트 저장에 실패했습니다."));
        if (response.status === 409) {
          router.refresh();
        }
        return;
      }

      setTone("success");
      setMessage("체크리스트 완료 상태를 저장했습니다.");
      router.refresh();
    });
  }

  return (
    <Card className="p-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="ui-kicker">Execution Checklist</p>
          <h3 className="mt-2 ui-section-title">오늘 처리 완료 체크</h3>
          <p className="mt-2 text-sm text-text-muted">
            완료 항목을 저장하면 다음 방문 시에도 동일한 진행 상태가 유지됩니다.
          </p>
        </div>
        <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">
          완료 {doneCount} / {items.length}
        </span>
      </div>

      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between text-xs text-text-muted">
          <span>진행률</span>
          <span className="font-semibold text-text-strong">{progressPercent}%</span>
        </div>
        <div
          className="h-2 rounded-full bg-surface-muted"
          role="progressbar"
          aria-label="즉시 조치 체크리스트 진행률"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progressPercent}
        >
          <div className="h-full rounded-full bg-primary" style={{ width: `${progressPercent}%` }} />
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {items.map((item, index) => (
          <label
            key={item.id}
            className="flex cursor-pointer items-start gap-3 rounded-2xl border border-line bg-surface px-4 py-3"
          >
            <input
              type="checkbox"
              checked={Boolean(doneMap[item.id])}
              onChange={() => toggleItem(item.id)}
              className="mt-1 h-4 w-4 rounded border-line-strong text-primary focus:ring-primary/20"
            />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-text-strong">{item.label || `우선 조치 ${index + 1}`}</p>
              <p className="mt-1 text-sm text-text">{item.description}</p>
            </div>
          </label>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="button" size="sm" variant="secondary" onClick={markAllDone} disabled={isPending}>
          전체 완료
        </Button>
        <Button type="button" size="sm" variant="secondary" onClick={clearAllDone} disabled={isPending}>
          전체 해제
        </Button>
        <Button type="button" size="sm" onClick={handleSave} disabled={isPending || !hasChanges}>
          {isPending ? "저장 중..." : "완료 상태 저장"}
        </Button>
      </div>

      {message ? (
        <div className="mt-3">
          <StateInline tone={tone}>{message}</StateInline>
        </div>
      ) : null}
    </Card>
  );
}
