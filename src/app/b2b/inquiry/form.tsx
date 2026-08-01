"use client";

import { useState } from "react";

export function B2BInquiryForm() {
  const [company, setCompany] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [expectedMonthly, setExpectedMonthly] = useState<number | "">("");
  const [nationalities, setNationalities] = useState("");
  const [timeline, setTimeline] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [agreed, setAgreed] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!agreed) {
      setError("개인정보 수집·이용에 동의해 주세요.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/public/b2b-inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company,
          contactName,
          email,
          phone,
          expectedMonthly: expectedMonthly === "" ? undefined : Number(expectedMonthly),
          nationalities,
          timeline,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error ?? "failed");
      setDone(true);
    } catch {
      setError("접수 실패. 잠시 후 다시 시도해 주세요.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-xl border border-primary/40 bg-gold-soft/20 p-6">
        <h2 className="font-serif text-lg font-bold text-primary">접수되었습니다.</h2>
        <p className="mt-2 text-sm text-text-muted">
          영업일 기준 24시간 내 담당 파트너가 회신드립니다.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <label className="block">
        <span className="text-sm font-semibold text-text-strong">회사명 *</span>
        <input
          required
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm"
        />
      </label>
      <label className="block">
        <span className="text-sm font-semibold text-text-strong">담당자 *</span>
        <input
          required
          value={contactName}
          onChange={(e) => setContactName(e.target.value)}
          className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm"
        />
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
        <span className="text-sm font-semibold text-text-strong">월 예상 처리 건수 *</span>
        <input
          required
          type="number"
          min={1}
          value={expectedMonthly}
          onChange={(e) =>
            setExpectedMonthly(e.target.value === "" ? "" : Number(e.target.value))
          }
          className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm"
        />
      </label>
      <label className="block">
        <span className="text-sm font-semibold text-text-strong">주요 국적</span>
        <input
          placeholder="예: 베트남, 인도, 미국"
          value={nationalities}
          onChange={(e) => setNationalities(e.target.value)}
          className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm"
        />
      </label>
      <label className="block">
        <span className="text-sm font-semibold text-text-strong">목표 기간</span>
        <input
          placeholder="예: 2개월 내 착수"
          value={timeline}
          onChange={(e) => setTimeline(e.target.value)}
          className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm"
        />
      </label>
      <label className="flex items-start gap-2 text-xs leading-5 text-text-muted">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-line"
        />
        <span>
          [필수] 개인정보(담당자명·이메일·전화) 수집·이용에 동의합니다.{" "}
          <a href="/privacy" target="_blank" rel="noreferrer" className="text-primary underline">개인정보처리방침</a>
        </span>
      </label>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-primary py-3 text-sm font-bold text-white disabled:opacity-50"
      >
        {submitting ? "전송 중..." : "상담 신청"}
      </button>
    </form>
  );
}
