"use client";
import { useState } from "react";

export function SurveyForm({ token }: { token: string }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const submit = async () => {
    if (rating === 0) return;
    await fetch("/api/public/survey", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, rating, comment }),
    });
    setSubmitted(true);
  };

  if (submitted) return (
    <div className="rounded-2xl border p-8 text-center shadow-sm">
      <p className="text-2xl">🙏</p>
      <p className="mt-3 text-lg font-bold text-primary">감사합니다!</p>
      <p className="mt-2 text-sm text-text-muted">소중한 의견이 서비스 개선에 반영됩니다.</p>
    </div>
  );

  return (
    <div className="w-full max-w-md rounded-2xl border bg-white p-8 shadow-sm">
      <h1 className="text-center text-xl font-bold text-primary">ETHOS 서비스 만족도</h1>
      <p className="mt-2 text-center text-sm text-text-muted">서비스는 만족스러우셨나요?</p>
      <div className="mt-6 flex justify-center gap-2">
        {[1,2,3,4,5].map(n => (
          <button key={n} type="button" onClick={() => setRating(n)} className={`text-3xl transition ${rating >= n ? "text-gold" : "text-gray-300"}`}>★</button>
        ))}
      </div>
      <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="추가 의견 (선택사항)" className="mt-6 w-full rounded-lg border p-3 text-sm focus:border-primary focus:outline-none" rows={3} />
      <button type="button" onClick={submit} disabled={rating === 0} className="mt-4 w-full rounded-lg bg-primary py-3 text-sm font-bold text-white transition hover:bg-text-strong disabled:opacity-50">
        평가 제출
      </button>
    </div>
  );
}
