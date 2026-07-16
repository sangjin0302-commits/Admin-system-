"use client";

import { useCallback, useEffect, useState } from "react";

type CaseResearchResult = {
  keywords: string[];
  laws: Array<{ lawId: string; name: string; lawType: string; effectiveDate: string }>;
  precedents: Array<{
    caseId: string;
    caseName: string;
    courtName: string;
    caseNumber: string;
    judgmentDate: string;
    summary: string;
  }>;
  adminJudgments: Array<{
    deccId: string;
    caseName: string;
    caseNumber: string;
    agency: string;
    date: string;
  }>;
  interpretations: Array<{ interpId: string; title: string; agency: string; date: string }>;
  adminRules: Array<{ ruleId: string; name: string; agency: string; date: string }>;
  forms: Array<{ formId: string; formName: string; lawName: string; mst: string }>;
  ordinances: Array<{ ordinanceId: string; name: string; region: string; date: string }>;
  summary: string;
  generatedAt: string;
};

async function callResearch(caseDescription: string, bypassCache = false) {
  const res = await fetch("/api/admin/case-research", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ caseDescription, bypassCache }),
  });
  const json = await res.json();
  if (!json?.ok) throw new Error(json?.error || "요청 실패");
  return json.result as CaseResearchResult;
}

type Props = { initialDescription?: string; autoRun?: boolean };

export function CaseResearchPanel({ initialDescription = "", autoRun = false }: Props) {
  const [desc, setDesc] = useState(initialDescription);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CaseResearchResult | null>(null);

  const run = useCallback(
    async (bypassCache = false) => {
      if (desc.trim().length < 20) {
        setError("사건 설명은 20자 이상이어야 합니다.");
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const r = await callResearch(desc, bypassCache);
        setResult(r);
      } catch (e) {
        setError(e instanceof Error ? e.message : "리서치 실패");
      } finally {
        setLoading(false);
      }
    },
    [desc]
  );

  useEffect(() => {
    if (autoRun && initialDescription.trim().length >= 20) {
      void run(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="admin-card p-4 space-y-4">
      <div>
        <p className="ui-kicker">사건 자동 리서치 (AI + 법제처)</p>
        <p className="mt-1 text-sm text-text-muted">
          AI가 키워드를 뽑아 법령·판례·해석례를 병렬 조회하고 종합 요약합니다.
        </p>
      </div>

      <textarea
        value={desc}
        onChange={(e) => setDesc(e.target.value)}
        placeholder="사건 설명을 입력하세요 (20자 이상)"
        rows={4}
        className="w-full border rounded px-3 py-2 text-sm"
      />

      <div className="flex gap-2">
        <button
          onClick={() => run(false)}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded text-sm disabled:opacity-50"
        >
          {loading ? "AI가 분석 중... (10-15초)" : "🔍 자동 리서치 실행"}
        </button>
        {result && (
          <button
            onClick={() => run(true)}
            disabled={loading}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded text-sm disabled:opacity-50"
          >
            다시 실행 (캐시 무시)
          </button>
        )}
      </div>

      {error && <div className="text-sm text-red-600">{error}</div>}

      {result && (
        <div className="space-y-4">
          <div className="rounded border border-blue-200 bg-blue-50 p-3">
            <div className="text-xs font-semibold text-blue-700 mb-1">AI 종합 요약</div>
            <div className="text-sm whitespace-pre-wrap text-gray-800">{result.summary}</div>
            <div className="mt-2 text-[11px] text-gray-500">
              키워드: {result.keywords.join(", ")} · 생성 {new Date(result.generatedAt).toLocaleString("ko-KR")}
            </div>
          </div>

          <Section title={`관련 법령 (${result.laws.length})`}>
            {result.laws.map((it) => (
              <a
                key={it.lawId}
                href={`/admin/law-research?tab=law&id=${encodeURIComponent(it.lawId)}`}
                target="_blank"
                rel="noreferrer"
                className="block border rounded p-2 hover:bg-gray-50"
              >
                <div className="text-sm font-medium">{it.name}</div>
                <div className="text-xs text-gray-500">
                  {it.lawType} · 시행 {it.effectiveDate}
                </div>
              </a>
            ))}
          </Section>

          <Section title={`판례 (${result.precedents.length})`}>
            {result.precedents.map((it) => (
              <a
                key={it.caseId}
                href={`/admin/law-research?tab=prec&id=${encodeURIComponent(it.caseId)}`}
                target="_blank"
                rel="noreferrer"
                className="block border rounded p-2 hover:bg-gray-50"
              >
                <div className="text-sm font-medium">{it.caseName}</div>
                <div className="text-xs text-gray-500">
                  {it.courtName} · {it.caseNumber} · {it.judgmentDate}
                </div>
                {it.summary && (
                  <div className="text-xs text-gray-600 mt-1 line-clamp-2">{it.summary}</div>
                )}
              </a>
            ))}
          </Section>

          <Section title={`행정심판 재결례 (${result.adminJudgments.length})`}>
            {result.adminJudgments.map((it) => (
              <a
                key={it.deccId}
                href={`/admin/law-research?tab=decc&id=${encodeURIComponent(it.deccId)}`}
                target="_blank"
                rel="noreferrer"
                className="block border rounded p-2 hover:bg-gray-50"
              >
                <div className="text-sm font-medium">{it.caseName}</div>
                <div className="text-xs text-gray-500">
                  {it.agency} · {it.caseNumber} · {it.date}
                </div>
              </a>
            ))}
          </Section>

          <Section title={`법령해석례 (${result.interpretations.length})`}>
            {result.interpretations.map((it) => (
              <a
                key={it.interpId}
                href={`/admin/law-research?tab=expc&id=${encodeURIComponent(it.interpId)}`}
                target="_blank"
                rel="noreferrer"
                className="block border rounded p-2 hover:bg-gray-50"
              >
                <div className="text-sm font-medium">{it.title}</div>
                <div className="text-xs text-gray-500">
                  {it.agency} · {it.date}
                </div>
              </a>
            ))}
          </Section>

          <Section title={`행정규칙 (${result.adminRules.length})`}>
            {result.adminRules.map((it) => (
              <a
                key={it.ruleId}
                href={`/admin/law-research?tab=admrul&id=${encodeURIComponent(it.ruleId)}`}
                target="_blank"
                rel="noreferrer"
                className="block border rounded p-2 hover:bg-gray-50"
              >
                <div className="text-sm font-medium">{it.name}</div>
                <div className="text-xs text-gray-500">
                  {it.agency} · {it.date}
                </div>
              </a>
            ))}
          </Section>

          <Section title={`별표·서식 (${result.forms.length})`}>
            {result.forms.map((it) => (
              <a
                key={it.formId}
                href={`/admin/law-research?tab=form&keyword=${encodeURIComponent(it.formName)}`}
                target="_blank"
                rel="noreferrer"
                className="block border rounded p-2 hover:bg-gray-50"
              >
                <div className="text-sm font-medium">{it.formName}</div>
                <div className="text-xs text-gray-500">{it.lawName}</div>
              </a>
            ))}
          </Section>

          <Section title={`자치법규 (${result.ordinances.length})`}>
            {result.ordinances.map((it) => (
              <a
                key={it.ordinanceId}
                href={`/admin/law-research?tab=ordin&id=${encodeURIComponent(it.ordinanceId)}`}
                target="_blank"
                rel="noreferrer"
                className="block border rounded p-2 hover:bg-gray-50"
              >
                <div className="text-sm font-medium">{it.name}</div>
                <div className="text-xs text-gray-500">
                  {it.region} · 시행 {it.date}
                </div>
              </a>
            ))}
          </Section>
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  const hasChildren = Array.isArray(children) ? children.length > 0 : Boolean(children);
  return (
    <details open={open} onToggle={(e) => setOpen((e.target as HTMLDetailsElement).open)}>
      <summary className="cursor-pointer text-sm font-semibold text-gray-700 py-1">{title}</summary>
      <div className="space-y-1 mt-2">
        {hasChildren ? children : <div className="text-xs text-gray-400">결과 없음</div>}
      </div>
    </details>
  );
}
