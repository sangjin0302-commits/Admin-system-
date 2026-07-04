"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import type { NaverReview } from "@/lib/services/naver-review-service";

export function NaverReviewsForm({ initial }: { initial: NaverReview[] }) {
  const router = useRouter();
  const [reviews, setReviews] = useState<NaverReview[]>(initial);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  function update(idx: number, patch: Partial<NaverReview>) {
    setReviews((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
    setStatus("idle");
  }
  function remove(idx: number) {
    setReviews((prev) => prev.filter((_, i) => i !== idx));
    setStatus("idle");
  }
  function add() {
    setReviews((prev) => [
      ...prev,
      { author: "", rating: 5, text: "", date: new Date().toISOString().slice(0, 10) }
    ]);
    setStatus("idle");
  }

  async function save() {
    setStatus("saving");
    try {
      const res = await fetch("/api/admin/naver-reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviews })
      });
      setStatus(res.ok ? "saved" : "error");
      if (res.ok) router.refresh();
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="space-y-4">
      {reviews.map((r, i) => (
        <div key={i} className="rounded-xl border border-line bg-surface p-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="text-sm">
              <span className="block font-semibold text-text-strong">작성자</span>
              <input
                value={r.author}
                onChange={(e) => update(i, { author: e.target.value })}
                className="mt-1 h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm"
              />
            </label>
            <label className="text-sm">
              <span className="block font-semibold text-text-strong">별점 (0-5)</span>
              <input
                type="number"
                min={0}
                max={5}
                step={0.5}
                value={r.rating}
                onChange={(e) => update(i, { rating: Number(e.target.value) })}
                className="mt-1 h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm"
              />
            </label>
            <label className="text-sm">
              <span className="block font-semibold text-text-strong">날짜</span>
              <input
                value={r.date}
                onChange={(e) => update(i, { date: e.target.value })}
                placeholder="2026-01-15"
                className="mt-1 h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm"
              />
            </label>
          </div>
          <label className="mt-3 block text-sm">
            <span className="block font-semibold text-text-strong">본문</span>
            <textarea
              rows={3}
              value={r.text}
              onChange={(e) => update(i, { text: e.target.value })}
              className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm"
            />
          </label>
          <label className="mt-3 block text-sm">
            <span className="block font-semibold text-text-strong">원본 URL (선택)</span>
            <input
              value={r.url ?? ""}
              onChange={(e) => update(i, { url: e.target.value || undefined })}
              className="mt-1 h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm"
            />
          </label>
          <div className="mt-3 text-right">
            <button
              type="button"
              onClick={() => remove(i)}
              className="rounded border border-red-300 px-3 py-1 text-xs text-red-600"
            >
              삭제
            </button>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={add}
        className="w-full rounded-xl border border-dashed border-line py-3 text-sm text-text-muted hover:bg-surface-muted/40"
      >
        + 후기 추가
      </button>

      <div className="sticky bottom-4 flex items-center justify-between gap-3 rounded-2xl border border-line bg-surface p-4 shadow-panel">
        <div className="text-sm text-text-muted">
          {status === "saving" && "저장 중..."}
          {status === "saved" && <span className="text-green-600">저장되었습니다.</span>}
          {status === "error" && <span className="text-red-600">저장 실패.</span>}
        </div>
        <button
          type="button"
          onClick={save}
          disabled={status === "saving"}
          className="h-11 rounded-lg bg-primary px-6 text-sm font-bold text-white disabled:opacity-60"
        >
          저장
        </button>
      </div>
    </div>
  );
}
