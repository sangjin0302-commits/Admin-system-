"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";


export default function SignUpPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "", name: "", phone: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);

  function set(k: keyof typeof form, v: string) {
    setForm((prev) => ({ ...prev, [k]: v }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!agreed) {
      setError("개인정보 수집·이용에 동의해 주세요.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/portal/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      setLoading(false);
      if (!data.ok) {
        setError(data.error ?? "가입에 실패했습니다.");
        return;
      }
      router.push("/portal/signin?registered=1");
    } catch {
      setLoading(false);
      setError("네트워크 오류입니다. 잠시 후 다시 시도해 주세요.");
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:py-20">
      <div className="text-center">
        <p className="font-serif text-xs uppercase tracking-[0.3em] text-gold-deep">Client Portal</p>
        <h1 className="mt-3 font-serif text-3xl font-bold text-primary">의뢰인 가입</h1>
        <p className="mt-2 text-sm text-text-muted">진행 상황 조회·자료 업로드를 위한 계정을 만드세요.</p>
      </div>

      <div className="ethos-card mt-8 p-7">
        <form onSubmit={onSubmit} className="space-y-4" aria-label="의뢰인 가입 양식">
          {(
            [
              { k: "name", label: "이름", type: "text", required: true, autoComplete: "name" },
              { k: "email", label: "이메일", type: "email", required: true, autoComplete: "email" },
              { k: "phone", label: "연락처 (선택)", type: "tel", required: false, autoComplete: "tel" },
              {
                k: "password",
                label: "비밀번호 (영문+숫자 10자 이상)",
                type: "password",
                required: true,
                autoComplete: "new-password"
              }
            ] as const
          ).map((f) => (
            <div key={f.k}>
              <label htmlFor={`signup-${f.k}`} className="font-serif text-sm font-bold text-primary">{f.label}</label>
              <input
                id={`signup-${f.k}`}
                type={f.type}
                value={form[f.k]}
                onChange={(e) => set(f.k, e.target.value)}
                required={f.required}
                autoComplete={f.autoComplete}
                className="mt-1 w-full rounded-lg border border-gold/40 bg-surface px-4 py-2.5 text-sm focus:border-gold focus:outline-none"
              />
            </div>
          ))}

          <label className="flex items-start gap-2 text-xs leading-5 text-text-muted">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-gold/40"
            />
            <span>
              [필수] 계정 생성을 위한 개인정보(이름·이메일·연락처) 수집·이용에 동의합니다.{" "}
              <Link href="/privacy" target="_blank" className="text-primary underline">개인정보처리방침</Link>
            </span>
          </label>

          {error && (
            <div role="alert" className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-primary font-serif text-sm font-bold text-white transition hover:bg-text-strong disabled:opacity-50"
          >
            {loading ? "가입 중..." : "가입하기"}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-text-muted">
          이미 계정이 있으신가요?{" "}
          <Link href="/portal/signin" className="font-bold text-primary hover:underline">
            로그인
          </Link>
        </div>
      </div>
    </div>
  );
}
