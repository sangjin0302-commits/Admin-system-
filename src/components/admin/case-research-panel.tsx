"use client";

import { useCallback, useEffect, useState } from "react";

type LawResultItem = {
  target: string;
  id: string;
  title: string;
  agency: string;
  date: string;
  number: string;
  detailUrl: string;
  hwpUrl?: string;
  pdfUrl?: string;
  extra: Record<string, string>;
};

type ParsedCitation = {
  raw: string;
  lawName: string;
  article: string;
  citedTitle: string;
};

type CitationVerdict = {
  citation: ParsedCitation;
  status:
    | "verified"
    | "content_mismatch"
    | "article_not_found"
    | "law_not_found"
    | "unchecked";
  actualTitle: string;
  detail: string;
  layer?: "exact" | "jaccard" | "none";
  score?: number;
};

type CitationVerifyResult = {
  total: number;
  verified: number;
  mismatched: number;
  notFound: number;
  verdicts: CitationVerdict[];
  hallucinationDetected: boolean;
};

/** 인용 검증 결과 카드 — 요약 바로 아래, 결과 섹션보다 위에 둔다. */
export function CitationCheckCard({ check }: { check: CitationVerifyResult }) {
  if (check.total === 0) return null;
  const bad = check.mismatched + check.notFound;
  const alert = check.hallucinationDetected;
  return (
    <div
      className={`rounded border p-3 ${
        alert ? "border-red-300 bg-red-50" : "border-green-200 bg-green-50"
      }`}
    >
      <div
        className={`text-xs font-semibold mb-2 ${
          alert ? "text-red-700" : "text-green-700"
        }`}
      >
        {alert
          ? `⚠️ 인용 오류 ${bad}건 감지`
          : `✅ 인용 검증 통과 (${check.verified}건)`}
      </div>
      <ul className="space-y-1">
        {check.verdicts.map((v, i) => {
          const ok = v.status === "verified";
          return (
            <li key={`${v.citation.raw}-${i}`} className="flex gap-2 text-xs">
              <span className={ok ? "text-green-600" : "text-red-600"}>
                {ok ? "✓" : "✗"}
              </span>
              <span className="text-gray-800">
                <span className="font-medium">{v.citation.raw}</span>
                <span className="text-gray-600"> — {v.detail}</span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

type CaseResearchResult = {
  keywords: string[];
  laws: LawResultItem[];
  articles: LawResultItem[];
  precedents: LawResultItem[];
  adminJudgments: LawResultItem[];
  specialJudgments: LawResultItem[];
  interpretations: LawResultItem[];
  ministryInterps: LawResultItem[];
  adminRules: LawResultItem[];
  forms: LawResultItem[];
  ordinances: LawResultItem[];
  summary: string;
  citationCheck: CitationVerifyResult | null;
  generatedAt: string;
};

function ResultRow({ it }: { it: LawResultItem }) {
  const meta = [it.agency, it.date, it.number].filter(Boolean).join(" · ");
  const inner = (
    <>
      <div className="text-sm font-medium">{it.title}</div>
      {meta && <div className="text-xs text-gray-500">{meta}</div>}
    </>
  );
  return it.detailUrl ? (
    <a
      href={it.detailUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="block border rounded p-2 hover:bg-gray-50"
    >
      {inner}
    </a>
  ) : (
    <div className="border rounded p-2">{inner}</div>
  );
}

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

          {result.citationCheck && <CitationCheckCard check={result.citationCheck} />}

          <Section title={`관련 법령 (${result.laws.length})`}>
            {result.laws.map((it, i) => (
              <ResultRow key={`${it.id}-${i}`} it={it} />
            ))}
          </Section>

          <Section title={`조문 본문 (${result.articles.length})`}>
            {result.articles.map((it, i) => (
              <div key={`${it.id}-${i}`} className="border rounded p-2">
                <div className="text-sm font-medium">
                  {it.extra["법령명"] ? `${it.extra["법령명"]} ` : ""}
                  {it.title}
                </div>
                <div className="text-xs text-gray-500">
                  {[it.agency, it.date, it.number].filter(Boolean).join(" · ")}
                </div>
                {it.extra["조문내용"] && (
                  <div className="text-xs text-gray-700 mt-1 whitespace-pre-wrap">
                    {it.extra["조문내용"]}
                  </div>
                )}
              </div>
            ))}
          </Section>

          <Section title={`판례 (${result.precedents.length})`}>
            {result.precedents.map((it, i) => (
              <ResultRow key={`${it.id}-${i}`} it={it} />
            ))}
          </Section>

          <Section title={`행정심판 재결례 (${result.adminJudgments.length})`}>
            {result.adminJudgments.map((it, i) => (
              <ResultRow key={`${it.id}-${i}`} it={it} />
            ))}
          </Section>

          <Section title={`조세심판원 재결례 (${result.specialJudgments.length})`}>
            {result.specialJudgments.map((it, i) => (
              <ResultRow key={`${it.id}-${i}`} it={it} />
            ))}
          </Section>

          <Section title={`법령해석례 (${result.interpretations.length})`}>
            {result.interpretations.map((it, i) => (
              <ResultRow key={`${it.id}-${i}`} it={it} />
            ))}
          </Section>

          <Section title={`법무부 유권해석 (${result.ministryInterps.length})`}>
            {result.ministryInterps.map((it, i) => (
              <ResultRow key={`${it.id}-${i}`} it={it} />
            ))}
          </Section>

          <Section title={`행정규칙 (${result.adminRules.length})`}>
            {result.adminRules.map((it, i) => (
              <ResultRow key={`${it.id}-${i}`} it={it} />
            ))}
          </Section>

          <Section title={`별표·서식 (${result.forms.length})`}>
            {result.forms.map((it, i) => (
              <ResultRow key={`${it.id}-${i}`} it={it} />
            ))}
          </Section>

          <Section title={`자치법규 (${result.ordinances.length})`}>
            {result.ordinances.map((it, i) => (
              <ResultRow key={`${it.id}-${i}`} it={it} />
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
