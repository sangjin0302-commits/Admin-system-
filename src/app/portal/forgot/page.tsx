"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";


export default function ForgotPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/portal/password-forgot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });
    setLoading(false);
    setSent(true);
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:py-20">
      <div className="text-center">
        <p className="font-serif text-xs uppercase tracking-[0.3em] text-gold-deep">Password Reset</p>
        <h1 className="mt-3 font-serif text-3xl font-bold text-primary">비밀번호 재설정</h1>
      </div>

      <div className="ethos-card mt-8 p-7">
        {sent ? (
          <div className="text-center">
            <p className="text-sm text-text">
              입력하신 이메일이 등록된 계정이면 재설정 링크를 발송했습니다.
              <br />
              메일함을 확인해 주세요. (1시간 이내 유효)
            </p>
            <Link href="/portal/signin" className="mt-6 inline-block text-xs font-bold text-primary hover:underline">
              로그인으로 돌아가기
            </Link>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="font-serif text-sm font-bold text-primary">이메일</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1 w-full rounded-lg border border-gold/40 bg-surface px-4 py-2.5 text-sm focus:border-gold focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-primary font-serif text-sm font-bold text-white hover:bg-text-strong disabled:opacity-50"
            >
              {loading ? "발송 중..." : "재설정 링크 받기"}
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
