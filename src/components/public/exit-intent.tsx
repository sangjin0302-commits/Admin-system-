"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";

import { CHANNELS } from "@/lib/constants/channels";

const STORAGE_KEY = "ethos.exitIntentShown";
const HIDDEN_PATHS = ["/intake", "/portal", "/admin", "/links", "/consult"];

const CATEGORIES = ["비자", "행정심판", "인허가", "법인", "계약"] as const;

export function ExitIntent() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");

  async function submitLead(e: FormEvent) {
    e.preventDefault();
    if (status === "sending") return;
    if (!email.trim()) {
      setStatus("error");
      return;
    }
    setStatus("sending");
    try {
      const res = await fetch("/api/public/lead-capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          name: name.trim() || undefined,
          category: category || undefined,
          source: "exit_intent",
        }),
      });
      const data = await res.json().catch(() => ({ ok: false }));
      if (!res.ok || !data?.ok) {
        setStatus("error");
        return;
      }
      setStatus("done");
      try {
        if (typeof window.gtag === "function") {
          window.gtag("event", "generate_lead", { source: "exit_intent_email" });
        }
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({ event: "generate_lead", source: "exit_intent_email" });
      } catch {}
    } catch {
      setStatus("error");
    }
  }

  useEffect(() => {
    if (typeof window === "undefined") return;
    const p = window.location.pathname;
    if (HIDDEN_PATHS.some((h) => p.startsWith(h))) return;

    try {
      if (sessionStorage.getItem(STORAGE_KEY)) return;
    } catch {}

    function onMouseOut(e: MouseEvent) {
      if (e.clientY <= 0 && !e.relatedTarget) {
        setOpen(true);
        try {
          sessionStorage.setItem(STORAGE_KEY, "1");
        } catch {}
        document.removeEventListener("mouseout", onMouseOut);
      }
    }

    const t = window.setTimeout(() => {
      document.addEventListener("mouseout", onMouseOut);
    }, 8000);

    return () => {
      window.clearTimeout(t);
      document.removeEventListener("mouseout", onMouseOut);
    };
  }, []);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="exit-intent-title"
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
      onClick={() => setOpen(false)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="ethos-grain relative w-full max-w-md overflow-hidden rounded-[24px] border border-gold/30 bg-surface shadow-floating"
      >
        <div className="ethos-dark-card-v px-7 py-7 text-center text-white">
          <p className="font-serif text-[11px] font-bold uppercase tracking-[0.3em] text-gold-soft">
            Before you go
          </p>
          <h2 id="exit-intent-title" className="ethos-display mt-3 text-2xl text-white">
            한 줄만 남겨주세요
          </h2>
          <p className="mt-2 text-sm leading-7 text-white/80">
            검토는 무료입니다.<br />
            상황만 알려주시면 영업일 24시간 내 가능 여부 회신드립니다.
          </p>
        </div>

        {/* EMAIL CAPTURE — primary fallback path */}
        <div className="border-b border-line p-6" data-funnel="exit_intent_email">
          {status === "done" ? (
            <div className="rounded-xl border border-gold/40 bg-gold-soft/20 px-4 py-5 text-center">
              <p className="font-serif text-sm font-bold text-primary">
                접수되었습니다. 곧 메일로 안내드릴게요.
              </p>
              <p className="mt-1 text-xs text-text-muted">
                영업일 24시간 내 검토 방향을 보내드립니다.
              </p>
            </div>
          ) : (
            <form onSubmit={submitLead} className="space-y-2.5">
              <p className="font-serif text-sm font-bold text-primary">
                메일로 무료 검토 결과 받기
              </p>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="이메일 주소"
                autoComplete="email"
                className="w-full rounded-xl border border-line bg-surface px-4 py-2.5 text-sm text-text-strong outline-none transition focus:border-gold focus:ring-1 focus:ring-gold/40"
              />
              <div className="grid grid-cols-2 gap-2.5">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="이름 (선택)"
                  autoComplete="name"
                  className="w-full rounded-xl border border-line bg-surface px-4 py-2.5 text-sm text-text-strong outline-none transition focus:border-gold focus:ring-1 focus:ring-gold/40"
                />
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-sm text-text-strong outline-none transition focus:border-gold focus:ring-1 focus:ring-gold/40"
                >
                  <option value="">관심 분야</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                disabled={status === "sending"}
                className="ethos-cta-shine w-full rounded-xl bg-primary px-4 py-3 font-serif text-sm font-bold text-white transition hover:bg-text-strong disabled:opacity-60"
              >
                {status === "sending" ? "보내는 중…" : "무료 검토 결과 메일로 받기"}
              </button>
              {status === "error" && (
                <p className="text-center text-xs text-red-600">
                  전송에 실패했습니다. 이메일을 확인하고 다시 시도해주세요.
                </p>
              )}
              <p className="text-center text-[11px] leading-5 text-text-muted">
                한 줄만 남겨주세요. 영업일 24시간 내 검토 방향을 메일로 보내드립니다. 스팸 없음.
              </p>
            </form>
          )}
        </div>

        <div className="space-y-3 p-6" data-funnel="exit_intent_booking">
          <Link
            href="/consult#booking"
            onClick={() => setOpen(false)}
            className="flex items-center justify-between rounded-xl border border-gold/40 bg-surface px-4 py-3 font-serif text-sm font-bold text-primary transition hover:bg-gold-soft/30"
          >
            <span>📅 상담 예약하기</span>
            <span>→</span>
          </Link>
          <a
            href={CHANNELS.naverTalk.url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between rounded-xl bg-[#03C75A] px-4 py-3 font-serif text-sm font-bold text-white transition hover:brightness-95"
          >
            <span>네이버 톡톡으로 검토 요청</span>
            <span className="text-xs font-normal opacity-80">가장 빠른 검토</span>
          </a>
          <Link
            href="/consult"
            onClick={() => setOpen(false)}
            className="block text-center text-xs text-white/60 transition hover:text-white/90"
          >
            또는 상담 페이지에서 예약 →
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen(false)}
          className="block w-full border-t border-line py-3 text-xs text-text-muted transition hover:bg-surface-muted"
        >
          나중에 다시 보기
        </button>
      </div>
    </div>
  );
}
