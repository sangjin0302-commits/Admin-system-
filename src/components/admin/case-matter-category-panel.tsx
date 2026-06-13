"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Card } from "@/components/ui/card";
import { parseClientApiError } from "@/lib/http/client-api";

const CATEGORIES = [
  { value: "VISA_STAY", label: "비자/외국인 체류" },
  { value: "ADMIN_APPEAL", label: "행정심판" },
  { value: "CONTRACT_INVESTIGATION", label: "계약서/사실조사" },
  { value: "LICENSE_PERMIT", label: "인허가" },
  { value: "OTHER", label: "기타" },
] as const;

type Props = {
  caseMatterId: string;
  currentCategory: string;
};

export function CaseMatterCategoryPanel({ caseMatterId, currentCategory }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selected, setSelected] = useState(currentCategory);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const currentLabel = CATEGORIES.find((c) => c.value === currentCategory)?.label ?? currentCategory;
  const isDirty = selected !== currentCategory;

  async function handleSave() {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/case-matters/${caseMatterId}/category`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ category: selected }),
        });
        if (!res.ok) {
          const msg = await parseClientApiError(res, "카테고리 변경에 실패했습니다.");
          setError(msg);
          return;
        }
        setSaved(true);
        router.refresh();
      } catch {
        setError("저장 중 오류가 발생했습니다.");
      }
    });
  }

  return (
    <Card className="p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-text-strong">업무 카테고리</h3>
          <p className="mt-1 text-xs text-text-muted">
            현재: <span className="font-medium text-text-strong">{currentLabel}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selected}
            onChange={(e) => { setSelected(e.target.value); setSaved(false); }}
            className="h-10 rounded-lg border border-line bg-surface px-3 text-sm text-text-strong focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>

          <button
            onClick={handleSave}
            disabled={isPending || !isDirty}
            className="inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:opacity-40"
          >
            {isPending ? "저장 중..." : "변경"}
          </button>
        </div>
      </div>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      {saved && <p className="mt-2 text-sm text-green-600">카테고리가 변경되었습니다.</p>}
    </Card>
  );
}
