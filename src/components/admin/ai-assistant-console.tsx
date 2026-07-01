"use client";

import { useState } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Precedent = {
  case_number?: string;
  court_name?: string;
  decision_date?: string;
  summary?: string;
  title?: string;
};

type AnalyzeResponse = {
  ok: boolean;
  requestId?: string;
  summary?: unknown;
  domain?: unknown;
  scope?: unknown;
  reviewRequired?: boolean;
  mustVerify?: string[];
  riskFlags?: string[];
  caseOutlook?: {
    key_decision_factors?: string[];
    missing_case_facts?: string[];
  } | null;
  practitionerGuide?: {
    practice_playbook?: string[];
    document_checklist?: string[];
    priority_actions?: string[];
    related_precedents?: Precedent[];
    confidence_score?: number;
    confidence_label?: string;
  } | null;
  matchedSubtypes?: string[];
  citations?: { name: string; url: string }[];
  error?: string;
};

function scoreColor(score: number | null | undefined) {
  if (score === null || score === undefined) return "text-text-muted";
  if (score >= 75) return "text-emerald-700";
  if (score >= 50) return "text-indigo-700";
  if (score >= 25) return "text-amber-700";
  return "text-rose-700";
}

export function AiAssistantConsole() {
  const [fact, setFact] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);

  async function handleAnalyze() {
    if (fact.trim().length < 10) {
      setError("사안 내용을 10자 이상 입력해 주세요.");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/admin/lawbot/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fact })
      });
      const data = (await res.json()) as AnalyzeResponse;
      if (!res.ok || !data.ok) {
        setError(data.error ?? "분석에 실패했습니다.");
      } else {
        setResult(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  const guide = result?.practitionerGuide ?? null;
  const playbook = guide?.practice_playbook ?? [];
  const checklist = guide?.document_checklist ?? [];
  const precedents = guide?.related_precedents ?? [];
  const priority = guide?.priority_actions ?? [];
  const risks = result?.riskFlags ?? [];
  const confidence = guide?.confidence_score;
  const confidenceLabel = guide?.confidence_label;

  const newInquiryHref = fact
    ? `/admin/inquiries/new?prefill=${encodeURIComponent(fact)}`
    : "/admin/inquiries/new";

  return (
    <div className="space-y-6">
      <Card className="p-4 md:p-6">
        <div className="mb-3">
          <p className="text-xs text-text-muted">Lawbot AI</p>
          <h2 className="text-lg font-semibold text-text-strong">AI 어시스턴트</h2>
          <p className="mt-1 text-sm text-text-muted">
            사안 내용을 입력하면 lawbot이 실무 가이드·판례·리스크를 분석합니다.
          </p>
        </div>

        <textarea
          value={fact}
          onChange={(e) => setFact(e.target.value)}
          disabled={loading}
          rows={8}
          placeholder="사안 내용을 입력하세요 (10자 이상)"
          className="w-full rounded-md border border-line bg-white px-3 py-2 text-sm"
        />

        <div className="mt-3 flex items-center gap-2">
          <Button onClick={handleAnalyze} disabled={loading} variant="primary" size="md">
            {loading ? "분석 중..." : "분석하기"}
          </Button>
          {result && (
            <Link href={newInquiryHref}>
              <Button variant="secondary" size="md">
                이 사건으로 문의 등록
              </Button>
            </Link>
          )}
        </div>

        {error && (
          <div className="mt-4 rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
            {error}
          </div>
        )}
      </Card>

      {result && (
        <>
          {(confidence !== undefined || confidenceLabel) && (
            <Card className="p-4 md:p-6">
              <p className="text-xs text-text-muted">신뢰도</p>
              <div className="mt-2 flex items-baseline gap-3">
                {confidence !== undefined && (
                  <span className={`text-3xl font-semibold tabular-nums ${scoreColor(confidence)}`}>
                    {confidence}
                  </span>
                )}
                <span className="text-sm text-text-muted">/ 100</span>
                {confidenceLabel && (
                  <Badge>{confidenceLabel}</Badge>
                )}
              </div>
            </Card>
          )}

          {risks.length > 0 && (
            <Card className="p-4 md:p-6">
              <p className="text-xs text-text-muted">리스크 플래그</p>
              <div className="mt-2 space-y-2">
                {risks.map((r, i) => (
                  <div
                    key={i}
                    className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900"
                  >
                    ⚠ {r}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {priority.length > 0 && (
            <Card className="p-4 md:p-6">
              <p className="text-xs text-text-muted">우선 조치</p>
              <ul className="mt-2 space-y-2">
                {priority.map((p, i) => (
                  <li
                    key={i}
                    className="rounded-md border-l-4 border-primary bg-surface-muted p-3 text-sm text-text-strong"
                  >
                    <span className="mr-2 font-semibold text-primary">#{i + 1}</span>
                    {p}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {playbook.length > 0 && (
            <Card className="p-4 md:p-6">
              <p className="text-xs text-text-muted">실무 플레이북</p>
              <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-text-strong">
                {playbook.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
            </Card>
          )}

          {checklist.length > 0 && (
            <Card className="p-4 md:p-6">
              <p className="text-xs text-text-muted">문서 체크리스트</p>
              <ul className="mt-2 space-y-1 text-sm text-text-strong">
                {checklist.map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <input type="checkbox" className="mt-1" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {precedents.length > 0 && (
            <Card className="p-4 md:p-6">
              <p className="text-xs text-text-muted">관련 판례</p>
              <div className="mt-2 grid grid-cols-1 gap-3 md:grid-cols-2">
                {precedents.map((p, i) => (
                  <div
                    key={i}
                    className="rounded-md border border-line bg-white p-3 text-sm"
                  >
                    <p className="font-semibold text-text-strong">
                      {p.case_number ?? p.title ?? `판례 #${i + 1}`}
                    </p>
                    <p className="mt-1 text-xs text-text-muted">
                      {[p.court_name, p.decision_date].filter(Boolean).join(" · ")}
                    </p>
                    {p.summary && (
                      <p className="mt-2 text-sm text-text-strong">{p.summary}</p>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {(result.mustVerify?.length ?? 0) > 0 && (
            <Card className="p-4 md:p-6">
              <p className="text-xs text-text-muted">확인 필요 사항</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-text-strong">
                {result.mustVerify!.map((m, i) => (
                  <li key={i}>{m}</li>
                ))}
              </ul>
            </Card>
          )}

          {(result.citations?.length ?? 0) > 0 && (
            <Card className="p-4 md:p-6">
              <p className="text-xs text-text-muted">관련 법령</p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {result.citations!.map((c, i) => (
                  <li key={i}>
                    <a
                      href={c.url}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded border border-line bg-white px-2 py-1 text-xs text-primary hover:bg-surface-muted"
                    >
                      {c.name}
                    </a>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
