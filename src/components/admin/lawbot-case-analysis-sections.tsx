"use client";

import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type {
  LawbotConnectionSnapshot,
  StoredLawbotSnapshot
} from "@/lib/services/lawbot-case-analysis-service";

export function MatchedLawCard({
  items
}: {
  items: Array<{
    law: string;
    exact_name?: string;
    kind?: string | null;
    ministry?: string | null;
    effective_date?: string | null;
    promulgation_date?: string | null;
    match_type?: string;
    summary?: string;
    score?: number;
    confidence?: number;
    reason?: string;
    match_reason?: string;
  }>;
}) {
  return (
    <Card muted className="p-5">
      <p className="ui-kicker">정확 매칭 법령</p>
      <div className="mt-3 space-y-3">
        {items.length > 0 ? (
          items.map((item) => (
            <div
              key={`${item.law}-${item.match_type ?? "unknown"}`}
              className="rounded-2xl border border-line/60 bg-white/70 p-4"
            >
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-sm font-semibold text-text">{item.law}</p>
                  <p className="mt-1 text-xs text-text-muted">
                    {[
                      item.exact_name && item.exact_name !== item.law ? `정확명: ${item.exact_name}` : null,
                      item.kind,
                      item.match_type,
                      item.score !== undefined ? `${Math.round(item.score)}점` : null,
                      item.confidence !== undefined ? `${Math.round(item.confidence)}%` : null
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                  {item.ministry || item.effective_date || item.promulgation_date ? (
                    <p className="mt-1 text-xs text-text-muted">
                      {[item.ministry, item.effective_date, item.promulgation_date].filter(Boolean).join(" · ")}
                    </p>
                  ) : null}
                  {item.summary ? <p className="mt-2 text-sm text-text-muted">{item.summary}</p> : null}
                  {item.match_reason ?? item.reason ? (
                    <p className="mt-2 text-sm text-text">{item.match_reason ?? item.reason}</p>
                  ) : null}
                </div>
                <SearchActions query={item.law} label="법령 검색" />
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-text-muted">표시할 항목이 없습니다.</p>
        )}
      </div>
    </Card>
  );
}

export function MatchedArticleCard({
  items
}: {
  items: Array<{
    law?: string;
    law_name: string;
    article?: string;
    article_label: string;
    article_key?: string | null;
    jo?: string;
    summary?: string;
    full_text?: string;
    article_text?: string | null;
    confidence?: number;
    match_reason?: string;
  }>;
}) {
  return (
    <Card muted className="p-5">
      <p className="ui-kicker">정확 매칭 조문</p>
      <div className="mt-3 space-y-3">
        {items.length > 0 ? (
          items.map((item) => (
            <div
              key={`${item.law_name ?? item.law ?? "law"}-${item.article_label ?? item.article ?? "article"}-${item.article_key ?? item.jo ?? "jo"}`}
              className="rounded-2xl border border-line/60 bg-white/70 p-4"
            >
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-sm font-semibold text-text">
                    {item.law_name ?? item.law} {item.article_label ?? item.article}
                  </p>
                  <p className="mt-1 text-xs text-text-muted">
                    {[item.article_key, item.jo, item.confidence !== undefined ? `${Math.round(item.confidence)}%` : null]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                  {item.summary ?? item.article_text ? (
                    <p className="mt-2 text-sm text-text-muted">{item.summary ?? item.article_text}</p>
                  ) : null}
                  {item.full_text ? <p className="mt-2 whitespace-pre-line text-sm leading-6 text-text">{item.full_text}</p> : null}
                  {item.match_reason ? <p className="mt-2 text-sm text-text">{item.match_reason}</p> : null}
                </div>
                <SearchActions
                  query={`${item.law_name ?? item.law ?? ""} ${item.article_label ?? item.article ?? ""}`.trim()}
                  label="조문 검색"
                />
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-text-muted">표시할 항목이 없습니다.</p>
        )}
      </div>
    </Card>
  );
}

export function RefreshButton({
  onRefresh,
  isRefreshing,
  hasStoredSnapshot,
  connectionReady
}: {
  onRefresh: () => void;
  isRefreshing: boolean;
  hasStoredSnapshot: boolean;
  connectionReady: boolean;
}) {
  const isInitialAnalysisBlocked = connectionReady && !hasStoredSnapshot;
  const idleLabel = connectionReady
    ? hasStoredSnapshot
      ? "재분석"
      : "초기 분석 실행 비활성화"
    : hasStoredSnapshot
      ? "연결 후 재분석"
      : "연결 준비 확인";

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={onRefresh}
        disabled={isRefreshing || isInitialAnalysisBlocked}
        className="inline-flex items-center rounded-full border border-line/70 px-4 py-2 text-xs font-medium text-text transition hover:bg-surface disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isRefreshing ? "재분석 중..." : idleLabel}
      </button>
      {isInitialAnalysisBlocked ? (
        <p className="text-xs text-text-muted">현재 단계에서는 결과 조회만 가능합니다.</p>
      ) : null}
    </div>
  );
}

export function SimpleListCard({ title, items }: { title: string; items: string[] }) {
  return (
    <Card muted className="p-5">
      <p className="ui-kicker">{title}</p>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-text">
        {items.length > 0 ? items.map((item) => <li key={`${title}-${item}`}>{item}</li>) : <li>표시할 항목이 없습니다.</li>}
      </ul>
    </Card>
  );
}

export function MiniSummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-line/60 bg-white/70 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">{label}</p>
      <p className="mt-2 text-sm font-medium text-text">{value}</p>
    </div>
  );
}

export function LawbotConnectionReadinessCard({
  snapshot,
  storedSnapshot,
  className = ""
}: {
  snapshot: LawbotConnectionSnapshot;
  storedSnapshot: StoredLawbotSnapshot | null;
  className?: string;
}) {
  return (
    <Card muted className={`${className} p-5`.trim()}>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="ui-kicker">사건 기반 Lawbot 연결 준비</p>
          <p className="mt-3 text-sm text-text">
            현재 사건 데이터로 바로 분석을 실행할 수 있는지 환경변수와 입력 컨텍스트 상태를 함께 표시합니다.
          </p>
        </div>
        <Badge className={snapshot.connectionReady ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700"}>
          {snapshot.connectionReady ? "즉시 연결 가능" : "연결 준비 중"}
        </Badge>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <MiniSummaryCard label="분석 URL" value={snapshot.hasAnalyzeUrl ? "설정됨" : "미설정"} />
        <MiniSummaryCard label="분석 토큰" value={snapshot.hasAnalyzeToken ? "설정됨" : "미설정"} />
        <MiniSummaryCard
          label="입력 컨텍스트"
          value={snapshot.availableContextLabels.length > 0 ? `${snapshot.availableContextLabels.length}개` : "기본 정보만 있음"}
        />
      </div>

      {storedSnapshot ? (
        <div className="mt-4 grid gap-4 xl:grid-cols-3">
          <MiniSummaryCard
            label="마지막 분석 시각"
            value={storedSnapshot.analyzedAt ? new Date(storedSnapshot.analyzedAt).toLocaleString("ko-KR") : "기록 없음"}
          />
          <MiniSummaryCard label="저장 상태" value={storedSnapshot.status ?? "기록 없음"} />
          <MiniSummaryCard label="스냅샷 버전" value={`v${storedSnapshot.version}`} />
        </div>
      ) : null}

      {storedSnapshot?.summary ? (
        <div className="mt-4 rounded-2xl border border-line/60 bg-white/70 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">마지막 분석 요약</p>
          <p className="mt-2 text-sm text-text">{storedSnapshot.summary}</p>
          {storedSnapshot.payload?.practical_use_status ? (
            <p className="mt-2 text-xs text-text-muted">실전 사용 상태: {storedSnapshot.payload.practical_use_status}</p>
          ) : null}
        </div>
      ) : null}

      {snapshot.recommendedMissingFields.length > 0 ? (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">연결 전 보강 권장</p>
          <ul className="mt-2 list-disc space-y-2 pl-5 text-sm text-text">
            {snapshot.recommendedMissingFields.map((item) => (
              <li key={`lawbot-missing-${item}`}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-4 rounded-2xl border border-line/60 bg-white/70 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">Lawbot 입력 미리보기</p>
        <pre className="mt-3 whitespace-pre-wrap text-xs leading-6 text-text">{snapshot.factInputPreview}</pre>
      </div>
    </Card>
  );
}

export function LawbotExecutionFlowCard({
  executionFlow,
  className = ""
}: {
  executionFlow: {
    headline: string;
    description: string;
    steps: string[];
    fallbackNote: string;
  };
  className?: string;
}) {
  return (
    <Card muted className={`${className} p-5`.trim()}>
      <p className="ui-kicker">사건 기반 실행 흐름</p>
      <p className="mt-3 text-sm font-medium text-text">{executionFlow.headline}</p>
      <p className="mt-2 text-sm text-text-muted">{executionFlow.description}</p>
      <div className="mt-4 grid gap-3 xl:grid-cols-3">
        {executionFlow.steps.map((step, index) => (
          <MiniSummaryCard key={`lawbot-step-${index}`} label={`Step ${index + 1}`} value={step} />
        ))}
      </div>
      <div className="mt-4 rounded-2xl border border-line/60 bg-white/70 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">Fallback 기준</p>
        <p className="mt-2 text-sm text-text">{executionFlow.fallbackNote}</p>
      </div>
    </Card>
  );
}

export function SearchQueryCard({ title, items }: { title: string; items: string[] }) {
  return (
    <Card muted className="p-5">
      <p className="ui-kicker">{title}</p>
      <div className="mt-3 space-y-3">
        {items.length > 0 ? (
          items.map((item) => (
            <div key={`${title}-${item}`} className="rounded-2xl border border-line/60 bg-white/70 p-4">
              <p className="text-sm font-semibold text-text">{item}</p>
              <SearchActions query={item} label="관련 검색" className="mt-3" />
            </div>
          ))
        ) : (
          <p className="text-sm text-text-muted">표시할 항목이 없습니다.</p>
        )}
      </div>
    </Card>
  );
}

export function ReferenceCard({
  title,
  items,
  emptyMessage,
  searchLabel
}: {
  title: string;
  items: Array<{ title: string; searchQuery: string; meta: string; body: string }>;
  emptyMessage: string;
  searchLabel: string;
}) {
  return (
    <Card muted className="p-5">
      <p className="ui-kicker">{title}</p>
      {items.length > 0 ? (
        <div className="mt-3 space-y-3">
          {items.map((item) => (
            <div key={`${title}-${item.title}-${item.meta}`} className="rounded-2xl border border-line/60 bg-white/70 p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-sm font-semibold text-text">{item.title}</p>
                  {item.meta ? <p className="mt-1 text-xs text-text-muted">{item.meta}</p> : null}
                </div>
                <SearchActions query={item.searchQuery} label={searchLabel} />
              </div>
              <p className="mt-2 text-sm text-text-muted">{item.body}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm text-text-muted">{emptyMessage}</p>
      )}
    </Card>
  );
}

export function SupplementalSourcesCard({
  sources
}: {
  sources: Record<string, Array<Record<string, unknown>>>;
}) {
  const entries = Object.entries(sources).filter(([, items]) => Array.isArray(items) && items.length > 0);
  if (entries.length === 0) {
    return null;
  }

  return (
    <Card muted className="mt-5 p-5">
      <p className="ui-kicker">보조 참고자료</p>
      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        {entries.map(([category, items]) => (
          <div key={category} className="rounded-2xl border border-line/60 bg-white/70 p-4">
            <p className="text-sm font-semibold text-text">{labelSupplementalCategory(category)}</p>
            <div className="mt-3 space-y-3">
              {items.map((item, index) => (
                <div key={`${category}-${index}`} className="rounded-2xl border border-line/50 bg-surface/80 p-3">
                  <p className="text-sm font-medium text-text">{String(item.title ?? item.query ?? "참고 자료")}</p>
                  <p className="mt-1 text-xs text-text-muted">
                    {[item.kind, item.source, item.number, item.date].filter(Boolean).join(" · ")}
                  </p>
                  {item.snippet ? (
                    <p className="mt-2 whitespace-pre-line text-sm text-text-muted">{String(item.snippet)}</p>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function labelSupplementalCategory(category: string) {
  if (category === "laws") return "법령 보조 자료";
  if (category === "precedents") return "판례 보조 자료";
  if (category === "interpretations") return "해석례 보조 자료";
  if (category === "admin_rules") return "행정규칙/고시";
  if (category === "ordinances") return "자치법규";
  if (category === "admin_appeals") return "행정심판/재결례";
  return category;
}

export function SearchActions({
  query,
  label,
  className = ""
}: {
  query: string;
  label: string;
  className?: string;
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

  const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(`site:law.go.kr ${query}`)}`;

  return (
    <div className={`flex flex-wrap gap-2 ${className}`.trim()}>
      <Button type="button" size="sm" variant="secondary" onClick={copyQuery}>
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
