"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState, type FormEvent } from "react";


export default function SignInPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const callbackUrl = sp.get("callbackUrl") ?? "/portal";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false
    });
    setLoading(false);

    if (!res?.ok) {
      setError("이메일 또는 비밀번호가 올바르지 않습니다.");
      return;
    }
    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:py-20">
      <div className="text-center">
        <p className="font-serif text-xs uppercase tracking-[0.3em] text-gold-deep">Client Portal</p>
        <h1 className="mt-3 font-serif text-3xl font-bold text-primary">로그인</h1>
        <p className="mt-2 text-sm text-text-muted">사건 진행 상황과 자료를 직접 확인하세요.</p>
      </div>

      <div className="ethos-card mt-8 p-7">
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="font-serif text-sm font-bold text-primary">이메일</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="mt-1 w-full rounded-lg border border-gold/40 bg-surface px-4 py-2.5 text-sm focus:border-gold focus:outline-none"
            />
          </div>
          <div>
            <label className="font-serif text-sm font-bold text-primary">비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="mt-1 w-full rounded-lg border border-gold/40 bg-surface px-4 py-2.5 text-sm focus:border-gold focus:outline-none"
            />
          </div>

          {error && (
            <div className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-primary font-serif text-sm font-bold text-white transition hover:bg-text-strong disabled:opacity-50"
          >
            {loading ? "로그인 중..." : "로그인"}
          </button>
        </form>

        <div className="mt-6 flex flex-col items-center gap-2 text-center text-xs text-text-muted">
          <p>
            아직 계정이 없으신가요?{" "}
            <Link href="/portal/signup" className="font-bold text-primary hover:underline">
              가입하기
            </Link>
          </p>
          <Link href="/portal/forgot" className="hover:text-primary">
            비밀번호를 잊으셨나요?
          </Link>
        </div>
      </div>

      <p className="mt-6 text-center text-xs text-text-muted">
        접수번호만 알고 있다면{" "}
        <Link href="/track" className="font-bold text-primary hover:underline">
          진행상황 조회
        </Link>{" "}
        를 사용하세요.
      </p>
    </div>
  );
}
