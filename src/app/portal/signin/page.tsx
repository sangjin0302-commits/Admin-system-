"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Suspense, useState, type FormEvent } from "react";

function SignInForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const callbackUrl = sp.get("callbackUrl") ?? "/portal";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [totp, setTotp] = useState("");
  const [step, setStep] = useState<"credentials" | "totp">("credentials");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function tryFinalSignIn(totpCode?: string) {
    const res = await signIn("credentials", {
      email,
      password,
      totp: totpCode ?? "",
      redirect: false,
    });
    if (!res?.ok) return false;
    router.push(callbackUrl);
    router.refresh();
    return true;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (step === "totp") {
      const ok = await tryFinalSignIn(totp);
      setLoading(false);
      if (!ok) setError("2FA 코드가 올바르지 않습니다.");
      return;
    }

    // step === "credentials" — 비번 1차 검증 + 2FA 필요 여부 판단
    try {
      const pre = await fetch("/api/auth/2fa-required", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await pre.json().catch(() => ({}));
      if (!data?.ok) {
        setLoading(false);
        setError("이메일 또는 비밀번호가 올바르지 않습니다.");
        return;
      }
      if (data.twoFactorRequired) {
        setLoading(false);
        setStep("totp");
        return;
      }
      const ok = await tryFinalSignIn();
      setLoading(false);
      if (!ok) setError("로그인 실패");
    } catch {
      setLoading(false);
      setError("네트워크 오류");
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" aria-label="로그인 양식">
      <div>
        <label htmlFor="signin-email" className="font-serif text-sm font-bold text-primary">이메일</label>
        <input
          id="signin-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          disabled={step === "totp"}
          className="mt-1 w-full rounded-lg border border-gold/40 bg-surface px-4 py-2.5 text-sm focus:border-gold focus:outline-none disabled:bg-surface-muted"
        />
      </div>
      <div>
        <label htmlFor="signin-password" className="font-serif text-sm font-bold text-primary">비밀번호</label>
        <input
          id="signin-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          disabled={step === "totp"}
          className="mt-1 w-full rounded-lg border border-gold/40 bg-surface px-4 py-2.5 text-sm focus:border-gold focus:outline-none disabled:bg-surface-muted"
        />
      </div>

      {step === "totp" && (
        <div>
          <label htmlFor="signin-totp" className="font-serif text-sm font-bold text-primary">2FA 코드</label>
          <input
            id="signin-totp"
            type="text"
            inputMode="numeric"
            pattern="\d{6}"
            maxLength={6}
            value={totp}
            onChange={(e) => setTotp(e.target.value.replace(/\D/g, "").slice(0, 6))}
            required
            autoFocus
            placeholder="123456"
            className="mt-1 w-full rounded-lg border border-gold/40 bg-surface px-4 py-2.5 text-center font-mono text-lg tracking-[0.4em] focus:border-gold focus:outline-none"
          />
          <p className="mt-1 text-xs text-text-muted">
            인증앱이 표시하는 6자리 코드를 입력하세요.
            <button
              type="button"
              onClick={() => {
                setStep("credentials");
                setTotp("");
                setError(null);
              }}
              className="ml-2 text-primary underline"
            >
              뒤로
            </button>
          </p>
        </div>
      )}

      {error && (
        <div role="alert" className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      <button
        type="submit"
        disabled={loading || (step === "totp" && totp.length !== 6)}
        className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-primary font-serif text-sm font-bold text-white transition hover:bg-text-strong disabled:opacity-50"
      >
        {loading ? "로그인 중..." : step === "totp" ? "코드 확인" : "로그인"}
      </button>
    </form>
  );
}

function FormFallback() {
  return (
    <div className="space-y-4">
      <div className="h-12 rounded-lg bg-surface-muted" />
      <div className="h-12 rounded-lg bg-surface-muted" />
      <div className="h-11 rounded-lg bg-surface-muted" />
    </div>
  );
}

export default function SignInPage() {
  return (
    <div className="relative min-h-[80vh] overflow-hidden">
      <div className="ethos-aurora ethos-aurora-animated" aria-hidden />

      <div className="mx-auto grid max-w-5xl items-center gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1.1fr_0.9fr]">
        {/* 좌: 브랜드 안내 */}
        <div className="hidden lg:block">
          <div className="ethos-grain relative overflow-hidden rounded-[28px] border border-gold/30 ethos-dark-card-v px-10 py-14 shadow-floating">
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-gold to-transparent" />
            <p className="font-serif text-[11px] font-bold uppercase tracking-[0.3em] text-gold-soft">ETHOS 행정사사무소</p>
            <h2 className="mt-6 font-serif text-3xl font-bold leading-snug text-white">
              사건 진행 상황을
              <br />
              직접 확인하세요
            </h2>
            <div className="my-8 h-px bg-gradient-to-r from-gold/40 to-transparent" />
            <ul className="space-y-4">
              {[
                { icon: "📋", text: "사건 진행 단계와 다음 할 일 확인" },
                { icon: "📎", text: "필요 자료 업로드 및 서명" },
                { icon: "💬", text: "담당자 메시지 확인" },
              ].map((item) => (
                <li key={item.text} className="flex items-center gap-3 text-sm text-white/80">
                  <span className="text-lg">{item.icon}</span>
                  {item.text}
                </li>
              ))}
            </ul>
            <div className="absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
          </div>
        </div>

        {/* 우: 로그인 + 접수번호 조회 */}
        <div>
          <div className="text-center lg:text-left">
            <p className="font-serif text-xs uppercase tracking-[0.3em] text-gold-deep">Client Portal</p>
            <h1 className="mt-3 font-serif text-3xl font-bold text-primary">로그인</h1>
          </div>

          <div className="ethos-card mt-6 p-7">
            <Suspense fallback={<FormFallback />}>
              <SignInForm />
            </Suspense>

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

          {/* 접수번호 간편 조회 */}
          <div className="mt-4 rounded-2xl border border-gold/30 bg-gold-soft/15 px-6 py-5">
            <p className="font-serif text-sm font-bold text-primary">접수번호로 간편 조회</p>
            <p className="mt-1 text-xs text-text-muted">계정 없이 접수번호만으로 진행상황을 확인할 수 있습니다.</p>
            <Link
              href="/track"
              className="mt-3 inline-flex h-10 items-center rounded-lg border border-gold/40 bg-surface px-5 text-sm font-semibold text-primary transition hover:bg-gold-soft/30"
            >
              접수번호로 조회하기 →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
