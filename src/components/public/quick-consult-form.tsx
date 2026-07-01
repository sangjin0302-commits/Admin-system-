"use client";

import { useState, type FormEvent } from "react";

const CATEGORIES = ["비자·체류", "행정심판", "인허가", "법인", "기타"] as const;

type Category = (typeof CATEGORIES)[number];

/** 010-0000-0000 형태로 가볍게 자동 하이픈 */
function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

/**
 * 모바일 최적화 4필드 퀵 상담폼.
 * - 이름 / 연락처 / 분야(라디오 칩) / 내용(선택)
 * - 탭 타깃 ≥48px, 본문 텍스트 ≥16px (iOS 확대 방지)
 */
export function QuickConsultForm() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [category, setCategory] = useState<Category>(CATEGORIES[0]);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const nameInvalid = name.trim().length < 2;
  const phoneInvalid = phone.replace(/\D/g, "").length < 9;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (nameInvalid || phoneInvalid) {
      setError(
        nameInvalid
          ? "이름을 2자 이상 입력해 주세요."
          : "연락 가능한 전화번호를 입력해 주세요."
      );
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/public/lead-capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone,
          category: message.trim()
            ? `${category} — ${message.trim().slice(0, 300)}`
            : category,
          source: "quick_form",
        }),
      });
      if (!res.ok) {
        setError("접수 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
        return;
      }
      setDone(true);
    } catch {
      setError("접수 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div
        className="ethos-card p-8 text-center"
        data-funnel="quick_consult_form"
        role="status"
      >
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
          <svg
            viewBox="0 0 24 24"
            className="h-7 w-7 text-emerald-700"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            aria-hidden
          >
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </span>
        <p className="mt-4 font-serif text-lg font-bold text-text-strong">
          접수 완료. 곧 연락드리겠습니다.
        </p>
        <p className="mt-2 text-sm text-text-muted">
          영업시간 내 30분 이내 연락드립니다.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="ethos-card p-6 sm:p-8"
      data-funnel="quick_consult_form"
      noValidate
    >
      <p className="font-serif text-[11px] font-bold uppercase tracking-[0.2em] text-gold-deep">
        Quick Consult
      </p>
      <h3 className="ethos-display mt-2 text-2xl">30초 무료 검토 요청</h3>
      <p className="mt-2 text-sm text-text-muted">
        네 가지만 알려 주시면 담당 행정사가 직접 연락드립니다.
      </p>

      <div className="mt-6 space-y-5">
        <div>
          <label htmlFor="qcf-name" className="ui-label">
            이름
          </label>
          <input
            id="qcf-name"
            name="name"
            type="text"
            autoComplete="name"
            required
            maxLength={60}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="예: 김민수"
            className="ui-input min-h-12 !text-base"
          />
        </div>

        <div>
          <label htmlFor="qcf-phone" className="ui-label">
            연락처
          </label>
          <input
            id="qcf-phone"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            required
            value={phone}
            onChange={(e) => setPhone(formatPhone(e.target.value))}
            placeholder="010-0000-0000"
            className="ui-input min-h-12 !text-base"
          />
        </div>

        <fieldset>
          <legend className="ui-label">분야</legend>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <label
                key={c}
                className={`inline-flex min-h-12 cursor-pointer items-center rounded-xl border px-4 text-base font-semibold transition ${
                  category === c
                    ? "border-primary bg-primary text-white"
                    : "border-line bg-surface text-text hover:bg-gold-soft/30"
                }`}
              >
                <input
                  type="radio"
                  name="category"
                  value={c}
                  checked={category === c}
                  onChange={() => setCategory(c)}
                  className="sr-only"
                />
                {c}
              </label>
            ))}
          </div>
        </fieldset>

        <div>
          <label htmlFor="qcf-message" className="ui-label">
            내용{" "}
            <span className="ml-1 font-normal text-text-muted">(선택)</span>
          </label>
          <textarea
            id="qcf-message"
            name="message"
            rows={3}
            maxLength={300}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="간단히 상황을 알려 주세요. 비워 두셔도 됩니다."
            className="ui-textarea !text-base"
          />
        </div>
      </div>

      {error ? (
        <p className="ui-field-error-text mt-4 !text-sm" role="alert">
          {error}
        </p>
      ) : null}

      {/* SLA 배지 */}
      <p className="mt-5 inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold-soft/40 px-4 py-2 text-sm font-bold text-text-strong">
        <span aria-hidden>⏱</span> 영업시간 내 30분 이내 연락드립니다
      </p>

      <button
        type="submit"
        disabled={submitting}
        className="ethos-cta-shine mt-4 flex min-h-12 w-full items-center justify-center rounded-xl bg-primary px-6 text-base font-bold text-white transition hover:bg-text-strong disabled:opacity-50"
      >
        {submitting ? "접수 중..." : "무료 검토 요청하기"}
      </button>
      <p className="mt-3 text-center text-xs text-text-muted">
        입력하신 정보는 상담 연락 목적으로만 사용됩니다.
      </p>
    </form>
  );
}
