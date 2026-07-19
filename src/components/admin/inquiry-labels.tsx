"use client";

/**
 * AAA1 (WW2): 문의 자동 라벨링 버튼 + 결과 표시.
 */

import { useState } from "react";
import toast from "react-hot-toast";

const LABEL_COLOR: Record<string, string> = {
  요구: "bg-blue-100 text-blue-900 border-blue-300",
  공포: "bg-red-100 text-red-900 border-red-300",
  불만: "bg-orange-100 text-orange-900 border-orange-300",
  문의: "bg-emerald-100 text-emerald-900 border-emerald-300",
};

export function InquiryLabels({ inquiryId, enabled = true }: { inquiryId: string; enabled?: boolean }) {
  const [loading, setLoading] = useState(false);
  const [labels, setLabels] = useState<string[] | null>(null);
  const [primary, setPrimary] = useState<string | null>(null);

  if (!enabled) return null;

  const run = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/inquiries/${inquiryId}/labels`, { method: "POST" });
      // api.ok() 는 payload 를 그대로 내보낸다 — data 래퍼가 없다.
      // 예전에는 data.data 를 읽어 라벨이 항상 비었고 토스트에 "분류: undefined" 가 떴다.
      const data = (await res.json()) as {
        labels?: string[];
        primary?: string;
        error?: string;
      };
      if (!res.ok) {
        toast.error(data.error ?? "라벨링 실패");
        return;
      }
      setLabels(data.labels ?? []);
      setPrimary(data.primary ?? null);
      toast.success(data.primary ? `분류: ${data.primary}` : "분류 결과가 없습니다.");
    } catch (err) {
      toast.error(`오류: ${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        onClick={run}
        disabled={loading}
        className="inline-flex items-center gap-1 rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-medium hover:bg-surface-muted disabled:opacity-50"
      >
        {loading ? "분류 중…" : "🏷 자동 라벨링"}
      </button>
      {labels?.map((l) => (
        <span
          key={l}
          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${LABEL_COLOR[l] ?? "border-line bg-surface-muted"} ${l === primary ? "ring-1 ring-primary" : ""}`}
        >
          {l}
          {l === primary ? " ★" : ""}
        </span>
      ))}
    </div>
  );
}
