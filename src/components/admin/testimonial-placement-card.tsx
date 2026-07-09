"use client";

import { useEffect, useState } from "react";

type Placement = {
  testimonialId: string;
  serviceCategory: string;
  suggested_page: string;
  author: string;
  quote: string;
};

export function TestimonialPlacementCard() {
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [approved, setApproved] = useState<Set<string>>(new Set());
  const [rejected, setRejected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/admin/testimonial-auto-place")
      .then((r) => r.json())
      .then((d) => {
        setPlacements(d.mapping ?? []);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  function toggleApprove(id: string) {
    setApproved((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setRejected((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }

  function toggleReject(id: string) {
    setRejected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setApproved((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }

  async function saveApproved() {
    setSaving(true);
    const selected = placements
      .filter((p) => approved.has(p.testimonialId))
      .map((p) => ({ testimonialId: p.testimonialId, page: p.suggested_page }));
    try {
      await fetch("/api/admin/testimonial-auto-place", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ placements: selected }),
      });
    } finally {
      setSaving(false);
    }
  }

  if (!loaded) return <p className="text-sm text-text-muted">로딩 중...</p>;
  if (!placements.length)
    return <p className="text-sm text-text-muted">배치 제안할 후기가 없습니다.</p>;

  return (
    <div className="space-y-3">
      {placements.map((p) => (
        <div
          key={p.testimonialId}
          className={`rounded-lg border p-4 ${
            approved.has(p.testimonialId)
              ? "border-green-500 bg-green-50 dark:bg-green-950/20"
              : rejected.has(p.testimonialId)
                ? "border-red-300 bg-red-50 dark:bg-red-950/20 opacity-60"
                : "border-line bg-surface"
          }`}
        >
          <p className="text-sm font-medium">{p.author}</p>
          <p className="text-xs text-text-muted mt-1 truncate">&ldquo;{p.quote}&rdquo;</p>
          <p className="text-xs mt-2">
            <span className="text-text-muted">카테고리:</span> {p.serviceCategory}{" "}
            <span className="text-text-muted">→</span>{" "}
            <span className="font-mono text-blue-600">{p.suggested_page}</span>
          </p>
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => toggleApprove(p.testimonialId)}
              className="rounded bg-green-600 px-3 py-1 text-xs text-white hover:bg-green-700"
            >
              {approved.has(p.testimonialId) ? "승인 취소" : "승인"}
            </button>
            <button
              onClick={() => toggleReject(p.testimonialId)}
              className="rounded bg-red-500 px-3 py-1 text-xs text-white hover:bg-red-600"
            >
              {rejected.has(p.testimonialId) ? "거부 취소" : "거부"}
            </button>
          </div>
        </div>
      ))}
      {approved.size > 0 && (
        <button
          onClick={saveApproved}
          disabled={saving}
          className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "저장 중..." : `승인 ${approved.size}건 저장`}
        </button>
      )}
    </div>
  );
}
