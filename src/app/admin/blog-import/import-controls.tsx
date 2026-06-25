"use client";

import { useState } from "react";

type SyncResult = {
  ok: boolean;
  imported: number;
  skipped: number;
  translated: number;
  errors: string[];
};

export function ImportControls() {
  const [loading, setLoading] = useState<"rss" | "bulk" | null>(null);
  const [result, setResult] = useState<SyncResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [max, setMax] = useState(100);
  const [translate, setTranslate] = useState(false);

  async function run(endpoint: string, mode: "rss" | "bulk") {
    setLoading(mode);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "요청 실패" }));
        throw new Error(err.error ?? "요청 실패");
      }
      setResult((await res.json()) as SyncResult);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-4">
      {/* RSS 동기화 (최신 10편) */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => run("/api/admin/blog-import", "rss")}
          disabled={loading !== null}
          className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-text-strong disabled:opacity-60"
        >
          {loading === "rss" ? "동기화 중..." : "RSS 동기화 (최신 10편)"}
        </button>
        <span className="text-xs text-text-muted">매시 자동 실행 + 영문 번역</span>
      </div>

      {/* 대량 import */}
      <div className="rounded-lg border border-gold/30 bg-gold-soft/10 p-4">
        <p className="font-serif text-sm font-bold text-primary">대량 가져오기 (PostTitleListAsync)</p>
        <p className="mt-1 text-xs text-text-muted">RSS 한계(~10편)를 넘어 페이징으로 최대 N편 가져옵니다. 중복은 자동 스킵.</p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <label className="text-xs font-semibold text-primary">
            최대 글수:
            <input
              type="number"
              value={max}
              onChange={(e) => setMax(Number(e.target.value) || 100)}
              min={1}
              max={300}
              className="ml-2 w-20 rounded border border-line bg-surface px-2 py-1 text-sm"
            />
          </label>
          <label className="flex items-center gap-2 text-xs font-semibold text-primary">
            <input
              type="checkbox"
              checked={translate}
              onChange={(e) => setTranslate(e.target.checked)}
            />
            영문 번역 (Anthropic 비용 발생)
          </label>
          <button
            type="button"
            onClick={() => run(`/api/admin/blog-bulk-import?max=${max}&translate=${translate ? 1 : 0}`, "bulk")}
            disabled={loading !== null}
            className="rounded-lg bg-gold-deep px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-95 disabled:opacity-60"
          >
            {loading === "bulk" ? `가져오는 중... (최대 ${max}편)` : `대량 가져오기 시작`}
          </button>
        </div>
      </div>

      {result && (
        <div className="rounded-lg border border-line bg-surface-muted/40 p-3 text-xs text-text">
          <p>
            가져옴: <strong>{result.imported}</strong> · 건너뜀:{" "}
            <strong>{result.skipped}</strong> · 번역됨:{" "}
            <strong>{result.translated}</strong>
          </p>
          {result.errors.length > 0 && (
            <ul className="mt-2 list-disc pl-5 text-danger">
              {result.errors.slice(0, 5).map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          )}
        </div>
      )}
      {error && (
        <div className="rounded-lg border border-danger bg-danger/10 p-3 text-xs text-danger">{error}</div>
      )}
    </div>
  );
}
