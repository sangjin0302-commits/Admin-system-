"use client";

import { useState } from "react";

type Lang = "ko" | "en";

const COPY: Record<Lang, {
  heading: string;
  sub: string;
  placeholder: string;
  button: string;
  sending: string;
  ok: string;
  already: string;
  invalid: string;
  rate: string;
  fail: string;
  privacy: string;
}> = {
  ko: {
    heading: "새 칼럼을 이메일로 받아보세요",
    sub: "비자·행정심판·인허가 실무 인사이트를 새 글이 올라올 때마다 보내드립니다.",
    placeholder: "이메일 주소",
    button: "구독하기",
    sending: "신청 중…",
    ok: "확인 메일을 보냈습니다. 메일함에서 구독 확인을 눌러주세요.",
    already: "이미 구독 중인 이메일입니다.",
    invalid: "이메일 형식을 확인해주세요.",
    rate: "요청이 많습니다. 잠시 후 다시 시도해주세요.",
    fail: "신청에 실패했습니다. 잠시 후 다시 시도해주세요.",
    privacy: "구독은 언제든 해지할 수 있으며, 이메일은 뉴스레터 발송에만 사용됩니다."
  },
  en: {
    heading: "Get new columns by email",
    sub: "Practical insights on visas, administrative appeals, and permits — delivered whenever a new post goes live.",
    placeholder: "Email address",
    button: "Subscribe",
    sending: "Submitting…",
    ok: "Confirmation email sent. Please click the confirm link in your inbox.",
    already: "This email is already subscribed.",
    invalid: "Please check the email format.",
    rate: "Too many requests. Please try again shortly.",
    fail: "Subscription failed. Please try again later.",
    privacy: "You can unsubscribe anytime; your email is used only for the newsletter."
  }
};

type State = "idle" | "sending" | "done" | "error";

export function NewsletterSubscribeForm({ lang = "ko" }: { lang?: Lang }) {
  const t = COPY[lang];
  const [email, setEmail] = useState("");
  const [state, setState] = useState<State>("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (state === "sending") return;
    setState("sending");
    setMessage(null);
    try {
      const res = await fetch("/api/public/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      const j = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        alreadyConfirmed?: boolean;
        error?: string;
      };
      if (res.status === 429) {
        setState("error");
        setMessage(t.rate);
        return;
      }
      if (!res.ok || !j.ok) {
        setState("error");
        setMessage(j.error === "INVALID_EMAIL" ? t.invalid : t.fail);
        return;
      }
      setState("done");
      setMessage(j.alreadyConfirmed ? t.already : t.ok);
      setEmail("");
    } catch {
      setState("error");
      setMessage(t.fail);
    }
  }

  return (
    <div className="mx-auto max-w-xl text-center">
      <h3 className="ethos-display text-2xl text-text-strong">{t.heading}</h3>
      <p className="mt-3 text-sm leading-7 text-text-muted">{t.sub}</p>
      <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-2 sm:flex-row">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t.placeholder}
          className="h-12 flex-1 rounded-full border border-line bg-surface px-5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          aria-label={t.placeholder}
        />
        <button
          type="submit"
          disabled={state === "sending"}
          className="h-12 rounded-full bg-primary px-7 text-sm font-semibold text-white transition hover:bg-text-strong disabled:opacity-50"
        >
          {state === "sending" ? t.sending : t.button}
        </button>
      </form>
      {message && (
        <p
          className={`mt-3 text-sm ${state === "error" ? "text-danger" : "text-success"}`}
          role="status"
        >
          {message}
        </p>
      )}
      <p className="mt-3 text-xs text-text-muted">{t.privacy}</p>
    </div>
  );
}
