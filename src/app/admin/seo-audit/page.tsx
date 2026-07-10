"use client";

import { useState } from "react";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Card } from "@/components/ui/card";

type SeoCheck = {
  key: string;
  label: string;
  pass: boolean;
  value?: string;
  detail?: string;
};

type AuditResult = {
  url: string;
  fetchedAt: string;
  status: number;
  score: number;
  checks: SeoCheck[];
  issues: string[];
};

export default function SeoAuditPage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AuditResult | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    if (!url.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/seo-audit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = (await res.json()) as AuditResult & { error?: string };
      if (!res.ok) {
        setError(data.error ?? "감사 실패");
      } else {
        setResult(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "네트워크 오류");
    } finally {
      setLoading(false);
    }
  }

  const scoreColor = (s: number) =>
    s >= 80 ? "text-emerald-600" : s >= 50 ? "text-amber-600" : "text-red-600";

  return (
    <div className="space-y-6">
      <AdminPageHeader
        kicker="Marketing"
        title="사이트 SEO 감사"
        description="URL을 입력하고 감사 실행 — <title>, meta description, H1, alt, OG, canonical, JSON-LD 등을 점검합니다."
      />

      <Card className="p-5">
        <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row">
          <input
            type="url"
            required
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/page"
            className="flex-1 rounded border border-line px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {loading ? "감사 중…" : "감사 실행"}
          </button>
        </form>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </Card>

      {result && (
        <>
          <Card className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-text-strong">감사 결과</h2>
                <p className="text-xs text-text-muted">
                  {result.url} · HTTP {result.status} ·{" "}
                  {new Date(result.fetchedAt).toLocaleString()}
                </p>
              </div>
              <div className={`text-4xl font-bold ${scoreColor(result.score)}`}>
                {result.score}
                <span className="text-base text-text-muted">/100</span>
              </div>
            </div>
            <div className="mt-3 h-2 w-full overflow-hidden rounded bg-slate-100">
              <div
                className={`h-full ${
                  result.score >= 80
                    ? "bg-emerald-500"
                    : result.score >= 50
                      ? "bg-amber-500"
                      : "bg-red-500"
                }`}
                style={{ width: `${result.score}%` }}
              />
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="text-sm font-semibold text-text-strong">체크리스트</h2>
            <ul className="mt-3 space-y-2">
              {result.checks.map((c) => (
                <li
                  key={c.key}
                  className="flex items-start gap-3 rounded border border-line p-3 text-sm"
                >
                  <span
                    className={`mt-0.5 inline-block h-4 w-4 rounded-full ${
                      c.pass ? "bg-emerald-500" : "bg-red-500"
                    }`}
                  />
                  <div className="flex-1">
                    <div className="font-medium">{c.label}</div>
                    {c.detail && <div className="text-xs text-text-muted">{c.detail}</div>}
                    {c.value && (
                      <div className="mt-1 truncate text-xs text-text-muted">
                        <code>{c.value}</code>
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </Card>

          {result.issues.length > 0 && (
            <Card className="p-5">
              <h2 className="text-sm font-semibold text-text-strong">이슈 요약</h2>
              <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-red-700">
                {result.issues.map((iss, i) => (
                  <li key={i}>{iss}</li>
                ))}
              </ul>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
