"use client";

import { useState } from "react";

type ExtractionType = "text" | "id" | "invoice";

type ApiResponse = {
  type: ExtractionType;
  result: Record<string, unknown> & { rawText?: string; text?: string };
};

export function OcrUploader() {
  const [extractionType, setExtractionType] = useState<ExtractionType>("text");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<ApiResponse | null>(null);

  async function fileToBase64(f: File): Promise<string> {
    const buf = await f.arrayBuffer();
    let binary = "";
    const bytes = new Uint8Array(buf);
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    setError(null);
    setResponse(null);
    try {
      const base64 = await fileToBase64(file);
      const res = await fetch("/api/admin/ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: base64,
          mimeType: file.type || "image/jpeg",
          extractionType,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as ApiResponse;
      setResponse(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "처리에 실패했습니다");
    } finally {
      setLoading(false);
    }
  }

  const TYPES: { value: ExtractionType; label: string }[] = [
    { value: "text", label: "텍스트" },
    { value: "id", label: "신분증" },
    { value: "invoice", label: "청구서" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {TYPES.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setExtractionType(t.value)}
            className={
              extractionType === t.value
                ? "ui-button-primary"
                : "ui-button-secondary"
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
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="block w-full text-sm"
        />
        <button
          type="submit"
          disabled={!file || loading}
          className="ui-button-primary"
        >
          {loading ? "추출하는 중…" : "추출하기"}
        </button>
      </form>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {response && (
        <div className="space-y-3">
          <h3 className="text-md font-semibold text-text-strong">
            추출 결과 ({response.type})
          </h3>
          {response.type !== "text" && (
            <dl className="grid grid-cols-2 gap-2 rounded border border-border-subtle p-3 text-sm">
              {Object.entries(response.result)
                .filter(([k]) => k !== "rawText")
                .map(([k, v]) => (
                  <div key={k}>
                    <dt className="font-medium text-text-muted">{k}</dt>
                    <dd className="text-text-strong">{String(v ?? "—")}</dd>
                  </div>
                ))}
            </dl>
          )}
          <div>
            <p className="mb-1 text-sm font-medium text-text-muted">원문 텍스트</p>
            <pre className="whitespace-pre-wrap rounded border border-border-subtle bg-surface-muted p-3 text-xs">
              {response.result.rawText ?? response.result.text ?? ""}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
