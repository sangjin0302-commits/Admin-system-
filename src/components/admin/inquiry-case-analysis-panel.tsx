"use client";

import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { InquiryCaseAnalysis } from "@/lib/services/case-analysis-service";

export function InquiryCaseAnalysisPanel({
  analysis,
}: {
  analysis: InquiryCaseAnalysis;
}) {
  const [copied, setCopied] = useState<"analysis" | "action" | "client" | "docs" | null>(null);

  const analysisDraft = [
    "[AI 사건 분석]",
    `- 사건 강도: ${analysis.strengthLabel} (${analysis.strengthScore}점)`,
    `- 사건 요약: ${analysis.summary}`,
    "",
    "[핵심 쟁점]",
    ...analysis.issues.map((item) => `- ${item}`),
    "",
    "[유리 요소]",
    ...analysis.favorableFactors.map((item) => `- ${item}`),
    "",
    "[불리 요소]",
    ...analysis.riskFactors.map((item) => `- ${item}`),
    "",
    "[추가 확인 필요 사실]",
    ...analysis.missingFacts.map((item) => `- ${item}`),
    "",
    "[권장 다음 조치]",
    `- ${analysis.recommendedAction}`,
  ].join("\n");

  async function copy(kind: "analysis" | "action" | "client" | "docs", text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      setCopied(null);
    }
  }

  return (
    <Card className="p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h3 className="ui-section-title">AI 사건 분석</h3>
          <p className="mt-2 text-sm text-text-muted">
            현재 문의 내용을 기준으로 관련 법령, 참고 판례, 유리·불리 요소를 내부 검토용으로 정리했습니다.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge>{analysis.strengthLabel}</Badge>
          <Badge>{analysis.strengthScore}점</Badge>
          <Badge>{`해결 가능성 ${analysis.resolutionOutlook}`}</Badge>
          <Button size="sm" variant="secondary" onClick={() => void copy("analysis", analysisDraft)}>
            {copied === "analysis" ? "분석 복사됨" : "분석 메모 복사"}
          </Button>
          <Button size="sm" variant="secondary" onClick={() => void copy("action", analysis.recommendedAction)}>
            {copied === "action" ? "조치 복사됨" : "다음 조치 복사"}
          </Button>
          <Button size="sm" variant="secondary" onClick={() => void copy("client", analysis.communicationGuidance.clientSummary)}>
            {copied === "client" ? "안내 복사됨" : "고객 안내 복사"}
          </Button>
          <Button size="sm" variant="secondary" onClick={() => void copy("docs", analysis.communicationGuidance.documentRequest)}>
            {copied === "docs" ? "요청문 복사됨" : "자료 요청문 복사"}
          </Button>
        </div>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <Card muted className="p-5">
          <p className="ui-kicker">해결 가능성 판단</p>
          <div className="mt-3 flex items-end gap-3">
            <p className="text-4xl font-semibold text-text-strong">{analysis.resolutionProbabilityPercent}</p>
            <p className="pb-1 text-sm text-text-muted">/ 100</p>
          </div>
          <p className="mt-2 text-sm font-medium text-text">{analysis.resolutionOutlook} 전망</p>
          <div className="mt-4 h-3 overflow-hidden rounded-full bg-surface-muted">
            <div
              className={`h-full rounded-full ${
                analysis.resolutionOutlook === "높음"
                  ? "bg-success"
                  : analysis.resolutionOutlook === "중간"
                    ? "bg-info"
                    : analysis.resolutionOutlook === "신중"
                      ? "bg-warning"
                      : "bg-danger"
              }`}
              style={{ width: `${analysis.resolutionProbabilityPercent}%` }}
            />
          </div>
          <p className="mt-4 text-sm leading-6 text-text-muted">{analysis.confidenceNote}</p>
        </Card>
        <Card muted className="p-5">
          <p className="ui-kicker">즉시 확인할 항목</p>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-text">
            {analysis.immediateActions.map((item) => (
              <li key={`action-${item}`}>{item}</li>
            ))}
          </ul>
        </Card>
      </div>

      <Card muted className="mt-5 p-5">
        <p className="ui-kicker">사건 요약</p>
        <p className="mt-3 text-sm text-text">{analysis.summary}</p>
      </Card>

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        <ListCard title="핵심 쟁점" items={analysis.issues} />
        <ListCard title="추가 확인 필요 사실" items={analysis.missingFacts} />
        <ListCard title="유리 요소" items={analysis.favorableFactors} />
        <ListCard title="불리 요소" items={analysis.riskFactors} />
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        <ReferenceCard title="관련 법령" items={analysis.lawReferences} kind="law" />
        <ReferenceCard title="참고 판례 검색어" items={analysis.precedentReferences} kind="precedent" />
      </div>

      <Card muted className="mt-5 p-5">
        <p className="ui-kicker">권장 다음 조치</p>
        <p className="mt-3 text-sm leading-6 text-text">{analysis.recommendedAction}</p>
      </Card>

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        <Card muted className="p-5">
          <p className="ui-kicker">내부 보고용 한 줄 요약</p>
          <p className="mt-3 whitespace-pre-line text-sm leading-6 text-text">{analysis.communicationGuidance.internalBrief}</p>
        </Card>
        <Card muted className="p-5">
          <p className="ui-kicker">고객 안내 초안</p>
          <p className="mt-3 whitespace-pre-line text-sm leading-6 text-text">{analysis.communicationGuidance.clientSummary}</p>
        </Card>
      </div>
    </Card>
  );
}

function ListCard({ title, items }: { title: string; items: string[] }) {
  return (
    <Card muted className="p-5">
      <p className="ui-kicker">{title}</p>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-text">
        {items.map((item) => (
          <li key={`${title}-${item}`}>{item}</li>
        ))}
      </ul>
    </Card>
  );
}

function ReferenceCard({
  title,
  items,
  kind
}: {
  title: string;
  items: Array<{ title: string; summary: string; keywords: string[] } | { query: string; summary: string; keywords: string[] }>;
  kind: "law" | "precedent";
}) {
  return (
    <Card muted className="p-5">
      <p className="ui-kicker">{title}</p>
      <div className="mt-3 space-y-3">
        {items.map((item) => {
          const heading = "title" in item ? item.title : item.query;
          const searchSource = kind === "law" ? `site:law.go.kr ${heading}` : `site:glaw.scourt.go.kr ${heading}`;
          const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchSource)}`;
          return (
            <div key={`${title}-${heading}`} className="rounded-2xl border border-line/60 bg-white/70 p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-sm font-semibold text-text">{heading}</p>
                  <p className="mt-2 text-sm text-text-muted">{item.summary}</p>
                </div>
                <ReferenceActions query={heading} searchUrl={searchUrl} label={kind === "law" ? "법령 검색" : "판례 검색"} />
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {item.keywords.map((keyword) => (
                  <Badge key={`${heading}-${keyword}`}>{keyword}</Badge>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function ReferenceActions({
  query,
  searchUrl,
  label
}: {
  query: string;
  searchUrl: string;
  label: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copyQuery() {
    try {
      await navigator.clipboard.writeText(query);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button size="sm" variant="secondary" onClick={() => void copyQuery()}>
        {copied ? "복사됨" : "검색어 복사"}
      </Button>
      <a
        href={searchUrl}
        target="_blank"
        rel="noreferrer"
        className="inline-flex h-9 items-center justify-center rounded-md border border-line-strong px-3 text-xs font-medium text-text-strong transition hover:bg-surface"
      >
        {label}
      </a>
    </div>
  );
}
