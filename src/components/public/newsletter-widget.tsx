"use client";

import { useState, type FormEvent } from "react";

/**
 * Newsletter subscribe widget (double opt-in).
 * Replaces the mailto-based NewsletterBanner with a real API-backed form.
 */
export function NewsletterWidget() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "sent" | "already" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("submitting");
    setErrorMsg("");
    try {
      const res = await fetch("/api/public/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        setStatus(data.alreadyConfirmed ? "already" : "sent");
      } else {
        setStatus("error");
        setErrorMsg(
          res.status === 429
            ? "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요."
            : data.error === "INVALID_EMAIL"
              ? "유효한 이메일 주소를 입력해 주세요."
              : "구독 신청에 실패했습니다."
        );
      }
    } catch {
      setStatus("error");
      setErrorMsg("네트워크 오류가 발생했습니다.");
    }
  }

  return (
    <section className="py-12 sm:py-16">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="ethos-grain relative overflow-hidden rounded-[24px] border border-gold/30 bg-gold-soft/20 p-7 sm:p-10">
          <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-center">
            <div>
              <p className="font-serif text-[11px] font-bold uppercase tracking-[0.3em] text-gold-deep">
                Stay Updated
              </p>
              <h3 className="ethos-display mt-2 text-2xl sm:text-3xl">
                새 글이 올라오면 알려드릴까요?
              </h3>
              <p className="mt-2 text-sm leading-7 text-text-muted">
                비자 정책 변경 · 행정심판 판례 · 신규 강연 일정 등 주 1회 정리해서 보내드립니다.
                관심 없으시면 언제든 해지 가능합니다.
              </p>
            </div>

            <form onSubmit={onSubmit} className="flex flex-col gap-2">
              <label className="font-serif text-xs font-bold uppercase tracking-wider text-gold-deep" htmlFor="nl-widget-email">
                이메일
              </label>
              <div className="flex gap-2">
                <input
                  id="nl-widget-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="h-11 flex-1 rounded-lg border border-gold/40 bg-surface px-4 text-sm focus:border-gold focus:outline-none"
                  disabled={status === "submitting" || status === "sent"}
                />
                <button
                  type="submit"
                  disabled={status === "submitting" || status === "sent"}
                  className="h-11 rounded-lg bg-primary px-5 text-sm font-bold text-white transition hover:bg-text-strong disabled:opacity-60"
                >
                  {status === "submitting" ? "전송 중" : "구독"}
                </button>
              </div>
              {status === "sent" && (
                <p className="text-[12px] font-semibold text-primary">✓ 확인 이메일 발송됨 — 받은 편지함을 확인해 주세요.</p>
              )}
              {status === "already" && (
                <p className="text-[12px] text-text-muted">이미 구독 중인 이메일입니다. 감사합니다.</p>
              )}
              {status === "error" && (
                <p className="text-[12px] text-red-600">{errorMsg}</p>
              )}
              {status === "idle" && (
                <p className="text-[11px] text-text-muted">
                  확인 링크가 담긴 이메일을 보내드립니다 (이중 확인).
                </p>
              )}
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
