"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";

export function AdminLoginForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const rawNext = sp.get("next") ?? "/admin";
  // 오픈 리다이렉트 방지 — 같은 사이트 내부 경로만 허용.
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/admin";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/admin-auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) {
        setError(json.error ?? "로그인에 실패했습니다.");
        return;
      }
      router.replace(next);
      router.refresh();
    } catch {
      setError("네트워크 오류가 발생했습니다. 다시 시도해 주세요.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mt-8 space-y-4 rounded-2xl border border-line bg-surface p-6 shadow-sm"
    >
      <div>
        <label htmlFor="admin-username" className="block text-xs font-bold text-text">
          아이디
        </label>
        <input
          id="admin-username"
          name="username"
          type="text"
          autoComplete="username"
          required
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="mt-1.5 h-11 w-full rounded-lg border border-line bg-surface px-3 text-sm text-text outline-none focus:border-gold focus:ring-2 focus:ring-gold/30"
        />
      </div>

      <div>
        <label htmlFor="admin-password" className="block text-xs font-bold text-text">
          비밀번호
        </label>
        <input
          id="admin-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1.5 h-11 w-full rounded-lg border border-line bg-surface px-3 text-sm text-text outline-none focus:border-gold focus:ring-2 focus:ring-gold/30"
        />
      </div>

      {error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-xs leading-5 text-red-700">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="ethos-cta-shine h-11 w-full rounded-lg bg-primary text-sm font-bold text-white transition hover:opacity-95 disabled:opacity-60"
      >
        {submitting ? "확인 중…" : "로그인"}
      </button>
    </form>
  );
}
