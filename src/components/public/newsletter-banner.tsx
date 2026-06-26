"use client";

import { useState, type FormEvent } from "react";

import { CHANNELS } from "@/lib/constants/channels";

export function NewsletterBanner() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "done">("idle");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("submitting");
    // 메일 클라이언트 즉시 열기 (mailto 전략 — 별도 인프라 없이)
    const body = encodeURIComponent(`행정사 Jean 칼럼 구독 신청\n\n이메일: ${email}\n\n비자/행정심판/계약/인허가/법인설립 분야 신간 알림을 받겠습니다.`);
    const subject = encodeURIComponent("[ETHOS] 칼럼 구독 신청");
    window.location.href = `mailto:a.attorneyjean@gmail.com?subject=${subject}&body=${body}`;
    setStatus("done");
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
                비자 정책 변경 · 행정심판 판례 · 신규 강연 일정 등 월 1~2회 정리해서 보내드립니다.
                관심 없으시면 언제든 해지 가능합니다.
              </p>
            </div>

            <form onSubmit={onSubmit} className="flex flex-col gap-2">
              <label className="font-serif text-xs font-bold uppercase tracking-wider text-gold-deep" htmlFor="nl-email">
                이메일
              </label>
              <div className="flex gap-2">
                <input
                  id="nl-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="h-11 flex-1 rounded-lg border border-gold/40 bg-surface px-4 text-sm focus:border-gold focus:outline-none"
                  disabled={status === "submitting"}
                />
                <button
                  type="submit"
                  disabled={status === "submitting"}
                  className="h-11 rounded-lg bg-primary px-5 text-sm font-bold text-white transition hover:bg-text-strong disabled:opacity-60"
                >
                  {status === "done" ? "✓ 전송" : "신청"}
                </button>
              </div>
              <p className="text-[11px] text-text-muted">
                또는 <a href={CHANNELS.naverTalk.url} target="_blank" rel="noreferrer" className="font-bold text-primary underline">네이버 톡톡</a> /{" "}
                <a href={CHANNELS.telegram.url} target="_blank" rel="noreferrer" className="font-bold text-primary underline">Telegram</a> 으로 직접 받아보기
              </p>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
