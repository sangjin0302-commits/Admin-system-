"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";

import { CHANNELS } from "@/lib/constants/channels";

const STORAGE_KEY = "ethos.exitIntentShown";
const HIDDEN_PATHS = ["/intake", "/portal", "/admin", "/links", "/consult"];

const CATEGORIES = [
  { value: "비자", ko: "비자", en: "Visa" },
  { value: "행정심판", ko: "행정심판", en: "Appeal" },
  { value: "인허가", ko: "인허가", en: "Permit" },
  { value: "법인", ko: "법인", en: "Corporate" },
  { value: "계약", ko: "계약", en: "Contract" }
] as const;

export function ExitIntent() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [langEn, setLangEn] = useState(false);
  const L = (ko: string, en: string) => (langEn ? en : ko);

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
    setLangEn(window.location.pathname.startsWith("/en") || document.documentElement.lang === "en");
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
            {L("한 줄만 남겨주세요", "Leave us one line")}
          </h2>
          <p className="mt-2 text-sm leading-7 text-white/80">
            {L("검토는 무료입니다.", "The review is free.")}<br />
            {L("상황만 알려주시면 영업일 24시간 내 가능 여부 회신드립니다.", "Tell us your situation and we'll reply within 24 business hours.")}
          </p>
        </div>

        {/* EMAIL CAPTURE — primary fallback path */}
        <div className="border-b border-line p-6" data-funnel="exit_intent_email">
          {status === "done" ? (
            <div className="rounded-xl border border-gold/40 bg-gold-soft/20 px-4 py-5 text-center">
              <p className="font-serif text-sm font-bold text-primary">
                {L("접수되었습니다. 곧 메일로 안내드릴게요.", "Received. We'll email you shortly.")}
              </p>
              <p className="mt-1 text-xs text-text-muted">
                {L("영업일 24시간 내 검토 방향을 보내드립니다.", "We'll send a review direction within 24 business hours.")}
              </p>
            </div>
          ) : (
            <form onSubmit={submitLead} className="space-y-2.5">
              <p className="font-serif text-sm font-bold text-primary">
                {L("메일로 무료 검토 결과 받기", "Get a free review by email")}
              </p>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={L("이메일 주소", "Email address")}
                autoComplete="email"
                className="w-full rounded-xl border border-line bg-surface px-4 py-2.5 text-sm text-text-strong outline-none transition focus:border-gold focus:ring-1 focus:ring-gold/40"
              />
              <div className="grid grid-cols-2 gap-2.5">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={L("이름 (선택)", "Name (optional)")}
                  autoComplete="name"
                  className="w-full rounded-xl border border-line bg-surface px-4 py-2.5 text-sm text-text-strong outline-none transition focus:border-gold focus:ring-1 focus:ring-gold/40"
                />
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-sm text-text-strong outline-none transition focus:border-gold focus:ring-1 focus:ring-gold/40"
                >
                  <option value="">{L("관심 분야", "Area")}</option>
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {langEn ? c.en : c.ko}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                disabled={status === "sending"}
                className="ethos-cta-shine w-full rounded-xl bg-primary px-4 py-3 font-serif text-sm font-bold text-white transition hover:bg-text-strong disabled:opacity-60"
              >
                {status === "sending" ? L("보내는 중…", "Sending…") : L("무료 검토 결과 메일로 받기", "Email me the free review")}
              </button>
              {status === "error" && (
                <p className="text-center text-xs text-red-600">
                  {L("전송에 실패했습니다. 이메일을 확인하고 다시 시도해주세요.", "Sending failed. Please check your email and try again.")}
                </p>
              )}
              <p className="text-center text-[11px] leading-5 text-text-muted">
                {L("한 줄만 남겨주세요. 영업일 24시간 내 검토 방향을 메일로 보내드립니다. 스팸 없음.", "Just one line. We'll email a review direction within 24 business hours. No spam.")}
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
            <span>📅 {L("상담 예약하기", "Book a consultation")}</span>
            <span>→</span>
          </Link>
          <a
            href={CHANNELS.naverTalk.url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between rounded-xl bg-[#03C75A] px-4 py-3 font-serif text-sm font-bold text-white transition hover:brightness-95"
          >
            <span>{L("네이버 톡톡으로 검토 요청", "Request via Naver Talk")}</span>
            <span className="text-xs font-normal opacity-80">{L("가장 빠른 검토", "Fastest")}</span>
          </a>
          <Link
            href={langEn ? "/consult?lang=en" : "/consult"}
            onClick={() => setOpen(false)}
            className="block text-center text-xs text-white/60 transition hover:text-white/90"
          >
            {L("또는 상담 페이지에서 예약 →", "Or book on the consultation page →")}
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen(false)}
          className="block w-full border-t border-line py-3 text-xs text-text-muted transition hover:bg-surface-muted"
        >
          {L("나중에 다시 보기", "Maybe later")}
        </button>
      </div>
    </div>
  );
}
