"use client";

import { useState, useRef } from "react";

type OcrResponse = {
  ok: boolean;
  result?: {
    text: string;
    type: string;
    confidence: number;
    reason?: string;
    fields?: Record<string, string>;
    usedVision: boolean;
  };
  error?: string;
};

export function DocumentOcrClient({ supportedTypes }: { supportedTypes: string[] }) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<OcrResponse["result"] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attachKind, setAttachKind] = useState<"none" | "inquiry" | "case">("none");
  const [attachId, setAttachId] = useState("");
  const [savedType, setSavedType] = useState<string | null>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  function pickFile(f: File | null) {
    setError(null);
    setResult(null);
    setSavedType(null);
    if (!f) {
      setFile(null);
      setPreview(null);
      return;
    }
    if (!f.type.startsWith("image/")) {
      setError("이미지 파일만 업로드 가능합니다.");
      return;
    }
    setFile(f);
    const reader = new FileReader();
    reader.onload = () => setPreview(typeof reader.result === "string" ? reader.result : null);
    reader.readAsDataURL(f);
  }

  async function runOcr() {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      if (attachKind !== "none" && attachId.trim()) {
        if (attachKind === "inquiry") form.append("inquiryId", attachId.trim());
        else form.append("caseId", attachId.trim());
      }
      const res = await fetch("/api/admin/document-ocr", { method: "POST", body: form });
      const data = (await res.json().catch(() => ({}))) as OcrResponse;
      if (!res.ok || !data.ok || !data.result) {
        setError(data.error ?? `OCR 실패 (${res.status})`);
      } else {
        setResult(data.result);
        setSavedType(data.result.type);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-line bg-surface p-6 shadow-panel">
        <h2 className="font-serif text-lg font-bold text-primary">1. 이미지 업로드</h2>
        <div
          ref={dropRef}
          onDragOver={(e) => { e.preventDefault(); dropRef.current?.classList.add("bg-surface-muted"); }}
          onDragLeave={() => dropRef.current?.classList.remove("bg-surface-muted")}
          onDrop={(e) => {
            e.preventDefault();
            dropRef.current?.classList.remove("bg-surface-muted");
            pickFile(e.dataTransfer.files?.[0] ?? null);
          }}
          className="mt-4 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-line bg-surface-muted/40 p-8 text-center transition"
        >
          {preview ? (
            <>
              <img src={preview} alt="미리보기" className="max-h-64 rounded-lg border border-line" />
              <p className="mt-2 text-xs text-text-muted">{file?.name}</p>
            </>
          ) : (
            <>
              <p className="text-sm text-text-muted">이미지를 드래그하거나 선택하세요.</p>
              <p className="text-xs text-text-muted">여권 / 비자 / 등본 / 계약서 / 판결문 등</p>
            </>
          )}
          <input
            type="file"
            accept="image/*"
            onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
            className="mt-3 text-xs"
          />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <label className="block">
            <span className="text-xs font-medium text-text-muted">첨부 대상</span>
            <select
              value={attachKind}
              onChange={(e) => setAttachKind(e.target.value as typeof attachKind)}
              className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm"
            >
              <option value="none">첨부 안 함</option>
              <option value="inquiry">문의</option>
              <option value="case">사건</option>
            </select>
          </label>
          {attachKind !== "none" ? (
            <label className="block sm:col-span-2">
              <span className="text-xs font-medium text-text-muted">대상 ID</span>
              <input
                type="text"
                value={attachId}
                onChange={(e) => setAttachId(e.target.value)}
                placeholder={attachKind === "inquiry" ? "문의 ID" : "사건 ID"}
                className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm font-mono"
              />
            </label>
          ) : null}
        </div>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={runOcr}
            disabled={!file || loading}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-text-strong disabled:opacity-50"
          >
            {loading ? "분석중…" : "OCR + 분류 실행"}
          </button>
          <button
            type="button"
            onClick={() => { setFile(null); setPreview(null); setResult(null); setError(null); setSavedType(null); }}
            className="rounded-lg border border-line bg-white px-4 py-2 text-sm text-text-muted hover:bg-surface-muted"
          >
            초기화
          </button>
        </div>

        {error ? (
          <p className="mt-3 rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
        ) : null}
      </section>

      {result ? (
        <section className="rounded-2xl border border-line bg-surface p-6 shadow-panel">
          <h2 className="font-serif text-lg font-bold text-primary">2. 결과</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-line bg-surface-muted p-3">
              <p className="text-xs text-text-muted">분류</p>
              <p className="mt-1 text-lg font-bold text-primary">{savedType ?? result.type}</p>
            </div>
            <div className="rounded-lg border border-line bg-surface-muted p-3">
              <p className="text-xs text-text-muted">신뢰도</p>
              <p className="mt-1 text-lg font-bold text-text-strong">{Math.round(result.confidence * 100)}%</p>
            </div>
            <div className="rounded-lg border border-line bg-surface-muted p-3">
              <p className="text-xs text-text-muted">엔진</p>
              <p className="mt-1 text-sm font-medium text-text-strong">
                {result.usedVision ? "Claude Vision" : "대체 OCR"}
              </p>
            </div>
          </div>

          {result.reason ? (
            <p className="mt-3 text-xs text-text-muted">분류 근거: {result.reason}</p>
          ) : null}

          {result.fields && Object.keys(result.fields).length > 0 ? (
            <div className="mt-4">
              <p className="text-xs font-medium text-text-muted">추출 필드</p>
              <dl className="mt-2 grid gap-2 sm:grid-cols-2">
                {Object.entries(result.fields).map(([k, v]) => (
                  <div key={k} className="rounded border border-line bg-white p-2 text-xs">
                    <dt className="font-medium text-text-muted">{k}</dt>
                    <dd className="mt-0.5 text-text-strong">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ) : null}

          <div className="mt-4">
            <p className="text-xs font-medium text-text-muted">추출 텍스트</p>
            <textarea
              readOnly
              value={result.text}
              rows={10}
              className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 font-mono text-xs"
            />
          </div>

          <div className="mt-3 text-xs text-text-muted">
            지원 유형: {supportedTypes.join(" / ")}
          </div>
        </section>
      ) : null}
    </div>
  );
}
