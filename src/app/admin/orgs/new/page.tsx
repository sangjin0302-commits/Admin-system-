"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { AdminPageHeader } from "@/components/admin/admin-page-header";

type Step = 0 | 1 | 2 | 3;

type FormState = {
  name: string;
  subdomain: string;
  addressLine: string;
  contactPhone: string;
  adminName: string;
  adminEmail: string;
  plan: "FREE" | "PRO" | "ENTERPRISE";
};

const INITIAL: FormState = {
  name: "",
  subdomain: "",
  addressLine: "",
  contactPhone: "",
  adminName: "",
  adminEmail: "",
  plan: "PRO",
};

export default function OrgOnboardingWizardPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(0);
  const [form, setForm] = useState<FormState>(INITIAL);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function validateStep(current: Step): string | null {
    if (current === 0 && !form.name.trim()) return "사무소 이름을 입력하세요.";
    if (current === 0 && !/^[a-z0-9-]{3,32}$/.test(form.subdomain.trim().toLowerCase()))
      return "서브도메인은 3-32자, 소문자/숫자/하이픈만 가능합니다.";
    if (current === 1 && !form.addressLine.trim()) return "주소를 입력하세요.";
    if (current === 2 && !form.adminEmail.trim()) return "관리자 이메일을 입력하세요.";
    return null;
  }

  function next() {
    const err = validateStep(step);
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    setStep((step + 1) as Step);
  }

  function back() {
    setError(null);
    if (step > 0) setStep((step - 1) as Step);
  }

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/orgs/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? res.statusText);
        return;
      }
      setStep(3);
      setTimeout(() => router.push("/admin"), 1500);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        kicker="Onboarding"
        title="새 사무소 온보딩"
        description={`단계 ${Math.min(step + 1, 4)} / 4`}
      />

      <Card className="p-5">
        {step === 0 && (
          <div className="space-y-4">
            <h2 className="text-sm font-semibold">1. 사무소 이름</h2>
            <Field label="사무소 이름" value={form.name} onChange={(v) => update("name", v)} />
            <Field
              label="서브도메인 (예: ethos)"
              value={form.subdomain}
              onChange={(v) => update("subdomain", v.toLowerCase())}
            />
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-sm font-semibold">2. 주소 · 연락처</h2>
            <Field label="주소" value={form.addressLine} onChange={(v) => update("addressLine", v)} />
            <Field label="대표 전화" value={form.contactPhone} onChange={(v) => update("contactPhone", v)} />
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-sm font-semibold">3. 관리자 계정</h2>
            <Field label="관리자 이름" value={form.adminName} onChange={(v) => update("adminName", v)} />
            <Field label="관리자 이메일" value={form.adminEmail} onChange={(v) => update("adminEmail", v)} />
            <div>
              <label className="text-xs text-text-muted">플랜</label>
              <select
                value={form.plan}
                onChange={(e) => update("plan", e.target.value as FormState["plan"])}
                className="mt-1 block w-full rounded border border-border bg-surface px-3 py-2 text-sm"
              >
                <option value="FREE">FREE</option>
                <option value="PRO">PRO</option>
                <option value="ENTERPRISE">ENTERPRISE</option>
              </select>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3 py-6 text-center">
            <div className="text-lg font-semibold text-emerald-600">완료!</div>
            <div className="text-sm text-text-muted">사무소가 생성되었습니다. 관리자 홈으로 이동합니다...</div>
          </div>
        )}

        {error && <div className="mt-4 rounded bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}

        {step < 3 && (
          <div className="mt-6 flex justify-between">
            <button
              onClick={back}
              disabled={step === 0 || busy}
              className="rounded border border-border px-4 py-2 text-sm disabled:opacity-50"
            >
              이전
            </button>
            {step < 2 ? (
              <button
                onClick={next}
                disabled={busy}
                className="rounded bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50"
              >
                다음
              </button>
            ) : (
              <button
                onClick={submit}
                disabled={busy}
                className="rounded bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50"
              >
                {busy ? "생성 중..." : "완료"}
              </button>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-xs text-text-muted">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 block w-full rounded border border-border bg-surface px-3 py-2 text-sm"
      />
    </div>
  );
}
