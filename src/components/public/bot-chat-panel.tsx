"use client";

import { useState } from "react";

import type { BotTier, BotTierInfo } from "@/lib/services/bot-access-tier";

type BotKind = "lawbot" | "market";

type Message = {
  role: "user" | "bot";
  text: string;
  restricted?: boolean;
  upgradeCta?: { text: string; href: string };
};

type QueryResponse = {
  answer: string;
  tier: BotTier;
  remainingQuota: number;
  restricted?: boolean;
  upgradeCta?: { text: string; href: string };
};

function renderInline(text: string) {
  // Convert [label](url) → anchor; preserve newlines via split.
  const parts: (string | { label: string; href: string })[] = [];
  const re = /\[([^\]]+)\]\(([^)]+)\)/g;
  let lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > lastIndex) parts.push(text.slice(lastIndex, m.index));
    parts.push({ label: m[1], href: m[2] });
    lastIndex = m.index + m[0].length;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts.map((p, i) =>
    typeof p === "string" ? (
      <span key={i}>{p}</span>
    ) : (
      <a key={i} href={p.href} className="text-gold-deep underline hover:text-primary">
        {p.label}
      </a>
    )
  );
}

function renderMessage(text: string) {
  return text.split("\n").map((line, i) => (
    <p key={i} className="whitespace-pre-wrap leading-7 [&:not(:first-child)]:mt-3">
      {renderInline(line)}
    </p>
  ));
}

export function BotChatPanel({
  bot,
  initialTier,
}: {
  bot: BotKind;
  initialTier: BotTierInfo;
}) {
  const [tier, setTier] = useState<BotTierInfo>(initialTier);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const query = input.trim();
    if (!query || loading) return;
    setMessages((prev) => [...prev, { role: "user", text: query }]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/bot/query", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ bot, query }),
      });
      const data = (await res.json()) as QueryResponse | { error: string };
      if ("error" in data) {
        setMessages((prev) => [...prev, { role: "bot", text: data.error }]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "bot",
            text: data.answer,
            restricted: data.restricted,
            upgradeCta: data.upgradeCta,
          },
        ]);
        setTier((t) => ({
          ...t,
          tier: data.tier,
          remainingQuota: data.remainingQuota,
        }));
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: "요청 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  const remainingDisplay = Number.isFinite(tier.remainingQuota)
    ? `${tier.remainingQuota}회 남음`
    : "무제한";

  return (
    <div className="space-y-4">
      {/* Tier badge */}
      <div className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface px-4 py-3">
        <div>
          <p className="ui-kicker">현재 등급</p>
          <p className="mt-1 font-serif text-sm font-bold text-text-strong">
            {tier.tier === "anonymous"
              ? "비회원"
              : tier.tier === "registered"
                ? "회원"
                : "고객"}
          </p>
        </div>
        <div className="text-right">
          <p className="ui-kicker">오늘 사용량</p>
          <p className="mt-1 font-mono text-sm font-bold text-gold-deep">{remainingDisplay}</p>
        </div>
      </div>

      {/* Banner by tier */}
      {tier.tier === "anonymous" && (
        <div className="rounded-xl border border-amber-300/50 bg-amber-50/70 p-4 text-sm text-text">
          <p className="font-serif font-bold text-amber-900">비회원 무료 체험</p>
          <p className="mt-1 text-text-muted">
            답변 길이 500자 · 5회/일 한도. 무제한 무료 이용을 원하시면{" "}
            <a href="/portal/signup" className="font-bold text-gold-deep underline">
              포털 가입
            </a>
            을 해주세요.
          </p>
        </div>
      )}
      {tier.tier === "registered" && (
        <div className="rounded-xl border-l-4 border-gold bg-surface px-4 py-3 text-sm text-text">
          <p>
            회원 등급 · 30회/일 무료. 본인 사건과 연동된 무제한 분석은{" "}
            <a href="/intake" className="font-bold text-gold-deep underline">
              상담 신청
            </a>
            으로 전환 시 제공됩니다.
          </p>
        </div>
      )}
      {tier.tier === "customer" && (
        <div className="rounded-xl border border-emerald-300/50 bg-emerald-50/70 p-4 text-sm text-emerald-900">
          <p className="font-serif font-bold">무제한 사용 ✓</p>
          <p className="mt-1">고객 등급 — 사건 컨텍스트 연동, 후속 질문, 답변 길이 제한 없음.</p>
        </div>
      )}

      {/* Chat history */}
      <div className="space-y-3 rounded-xl border border-line bg-canvas p-4 min-h-[260px]">
        {messages.length === 0 ? (
          <p className="text-sm text-text-muted">
            궁금하신 점을 입력해 주세요. 예) 외국인 등록 시 필요한 서류는?
          </p>
        ) : (
          messages.map((m, idx) => (
            <div
              key={idx}
              className={
                m.role === "user"
                  ? "rounded-lg bg-surface-muted px-4 py-3 text-sm text-text-strong"
                  : "rounded-lg border border-line bg-surface px-4 py-3 text-sm text-text"
              }
            >
              {m.role === "user" ? (
                <p className="whitespace-pre-wrap">{m.text}</p>
              ) : (
                <div>
                  {renderMessage(m.text)}
                  {m.restricted && m.upgradeCta && (
                    <div className="mt-4 rounded-lg border border-gold/40 bg-gold-soft/30 p-4">
                      <p className="font-serif text-sm font-bold text-primary">업그레이드 안내</p>
                      <a
                        href={m.upgradeCta.href}
                        className="mt-3 inline-flex h-11 items-center rounded-lg bg-primary px-4 text-sm font-bold text-white hover:bg-text-strong"
                      >
                        {m.upgradeCta.text}
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
        {loading && (
          <div className="flex items-center gap-2" role="status">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-gold/30 border-t-gold-deep" aria-hidden />
            <p className="text-xs text-text-muted">답변 생성 중…</p>
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={submit} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="질문을 입력하세요"
          disabled={loading}
          maxLength={2000}
          className="flex-1 rounded-lg border border-line bg-surface px-4 py-2 text-sm focus:border-gold focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="inline-flex h-11 items-center rounded-lg bg-primary px-5 text-sm font-bold text-white hover:bg-text-strong disabled:opacity-40"
        >
          전송
        </button>
      </form>
    </div>
  );
}
