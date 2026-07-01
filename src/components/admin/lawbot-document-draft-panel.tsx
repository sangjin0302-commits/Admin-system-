"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type DraftKind = "opinion" | "appeal" | "objection" | "petition";

const DRAFT_KIND_OPTIONS: { value: DraftKind; label: string }[] = [
  { value: "opinion", label: "의견서" },
  { value: "appeal", label: "행정심판청구서" },
  { value: "objection", label: "이의신청서" },
  { value: "petition", label: "청원서" }
];

type ApiResponse = {
  ok: boolean;
  draft?: string | null;
  sections?: unknown;
  warnings?: string[];
  error?: string;
};

export function LawbotDocumentDraftPanel({ inquiryId }: { inquiryId: string }) {
  const [draftKind, setDraftKind] = useState<DraftKind>("opinion");
  const [extraContext, setExtraContext] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ApiResponse | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    setResult(null);
    setCopied(false);
    try {
      const res = await fetch(`/api/admin/inquiries/${inquiryId}/draft-document`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          draftKind,
          extraContext: extraContext.trim() || undefined
        })
      });
      const data = (await res.json()) as ApiResponse;
      if (!res.ok || !data.ok) {
        setError(data.error ?? "AI 서면 초안 생성에 실패했습니다.");
      } else {
        setResult(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!result?.draft) return;
    try {
      await navigator.clipboard.writeText(result.draft);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("클립보드 복사에 실패했습니다.");
    }
  }

  return (
    <Card className="p-4 md:p-6">
      <div className="mb-3">
        <p className="text-xs text-text-muted">Lawbot AI</p>
        <h3 className="text-sm font-semibold text-text-strong">AI 서면 초안 생성</h3>
        <p className="mt-1 text-xs text-text-muted">
          문의 정보를 기반으로 법률 서면 초안을 생성합니다.
        </p>
      </div>

      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-text-strong">
            서면 종류
          </label>
          <select
            value={draftKind}
            onChange={(e) => setDraftKind(e.target.value as DraftKind)}
            disabled={loading}
            className="w-full rounded-md border border-line bg-white px-3 py-2 text-sm"
          >
            {DRAFT_KIND_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-text-strong">
            추가 사실관계 (선택)
          </label>
          <textarea
            value={extraContext}
            onChange={(e) => setExtraContext(e.target.value)}
            disabled={loading}
            rows={4}
            placeholder="문의에 포함되지 않은 추가 사실이나 강조할 쟁점을 입력하세요."
            className="w-full rounded-md border border-line bg-white px-3 py-2 text-sm"
          />
        </div>

        <Button
          onClick={handleGenerate}
          disabled={loading}
          variant="primary"
          size="md"
        >
          {loading ? "생성 중..." : "AI 초안 생성"}
        </Button>
      </div>

      {error && (
        <div className="mt-4 rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
          {error}
        </div>
      )}

      {result?.warnings && result.warnings.length > 0 && (
        <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <p className="font-medium">확인 필요:</p>
          <ul className="mt-1 list-disc space-y-1 pl-5">
            {result.warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {result?.draft && (
        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-medium text-text-strong">생성된 초안</p>
            <Button onClick={handleCopy} variant="secondary" size="sm">
              {copied ? "복사됨" : "복사"}
            </Button>
          </div>
          <pre className="whitespace-pre-wrap rounded-md border border-line bg-surface-muted p-3 text-sm text-text-strong">
            {result.draft}
          </pre>
        </div>
      )}

      {result && !result.draft && (
        <p className="mt-4 text-sm text-text-muted">
          초안 텍스트를 받지 못했습니다. Lawbot 응답을 확인해 주세요.
        </p>
      )}
    </Card>
  );
}
