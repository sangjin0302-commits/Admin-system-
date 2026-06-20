"use client";

import { useState } from "react";
import type { VisionAnalysisResult } from "@/lib/services/vision-analysis-service";

type AnalysisType = "document" | "id" | "form" | "scene";

const TYPES: { value: AnalysisType; label: string }[] = [
  { value: "document", label: "문서" },
  { value: "id", label: "신분증" },
  { value: "form", label: "양식" },
  { value: "scene", label: "현장/장면" },
];

export function VisionUploader() {
  const [analysisType, setAnalysisType] = useState<AnalysisType>("document");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<VisionAnalysisResult | null>(null);

  async function fileToBase64(f: File): Promise<string> {
    const buf = await f.arrayBuffer();
    let binary = "";
    const bytes = new Uint8Array(buf);
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  }

  function onFileChange(f: File | null) {
    setFile(f);
    if (f) {
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result as string);
      reader.readAsDataURL(f);
    } else {
      setPreview(null);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const base64 = await fileToBase64(file);
      const res = await fetch("/api/admin/vision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: base64,
          mimeType: file.type || "image/jpeg",
          analysisType,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as { result: VisionAnalysisResult };
      setResult(json.result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {TYPES.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setAnalysisType(t.value)}
            className={
              analysisType === t.value ? "ui-button-primary" : "ui-button-secondary"
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      <form onSubmit={onSubmit} className="space-y-3">
        <input
          type="file"
          accept="image/*"
          onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
          className="block w-full text-sm"
        />
        {preview && (
          <img
            src={preview}
            alt="preview"
            className="max-h-64 rounded border border-line"
          />
        )}
        <button
          type="submit"
          disabled={!file || loading}
          className="ui-button-primary"
        >
          {loading ? "분석 중..." : "분석"}
        </button>
      </form>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {result && (
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-text-strong">설명</h3>
            <p className="mt-1 text-sm text-text-muted">{result.description}</p>
          </div>

          {result.classifications.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-text-strong">분류</h3>
              <div className="mt-1 flex flex-wrap gap-1">
                {result.classifications.map((c) => (
                  <span
                    key={c}
                    className="rounded bg-surface-muted px-2 py-0.5 text-xs text-text-muted"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>
          )}

          {result.detectedFields.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-text-strong">감지된 필드</h3>
              <div className="mt-2 space-y-2">
                {result.detectedFields.map((f, i) => (
                  <div key={i} className="rounded border border-line p-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-text-strong">{f.name}</span>
                      <span className="text-text-muted">{f.value}</span>
                    </div>
                    <div className="mt-1 h-1.5 w-full overflow-hidden rounded bg-surface-muted">
                      <div
                        className="h-full bg-primary"
                        style={{ width: `${Math.round(f.confidence * 100)}%` }}
                      />
                    </div>
                    <p className="mt-1 text-[10px] text-text-muted">
                      신뢰도 {Math.round(f.confidence * 100)}%
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.extractedText && (
            <div>
              <h3 className="text-sm font-semibold text-text-strong">추출 텍스트</h3>
              <pre className="mt-1 whitespace-pre-wrap rounded bg-surface-muted p-3 text-xs">
                {result.extractedText}
              </pre>
            </div>
          )}

          {result.suggestedActions.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-text-strong">제안 조치</h3>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-text-muted">
                {result.suggestedActions.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
