"use client";

import { useCallback, useRef, useState } from "react";

import { useFeatureFlag } from "@/lib/hooks/use-feature-flag";
import { trackQuoteRequest } from "@/lib/utils/ga4-events";

/**
 * 다른 곳 견적서를 업로드해 비교 리포트를 요청하는 폼.
 * 드래그·드롭 지원 + 이름·연락처만 받는 최소 필드.
 */

const MAX_BYTES = 10 * 1024 * 1024; // 10MB
const ACCEPT = "image/png,image/jpeg,image/webp,application/pdf";

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

export function QuoteCompare() {
  const ga4Enabled = useFeatureFlag("ga4_conversion_tracking") !== false;
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const setFileSafe = useCallback((f: File | null) => {
    setError(null);
    if (!f) {
      setFile(null);
      setPreview(null);
      return;
    }
    if (f.size > MAX_BYTES) {
      setError("파일이 너무 큽니다. 10MB 이하로 업로드해 주세요.");
      return;
    }
    if (!ACCEPT.split(",").includes(f.type)) {
      setError("이미지(JPG/PNG/WEBP) 또는 PDF만 업로드할 수 있습니다.");
      return;
    }
    setFile(f);
    if (f.type.startsWith("image/")) {
      const url = URL.createObjectURL(f);
      setPreview(url);
    } else {
      setPreview(null);
    }
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!file) {
      setError("견적서 파일을 업로드해 주세요.");
      return;
    }
    if (!name.trim() || !phone.trim()) {
      setError("성함과 연락처를 입력해 주세요.");
      return;
    }
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("name", name.trim());
      fd.append("phone", phone.trim());
      if (note.trim()) fd.append("note", note.trim());
      const res = await fetch("/api/public/quote-compare", { method: "POST", body: fd });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error ?? "제출 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
        return;
      }
      // GA4 전환 이벤트 (request_quote) — 비교 견적 요청 성공 시 발화.
      if (ga4Enabled) {
        trackQuoteRequest();
      }
      setDone(true);
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-gold/30 bg-surface/95 p-6 text-center shadow-panel sm:p-8">
        <p className="ethos-eyebrow">접수 완료</p>
        <h2 className="mt-3 font-serif text-2xl font-bold text-primary">
          비교 리포트를 준비하겠습니다
        </h2>
        <p className="mt-3 text-sm leading-6 text-text-muted">
          영업일 24시간 안에 담당 행정사가 견적을 검토한 뒤,
          <br />
          항목별 비교 리포트를 문자·이메일로 회신해 드립니다.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-xl space-y-5">
      <label
        htmlFor="quote-compare-file"
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const f = e.dataTransfer.files?.[0] ?? null;
          setFileSafe(f);
        }}
        className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition ${
          dragOver
            ? "border-primary bg-gold-soft/30"
            : "border-gold/40 bg-surface/70 hover:border-primary hover:bg-gold-soft/20"
        }`}
      >
        <input
          ref={inputRef}
          id="quote-compare-file"
          type="file"
          accept={ACCEPT}
          className="sr-only"
          onChange={(e) => setFileSafe(e.target.files?.[0] ?? null)}
        />
        {preview ? (
          <img
            src={preview}
            alt="미리보기"
            className="max-h-40 rounded-lg border border-gold/30 object-contain"
          />
        ) : file ? (
          <div className="flex flex-col items-center gap-1">
            <span className="text-3xl" aria-hidden>
              📄
            </span>
            <p className="text-sm font-semibold text-primary">{file.name}</p>
          </div>
        ) : (
          <>
            <span className="text-3xl" aria-hidden>
              📎
            </span>
            <p className="text-sm font-semibold text-primary">
              견적서를 드래그하거나 클릭해 업로드
            </p>
            <p className="text-xs text-text-muted">이미지 또는 PDF · 최대 10MB</p>
          </>
        )}
        {file && (
          <p className="text-xs text-text-muted">
            {file.type} · {formatSize(file.size)}
          </p>
        )}
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1 block font-semibold text-primary">성함</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={40}
            className="h-11 w-full rounded-lg border border-gold/40 bg-surface px-3 text-sm text-text-strong focus:border-primary focus:outline-none"
            placeholder="홍길동"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-semibold text-primary">연락처</span>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            maxLength={20}
            className="h-11 w-full rounded-lg border border-gold/40 bg-surface px-3 text-sm text-text-strong focus:border-primary focus:outline-none"
            placeholder="010-0000-0000"
          />
        </label>
      </div>

      <label className="block text-sm">
        <span className="mb-1 block font-semibold text-primary">추가 요청 (선택)</span>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          maxLength={500}
          className="w-full rounded-lg border border-gold/40 bg-surface px-3 py-2 text-sm text-text-strong focus:border-primary focus:outline-none"
          placeholder="궁금한 점이나 상황을 짧게 남겨주세요."
        />
      </label>

      {error && (
        <p className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex h-12 w-full items-center justify-center rounded-lg bg-primary px-6 text-sm font-bold text-white shadow-md transition hover:bg-text-strong disabled:opacity-60"
      >
        {submitting ? "제출 중..." : "비교 리포트 요청"}
      </button>

      <p className="text-center text-xs text-text-muted">
        업로드해 주신 파일은 비교 리포트 작성 목적으로만 사용되며, 외부에 공유되지 않습니다.
      </p>
    </form>
  );
}

export default QuoteCompare;
