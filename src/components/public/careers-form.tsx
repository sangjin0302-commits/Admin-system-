"use client";

import { useState } from "react";

type Track = "fulltime" | "parttime" | "mentoring";

const TRACKS: Array<{ value: Track; label: string; hint: string }> = [
  { value: "fulltime", label: "정규직", hint: "행정사·법무 실무 풀타임" },
  { value: "parttime", label: "파트타임", hint: "프로젝트·시간제 협업" },
  { value: "mentoring", label: "멘토링", hint: "선배 행정사와의 실무 멘토링" },
];

export function CareersForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [track, setTrack] = useState<Track>("fulltime");
  const [resumeUrl, setResumeUrl] = useState("");
  const [cover, setCover] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "submitting") return;
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
        setError(body?.error ?? "지원서 접수에 실패했습니다.");
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
      setError("네트워크 오류가 발생했습니다.");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 p-6 text-sm text-green-800">
        <p className="font-semibold">지원이 정상 접수되었습니다.</p>
        <p className="mt-1">검토 후 이메일로 회신드리겠습니다. 감사합니다.</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        {TRACKS.map((t) => (
          <label
            key={t.value}
            className={`cursor-pointer rounded-xl border p-3 text-sm transition ${
              track === t.value
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/40"
            }`}
          >
            <input
              type="radio"
              name="track"
              value={t.value}
              checked={track === t.value}
              onChange={() => setTrack(t.value)}
              className="sr-only"
            />
            <div className="font-semibold text-text-strong">{t.label}</div>
            <div className="mt-1 text-xs text-text-muted">{t.hint}</div>
          </label>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <input
          type="text"
          placeholder="이름"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={60}
          className="rounded-lg border border-border px-3 py-2 text-sm"
        />
        <input
          type="email"
          placeholder="이메일"
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
          placeholder="연락처 (숫자만)"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
          maxLength={30}
          className="rounded-lg border border-border px-3 py-2 text-sm"
        />
        <input
          type="url"
          placeholder="이력서 URL (Google Drive 등, 선택)"
          value={resumeUrl}
          onChange={(e) => setResumeUrl(e.target.value)}
          maxLength={500}
          className="rounded-lg border border-border px-3 py-2 text-sm"
        />
      </div>

      <textarea
        placeholder="자기소개 및 지원 동기 (~2000자)"
        value={cover}
        onChange={(e) => setCover(e.target.value)}
        required
        maxLength={4000}
        rows={6}
        className="w-full rounded-lg border border-border px-3 py-2 text-sm"
      />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:bg-text-strong disabled:opacity-60"
      >
        {status === "submitting" ? "제출 중…" : "지원서 제출"}
      </button>
    </form>
  );
}
