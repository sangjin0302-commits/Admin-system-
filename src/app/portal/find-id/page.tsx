"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

export default function FindIdPage() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ found: boolean; email?: string } | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const res = await fetch("/api/portal/find-id", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone })
      });
      const data = await res.json().catch(() => ({ ok: false }));
      setLoading(false);
      if (!res.ok || !data?.ok) {
        setError(data?.error ?? "요청에 실패했습니다. 잠시 후 다시 시도해 주세요.");
        return;
      }
      setResult({ found: Boolean(data.found), email: data.email });
    } catch {
      setLoading(false);
      setError("네트워크 오류입니다. 잠시 후 다시 시도해 주세요.");
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:py-20">
      <div className="text-center">
        <p className="font-serif text-xs uppercase tracking-[0.3em] text-gold-deep">Find your ID</p>
        <h1 className="mt-3 font-serif text-3xl font-bold text-primary">아이디(이메일) 찾기</h1>
        <p className="mt-2 text-sm text-text-muted">가입 시 입력한 이름과 전화번호로 조회합니다.</p>
      </div>

      <div className="ethos-card mt-8 p-7">
        {result ? (
          <div className="text-center" role="status" aria-live="polite">
            {result.found ? (
              <>
                <p className="text-sm text-text">회원님의 가입 이메일은</p>
                <p className="mt-3 font-mono text-lg font-bold text-primary">{result.email}</p>
                <p className="mt-2 text-xs text-text-muted">보안을 위해 일부만 표시됩니다.</p>
                <div className="mt-6 flex flex-col gap-2">
                  <Link href="/portal/signin" className="inline-flex h-11 items-center justify-center rounded-lg bg-primary font-serif text-sm font-bold text-white hover:bg-text-strong">
                    로그인하기
                  </Link>
                  <Link href="/portal/forgot" className="text-xs text-text-muted hover:text-primary">
                    비밀번호가 기억나지 않으세요? 비밀번호 재설정 →
                  </Link>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-text">
                  입력하신 정보와 일치하는 계정을 찾지 못했습니다.
                  <br />
                  이름·전화번호를 다시 확인해 주세요.
                </p>
                <button
                  type="button"
                  onClick={() => setResult(null)}
                  className="mt-6 inline-block text-xs font-bold text-primary hover:underline"
                >
                  다시 찾기
                </button>
              </>
            )}
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4" aria-label="아이디 찾기 양식">
            <div>
              <label htmlFor="find-name" className="font-serif text-sm font-bold text-primary">이름</label>
              <input
                id="find-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                required
                className="mt-1 w-full rounded-lg border border-gold/40 bg-surface px-4 py-2.5 text-sm focus:border-gold focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="find-phone" className="font-serif text-sm font-bold text-primary">전화번호</label>
              <input
                id="find-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="010-1234-5678"
                autoComplete="tel"
                required
                className="mt-1 w-full rounded-lg border border-gold/40 bg-surface px-4 py-2.5 text-sm focus:border-gold focus:outline-none"
              />
            </div>
            {error && (
              <div role="alert" className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-primary font-serif text-sm font-bold text-white hover:bg-text-strong disabled:opacity-50"
            >
              {loading ? "조회 중..." : "아이디 찾기"}
            </button>
            <p className="text-center text-xs text-text-muted">
              <Link href="/portal/signin" className="hover:text-primary">로그인으로 돌아가기</Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
