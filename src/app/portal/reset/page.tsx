"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";

function ResetForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const token = sp.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/portal/password-reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password })
    });
    const data = await res.json();
    setLoading(false);
    if (!data.ok) {
      setError(data.error ?? "재설정에 실패했습니다.");
      return;
    }
    router.push("/portal/signin?reset=1");
  }

  if (!token) {
    return (
      <div className="text-center">
        <p className="text-sm text-text-muted">유효하지 않은 링크입니다.</p>
        <Link href="/portal/forgot" className="mt-4 inline-block font-bold text-primary hover:underline">
          재설정 다시 요청
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="font-serif text-sm font-bold text-primary">
          새 비밀번호 (영문+숫자 10자 이상)
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="new-password"
          className="mt-1 w-full rounded-lg border border-gold/40 bg-surface px-4 py-2.5 text-sm focus:border-gold focus:outline-none"
        />
      </div>
      {error && <div className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
      <button
        type="submit"
        disabled={loading}
        className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-primary font-serif text-sm font-bold text-white hover:bg-text-strong disabled:opacity-50"
      >
        {loading ? "변경 중..." : "비밀번호 변경"}
      </button>
    </form>
  );
}

function ResetFallback() {
  return (
    <div className="space-y-4">
      <div className="h-12 rounded-lg bg-surface-muted" />
      <div className="h-11 rounded-lg bg-surface-muted" />
    </div>
  );
}

export default function ResetPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:py-20">
      <div className="text-center">
        <p className="font-serif text-xs uppercase tracking-[0.3em] text-gold-deep">Set New Password</p>
        <h1 className="mt-3 font-serif text-3xl font-bold text-primary">새 비밀번호 설정</h1>
      </div>

      <div className="ethos-card mt-8 p-7">
        <Suspense fallback={<ResetFallback />}>
          <ResetForm />
        </Suspense>
      </div>
    </div>
  );
}
