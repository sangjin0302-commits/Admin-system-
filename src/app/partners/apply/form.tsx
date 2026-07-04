"use client";

import { useState } from "react";

type Category = "lawyer" | "tax" | "accountant" | "other";

const CATEGORIES: { value: Category; label: string }[] = [
  { value: "lawyer", label: "변호사" },
  { value: "tax", label: "세무사" },
  { value: "accountant", label: "회계사" },
  { value: "other", label: "기타" },
];

export function ApplyForm() {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<Category>("lawyer");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [expected, setExpected] = useState<number | "">("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ referralCode: string } | null>(null);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/public/partners/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          category,
          email,
          phone,
          expectedMonthlyReferrals: expected === "" ? undefined : Number(expected),
          notes,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error ?? "failed");
      setResult({ referralCode: json.referralCode });
    } catch {
      setError("신청 실패. 잠시 후 다시 시도해 주세요.");
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    return (
      <div className="rounded-xl border border-primary/40 bg-gold-soft/20 p-6">
        <h2 className="font-serif text-lg font-bold text-primary">신청이 접수되었습니다.</h2>
        <p className="mt-2 text-sm text-text-muted">
          승인 후 이메일로 안내드립니다. 개인 추천 코드는 아래와 같습니다:
        </p>
        <p className="mt-3 font-mono text-lg font-bold">{result.referralCode}</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <label className="block">
        <span className="text-sm font-semibold text-text-strong">이름 *</span>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm"
        />
      </label>
      <label className="block">
        <span className="text-sm font-semibold text-text-strong">분야 *</span>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as Category)}
          className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm"
        >
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="text-sm font-semibold text-text-strong">이메일 *</span>
        <input
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm"
        />
      </label>
      <label className="block">
        <span className="text-sm font-semibold text-text-strong">전화</span>
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm"
        />
      </label>
      <label className="block">
        <span className="text-sm font-semibold text-text-strong">월 예상 소개 건수</span>
        <input
          type="number"
          min={0}
          value={expected}
          onChange={(e) => setExpected(e.target.value === "" ? "" : Number(e.target.value))}
          className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm"
        />
      </label>
      <label className="block">
        <span className="text-sm font-semibold text-text-strong">메모</span>
        <textarea
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm"
        />
      </label>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-primary py-3 text-sm font-bold text-white disabled:opacity-50"
      >
        {submitting ? "신청 중..." : "신청하기"}
      </button>
    </form>
  );
}
