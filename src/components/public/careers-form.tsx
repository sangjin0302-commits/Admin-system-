"use client";

import { useState } from "react";

type Track = "fulltime" | "parttime" | "mentoring";

type Lang = "ko" | "en";

const COPY = {
  ko: {
    tracks: [
      { value: "fulltime" as Track, label: "정규직", hint: "행정사·법무 실무 풀타임" },
      { value: "parttime" as Track, label: "파트타임", hint: "프로젝트·시간제 협업" },
      { value: "mentoring" as Track, label: "멘토링", hint: "선배 행정사와의 실무 멘토링" }
    ],
    applyFailed: "지원서 접수에 실패했습니다.",
    networkError: "네트워크 오류가 발생했습니다.",
    successTitle: "지원이 정상 접수되었습니다.",
    successBody: "검토 후 이메일로 회신드리겠습니다. 감사합니다.",
    namePlaceholder: "이름",
    emailPlaceholder: "이메일",
    phonePlaceholder: "연락처 (숫자만)",
    resumePlaceholder: "이력서 URL (Google Drive 등, 선택)",
    coverPlaceholder: "자기소개 및 지원 동기 (~2000자)",
    submitting: "제출 중…",
    submit: "지원서 제출"
  },
  en: {
    tracks: [
      { value: "fulltime" as Track, label: "Full-time", hint: "Full-time administrative and legal practice" },
      { value: "parttime" as Track, label: "Part-time", hint: "Project-based or part-time collaboration" },
      { value: "mentoring" as Track, label: "Mentorship", hint: "Hands-on mentoring with a senior attorney" }
    ],
    applyFailed: "Failed to submit your application.",
    networkError: "A network error occurred.",
    successTitle: "Your application has been received.",
    successBody: "We'll review it and reply by email. Thank you.",
    namePlaceholder: "Name",
    emailPlaceholder: "Email",
    phonePlaceholder: "Phone (digits only)",
    resumePlaceholder: "Resume URL (Google Drive, etc. — optional)",
    coverPlaceholder: "Introduce yourself and your motivation (~2,000 characters)",
    submitting: "Submitting…",
    submit: "Submit Application"
  }
} as const;

export function CareersForm({ lang = "ko" }: { lang?: Lang }) {
  const t = COPY[lang];
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [track, setTrack] = useState<Track>("fulltime");
  const [resumeUrl, setResumeUrl] = useState("");
  const [cover, setCover] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "submitting") return;
    if (!agreed) {
      setStatus("error");
      setError(lang === "en" ? "Please agree to the collection of personal data." : "개인정보 수집·이용에 동의해 주세요.");
      return;
    }
    setStatus("submitting");
    setError(null);
    try {
      const res = await fetch("/api/public/careers/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, track, resumeUrl, cover }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body?.ok) {
        setError(body?.error ?? t.applyFailed);
        setStatus("error");
        return;
      }
      setStatus("success");
      setName("");
      setEmail("");
      setPhone("");
      setResumeUrl("");
      setCover("");
    } catch {
      setError(t.networkError);
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 p-6 text-sm text-green-800">
        <p className="font-semibold">{t.successTitle}</p>
        <p className="mt-1">{t.successBody}</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        {t.tracks.map((option) => (
          <label
            key={option.value}
            className={`cursor-pointer rounded-xl border p-3 text-sm transition ${
              track === option.value
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/40"
            }`}
          >
            <input
              type="radio"
              name="track"
              value={option.value}
              checked={track === option.value}
              onChange={() => setTrack(option.value)}
              className="sr-only"
            />
            <div className="font-semibold text-text-strong">{option.label}</div>
            <div className="mt-1 text-xs text-text-muted">{option.hint}</div>
          </label>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <input
          type="text"
          placeholder={t.namePlaceholder}
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={60}
          className="rounded-lg border border-border px-3 py-2 text-sm"
        />
        <input
          type="email"
          placeholder={t.emailPlaceholder}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          maxLength={120}
          className="rounded-lg border border-border px-3 py-2 text-sm"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <input
          type="tel"
          placeholder={t.phonePlaceholder}
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
          maxLength={30}
          className="rounded-lg border border-border px-3 py-2 text-sm"
        />
        <input
          type="url"
          placeholder={t.resumePlaceholder}
          value={resumeUrl}
          onChange={(e) => setResumeUrl(e.target.value)}
          maxLength={500}
          className="rounded-lg border border-border px-3 py-2 text-sm"
        />
      </div>

      <textarea
        placeholder={t.coverPlaceholder}
        value={cover}
        onChange={(e) => setCover(e.target.value)}
        required
        maxLength={4000}
        rows={6}
        className="w-full rounded-lg border border-border px-3 py-2 text-sm"
      />

      <label className="flex items-start gap-2 text-xs leading-5 text-text-muted">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-line"
        />
        <span>
          {lang === "en"
            ? "[Required] I agree to the collection/use of my personal data (name, email, phone, resume) for recruitment. "
            : "[필수] 채용 검토를 위한 개인정보(이름·이메일·전화·이력서) 수집·이용에 동의합니다. "}
          <a href="/privacy" target="_blank" rel="noreferrer" className="text-primary underline">
            {lang === "en" ? "Privacy Policy" : "개인정보처리방침"}
          </a>
        </span>
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:bg-text-strong disabled:opacity-60"
      >
        {status === "submitting" ? t.submitting : t.submit}
      </button>
    </form>
  );
}
