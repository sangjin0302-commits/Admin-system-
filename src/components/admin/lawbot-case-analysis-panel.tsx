"use client";

import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { LawbotCaseAnalysisResult } from "@/lib/services/lawbot-case-analysis-service";

export function LawbotCaseAnalysisPanel({
  inquiryId,
  initialResult
}: {
  inquiryId: string;
  initialResult: LawbotCaseAnalysisResult;
}) {
  const [result, setResult] = useState<LawbotCaseAnalysisResult>(initialResult);
  const [isRefreshing, setIsRefreshing] = useState(false);

  async function refreshAnalysis() {
    try {
      setIsRefreshing(true);
      const response = await fetch(`/api/admin/inquiries/${inquiryId}/lawbot-analysis`, {
        method: "GET",
        cache: "no-store"
      });

      if (!response.ok) {
        setResult({
          status: "error",
          message: `Lawbot 분석을 다시 불러오지 못했습니다. (${response.status})`
        });
        return;
      }

      const payload = (await response.json()) as { result: LawbotCaseAnalysisResult };
      setResult(payload.result);
    } catch {
      setResult({
        status: "error",
        message: "Lawbot 분석을 다시 불러오는 중 문제가 발생했습니다."
      });
    } finally {
      setIsRefreshing(false);
    }
  }

  return renderPanel(result, refreshAnalysis, isRefreshing);
}

function renderPanel(
  result: LawbotCaseAnalysisResult,
  onRefresh: () => void,
  isRefreshing: boolean
) {
  if (result.status === "disabled") {
    return (
      <Card className="p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h3 className="ui-section-title">Lawbot 참고 분석</h3>
            <p className="mt-3 text-sm text-text-muted">{result.message}</p>
          </div>
          <RefreshButton onRefresh={onRefresh} isRefreshing={isRefreshing} />
        </div>
        <Card muted className="mt-4 p-5">
          <p className="ui-kicker">나중에 연결하는 방법</p>
          <p className="mt-3 text-sm text-text">
            환경변수 `LAWBOT_ANALYZE_URL`에 Lawbot 공개 분석 주소를 넣으면 이 패널에서 사건별 참고 법령과 판례 검색어를 자동으로 불러옵니다.
          </p>
        </Card>
      </Card>
    );
  }

  if (result.status === "error") {
    return (
      <Card className="p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h3 className="ui-section-title">Lawbot 참고 분석</h3>
            <p className="mt-3 text-sm text-text-muted">{result.message}</p>
          </div>
          <RefreshButton onRefresh={onRefresh} isRefreshing={isRefreshing} />
        </div>
      </Card>
    );
  }

  const data = result.data;
  const analysisNote = [
    "[Lawbot 참고 메모]",
    `- 입력 요약: ${data.input_summary}`,
    data.analysis_mode ? `- 분석 모드: ${data.analysis_mode === "internal" ? "내부 심화 분석" : "공개 빠른 분석"}` : null,
    "",
    "[핵심 쟁점]",
    ...(data.key_issues.length > 0 ? data.key_issues.map((item) => `- ${item}`) : ["- 원문 명시 없음"]),
    "",
    "[추가 확인 사실]",
    ...(data.followup_facts.length > 0 ? data.followup_facts.map((item) => `- ${item}`) : ["- 원문 명시 없음"]),
    "",
    "[참고 법령]",
    ...(data.applicable_laws.length > 0
      ? data.applicable_laws.map((item) => `- ${item.law}: ${item.summary}`)
      : ["- 원문 명시 없음"]),
    "",
    "[유리 포인트]",
    ...(data.pros?.length ? data.pros.map((item) => `- ${item}`) : ["- 추가 정리 없음"]),
    "",
    "[불리 포인트]",
    ...(data.cons?.length ? data.cons.map((item) => `- ${item}`) : ["- 추가 정리 없음"]),
  ]
    .filter(Boolean)
    .join("\n");
  const searchChecklist = [
    "[Lawbot 후속 검색 체크리스트]",
    ...(data.next_search_recommendations.length > 0
      ? data.next_search_recommendations.map((item) => `- ${item}`)
      : ["- 후속 검색 추천 없음"]),
    "",
    "[판례 검토 검색어]",
    ...(
      data.precedent_search_suggestions?.map((item) => item.query) ??
      data.recommended_search_queries.filter((item) => item.kind === "precedent").map((item) => item.query)
    ).map((item) => `- ${item}`),
  ].join("\n");

  return (
    <Card className="p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h3 className="ui-section-title">Lawbot 참고 분석</h3>
          <p className="mt-2 text-sm text-text-muted">
            {data.analysis_mode === "internal"
              ? "내부 심화 분석 기준으로 관련 법령, 판례·해석례, 주장 전략과 리스크 포인트를 함께 정리했습니다."
              : "공개 분석 엔진 기준으로 관련 법령, 쟁점, 후속 검색어를 함께 정리했습니다."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge>{data.analysis_mode === "internal" ? "내부 심화 분석" : "실시간 참고"}</Badge>
          {data.precedent_source_type && data.precedent_source_type !== "none" ? (
            <Badge className="border-line-strong bg-surface text-text-strong">
              판례 {data.precedent_source_type === "real" ? "실검색" : "보조추천"}
            </Badge>
          ) : null}
          {data.interpret_source_type && data.interpret_source_type !== "none" ? (
            <Badge className="border-line-strong bg-surface text-text-strong">
              해석례 {data.interpret_source_type === "real" ? "실검색" : "보조추천"}
            </Badge>
          ) : null}
          <Button size="sm" variant="secondary" onClick={() => void navigator.clipboard.writeText(analysisNote)}>
            메모용 요약 복사
          </Button>
          <Button size="sm" variant="secondary" onClick={() => void navigator.clipboard.writeText(searchChecklist)}>
            검색 체크리스트 복사
          </Button>
          <RefreshButton onRefresh={onRefresh} isRefreshing={isRefreshing} />
        </div>
      </div>

      <Card muted className="mt-5 p-5">
        <p className="ui-kicker">입력 요약</p>
        <p className="mt-3 text-sm text-text">{data.input_summary}</p>
      </Card>

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        <SimpleListCard title="핵심 쟁점" items={data.key_issues} />
        <SimpleListCard title="추가 확인 사실" items={data.followup_facts} />
      </div>

      {(data.pros?.length || data.cons?.length) ? (
        <div className="mt-5 grid gap-4 xl:grid-cols-2">
          <SimpleListCard title="유리 포인트" items={data.pros ?? []} />
          <SimpleListCard title="불리 포인트" items={data.cons ?? []} />
        </div>
      ) : null}

      <Card muted className="mt-5 p-5">
        <p className="ui-kicker">참고 법령 요약</p>
        <div className="mt-3 space-y-3">
          {data.applicable_laws.map((item) => (
            <div key={item.law} className="rounded-2xl border border-border/60 bg-white/70 p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-sm font-semibold text-text">{item.law}</p>
                  <p className="mt-2 text-sm text-text-muted">{item.summary}</p>
                </div>
                <SearchActions query={item.law} label="법령 검색" />
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        <SimpleListCard title="후속 검색 추천" items={data.next_search_recommendations} />
        <SearchQueryCard
          title="판례 검토 검색어"
          items={
            data.precedent_search_suggestions?.map((item) => item.query) ??
            data.recommended_search_queries
              .filter((item) => item.kind === "precedent")
              .map((item) => item.query)
          }
        />
      </div>

      {(data.argument_strategy?.length || data.counter_argument_points?.length) ? (
        <div className="mt-5 grid gap-4 xl:grid-cols-2">
          <SimpleListCard title="권장 주장 전략" items={data.argument_strategy ?? []} />
          <SimpleListCard title="예상 반론 포인트" items={data.counter_argument_points ?? []} />
        </div>
      ) : null}

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        <ReferenceCard
          title="참고 판례"
          items={
            data.related_precedents?.map((item) => ({
              title: item.case_name,
              searchQuery: `${item.case_name} ${item.case_number}`,
              meta: [item.case_number, item.court_name ?? "", item.decision_date ?? ""]
                .filter(Boolean)
                .join(" · "),
              body: item.reason
            })) ?? []
          }
          emptyMessage="표시할 참고 판례가 없습니다. 재분석하거나 판례 검토 검색어를 활용해 보세요."
          searchLabel="판례 검색"
        />
        <ReferenceCard
          title="참고 해석례"
          items={
            data.related_interpretations?.map((item) => ({
              title: item.title,
              searchQuery: `${item.title} ${item.number ?? ""}`.trim(),
              meta: [item.number ?? "", item.agency ?? "", item.decision_date ?? ""]
                .filter(Boolean)
                .join(" · "),
              body: item.reason
            })) ?? []
          }
          emptyMessage="표시할 참고 해석례가 없습니다."
          searchLabel="해석례 검색"
        />
      </div>
    </Card>
  );
}

function RefreshButton({
  onRefresh,
  isRefreshing
}: {
  onRefresh: () => void;
  isRefreshing: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onRefresh}
      disabled={isRefreshing}
      className="inline-flex items-center rounded-full border border-border/70 px-4 py-2 text-xs font-medium text-text transition hover:bg-surface disabled:cursor-not-allowed disabled:opacity-60"
    >
      {isRefreshing ? "다시 분석 중..." : "재분석"}
    </button>
  );
}

function SimpleListCard({ title, items }: { title: string; items: string[] }) {
  return (
    <Card muted className="p-5">
      <p className="ui-kicker">{title}</p>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-text">
        {items.length > 0 ? (
          items.map((item) => <li key={`${title}-${item}`}>{item}</li>)
        ) : (
          <li>표시할 항목이 없습니다.</li>
        )}
      </ul>
    </Card>
  );
}

function SearchQueryCard({ title, items }: { title: string; items: string[] }) {
  return (
    <Card muted className="p-5">
      <p className="ui-kicker">{title}</p>
      <div className="mt-3 space-y-3">
        {items.length > 0 ? (
          items.map((item) => (
            <div key={`${title}-${item}`} className="rounded-2xl border border-border/60 bg-white/70 p-4">
              <p className="text-sm font-semibold text-text">{item}</p>
              <SearchActions query={item} label="판례 검색" className="mt-3" />
            </div>
          ))
        ) : (
          <p className="text-sm text-text-muted">표시할 항목이 없습니다.</p>
        )}
      </div>
    </Card>
  );
}

function ReferenceCard({
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
            <div key={`${title}-${item.title}-${item.meta}`} className="rounded-2xl border border-border/60 bg-white/70 p-4">
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

function SearchActions({
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
