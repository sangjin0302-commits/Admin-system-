"use client";

import { useState } from "react";
import { FRANCHISE_PLANS } from "@/lib/services/franchise-types";

type PlanKey = keyof typeof FRANCHISE_PLANS;

export function ApplyForm({ initialPlan }: { initialPlan: PlanKey }) {
  const [state, setState] = useState<{ ok?: boolean; error?: string; submitting: boolean }>({ submitting: false });

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setState({ submitting: true });
    const res = await fetch("/api/franchise/apply", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        orgName: fd.get("orgName"),
        contactName: fd.get("contactName"),
        adminEmail: fd.get("adminEmail"),
        plan: fd.get("plan"),
        estimatedCases: Number(fd.get("estimatedCases") ?? 0),
        note: fd.get("note"),
      }),
    });
    const j = await res.json().catch(() => ({}));
    if (res.ok && j?.ok) setState({ ok: true, submitting: false });
    else setState({ error: j?.error ?? "SUBMIT_FAILED", submitting: false });
  }

  if (state.ok) {
    return (
      <div className="rounded-lg border border-primary bg-primary/5 p-6 text-primary">
        신청이 접수되었습니다. 담당자가 곧 회신드립니다.
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field name="orgName" label="사무소명" required />
      <Field name="contactName" label="담당자명" required />
      <Field name="adminEmail" label="이메일" type="email" required />
      <div>
        <label className="block text-sm font-semibold">관심 플랜</label>
        <select name="plan" defaultValue={initialPlan} className="mt-1 w-full rounded border border-line px-3 py-2">
          {(Object.keys(FRANCHISE_PLANS) as PlanKey[]).map((k) => (
            <option key={k} value={k}>
              {FRANCHISE_PLANS[k].label}
            </option>
          ))}
        </select>
      </div>
      <Field name="estimatedCases" label="월 예상 사건 수" type="number" />
      <div>
        <label className="block text-sm font-semibold">문의사항</label>
        <textarea name="note" rows={4} className="mt-1 w-full rounded border border-line px-3 py-2" />
      </div>
      {state.error && <p className="text-sm text-red-600">오류: {state.error}</p>}
      <button
        type="submit"
        disabled={state.submitting}
        className="w-full rounded-lg bg-primary py-3 font-bold text-white disabled:opacity-50"
      >
        {state.submitting ? "제출 중..." : "가맹 신청"}
      </button>
    </form>
  );
}

function Field({ name, label, type = "text", required }: { name: string; label: string; type?: string; required?: boolean }) {
  return (
    <div>
      <label className="block text-sm font-semibold">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input name={name} type={type} required={required} className="mt-1 w-full rounded border border-line px-3 py-2" />
    </div>
  );
}
