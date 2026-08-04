"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

const CATEGORIES = [
  { value: "VISA_STAY", label: "비자·체류" },
  { value: "ADMIN_APPEAL", label: "행정심판" },
  { value: "CONTRACT_INVESTIGATION", label: "계약·사실조사" },
  { value: "LICENSE_PERMIT", label: "인허가" }
];

export default function ReviewPage() {
  const [author, setAuthor] = useState("");
  const [category, setCategory] = useState("VISA_STAY");
  const [quote, setQuote] = useState("");
  const [context, setContext] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (status === "sending") return;
    setError(null);
    if (!agreed) {
      setError("게시 동의를 체크해 주세요.");
      return;
    }
    setStatus("sending");
    try {
      const res = await fetch("/api/public/testimonial-submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ author, category, quote, context, agreed })
      });
      const data = await res.json().catch(() => ({ ok: false }));
      if (!res.ok || !data?.ok) {
        setStatus("error");
        setError(data?.error ?? "제출에 실패했습니다. 잠시 후 다시 시도해 주세요.");
        return;
      }
      setStatus("done");
    } catch {
      setStatus("error");
      setError("네트워크 오류입니다. 잠시 후 다시 시도해 주세요.");
    }
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-16 sm:py-20">
      <div className="text-center">
        <p className="ethos-eyebrow">Your Voice</p>
        <h1 className="ethos-display mt-3 text-3xl sm:text-4xl">후기 남기기</h1>
        <p className="mt-3 text-sm leading-7 text-text-muted">
          도움이 되셨다면 한 줄 남겨주세요. 검토 후 사이트에 게시됩니다.
          <br />
          개인정보(실명·연락처)는 적지 말아주세요.
        </p>
      </div>

      <div className="ethos-card mt-8 p-6 sm:p-8">
        {status === "done" ? (
          <div className="text-center" role="status" aria-live="polite">
            <p className="font-serif text-lg font-bold text-primary">감사합니다 🙏</p>
            <p className="mt-2 text-sm text-text-muted">후기가 접수되었습니다. 검토 후 게시됩니다.</p>
            <Link href="/" className="mt-6 inline-block text-xs font-bold text-primary hover:underline">
              홈으로 돌아가기
            </Link>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4" aria-label="후기 작성 양식">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="rv-author" className="text-sm font-semibold text-text-strong">표시할 이름/별칭</label>
                <input
                  id="rv-author"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="예: 김OO, D-2 유학생"
                  required
                  className="mt-1 h-11 w-full rounded-lg border border-line bg-surface px-3 text-sm focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="rv-cat" className="text-sm font-semibold text-text-strong">분야</label>
                <select
                  id="rv-cat"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="mt-1 h-11 w-full rounded-lg border border-line bg-surface px-3 text-sm focus:border-primary focus:outline-none"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label htmlFor="rv-quote" className="text-sm font-semibold text-text-strong">후기 내용</label>
              <textarea
                id="rv-quote"
                value={quote}
                onChange={(e) => setQuote(e.target.value)}
                rows={5}
                required
                placeholder="어떤 도움을 받으셨는지 편하게 적어주세요. (10자 이상)"
                className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="rv-context" className="text-sm font-semibold text-text-strong">한 줄 상황 (선택)</label>
              <input
                id="rv-context"
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="예: 체류자격 변경 상담"
                className="mt-1 h-11 w-full rounded-lg border border-line bg-surface px-3 text-sm focus:border-primary focus:outline-none"
              />
            </div>
            <label className="flex items-start gap-2 text-xs text-text-muted">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-line"
              />
              <span>작성한 후기가 별칭과 함께 사이트에 게시되는 것에 동의합니다. (실명·연락처는 게시하지 않습니다.)</span>
            </label>
            {error && (
              <div role="alert" className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
            )}
            <button
              type="submit"
              disabled={status === "sending"}
              className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-primary text-sm font-bold text-white transition hover:bg-text-strong disabled:opacity-50"
            >
              {status === "sending" ? "제출 중…" : "후기 제출"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
