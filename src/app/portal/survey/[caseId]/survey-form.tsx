"use client";

import Link from "next/link";
import { useState } from "react";

export function SurveyForm({ caseId }: { caseId: string }) {
  const [rating, setRating] = useState(0);
  const [nps, setNps] = useState<number | null>(null);
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating < 1 || nps === null) {
      setError("별점과 추천의향을 모두 입력해 주세요.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/portal/survey/${caseId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, npsScore: nps, feedback }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error ?? "제출 실패");
      }
      setDone(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-lg border border-gold/30 bg-surface-muted/40 p-4 text-sm text-text">
        <p className="font-serif text-lg font-bold text-primary">감사합니다!</p>
        <p className="mt-2">소중한 의견을 남겨 주셔서 진심으로 감사드립니다.</p>
        <div className="mt-4">
          <Link
            href="/"
            className="inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-bold text-white hover:bg-text-strong"
          >
            홈으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div>
        <label className="text-sm font-bold text-text">별점 (전반적 만족도)</label>
        <div className="mt-2 flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              className={`text-3xl transition ${
                n <= rating ? "text-gold-deep" : "text-text-muted/40"
              }`}
              aria-label={`${n}점`}
            >
              ★
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-sm font-bold text-text">
          추천의향 (0-10, 지인에게 추천하시겠습니까?)
        </label>
        <div className="mt-2 flex flex-wrap gap-1">
          {Array.from({ length: 11 }, (_, i) => i).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setNps(n)}
              className={`h-9 w-9 rounded-lg border text-sm font-bold ${
                nps === n
                  ? "border-primary bg-primary text-white"
                  : "border-gold/30 bg-surface text-text hover:border-primary"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-sm font-bold text-text">자유의견</label>
        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          rows={5}
          maxLength={2000}
          placeholder="개선점, 좋았던 점 등을 자유롭게 남겨주세요."
          className="mt-2 w-full rounded-lg border border-gold/30 bg-surface px-3 py-2 text-sm text-text focus:border-primary focus:outline-none"
        />
      </div>

      {error && (
        <p className="rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-xs text-warning">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex h-11 items-center rounded-lg bg-primary px-6 text-sm font-bold text-white hover:bg-text-strong disabled:opacity-50"
      >
        {submitting ? "제출 중..." : "제출하기"}
      </button>
    </form>
  );
}
