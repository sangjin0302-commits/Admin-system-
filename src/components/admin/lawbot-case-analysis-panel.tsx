"use client";

import { useState } from "react";

import {
  LawbotConnectionReadinessCard,
  LawbotExecutionFlowCard,
  MatchedArticleCard,
  MatchedLawCard,
  MiniSummaryCard,
  ReferenceCard,
  RefreshButton,
  SearchActions,
  SearchQueryCard,
  SimpleListCard,
  SupplementalSourcesCard
} from "@/components/admin/lawbot-case-analysis-sections";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { parseClientApiError } from "@/lib/http/client-api";
import type {
  LawbotCaseAnalysisResult,
  LawbotConnectionSnapshot,
  StoredLawbotSnapshot
} from "@/lib/services/lawbot-case-analysis-service";

type AvailableLawbotData = Extract<LawbotCaseAnalysisResult, { status: "available" }>["data"];

export function LawbotCaseAnalysisPanel({
  inquiryId,
  initialResult,
  connectionSnapshot,
  storedSnapshot
}: {
  inquiryId: string;
  initialResult: LawbotCaseAnalysisResult;
  connectionSnapshot: LawbotConnectionSnapshot;
  storedSnapshot: StoredLawbotSnapshot | null;
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
          message: await parseClientApiError(response, "Lawbot 분석 결과를 다시 불러오지 못했습니다.")
        });
        return;
      }

      const payload = (await response.json().catch(() => null)) as { result?: LawbotCaseAnalysisResult } | null;
      if (!payload?.result) {
        setResult({
          status: "error",
          message: "Lawbot 응답 형식이 올바르지 않아 분석 결과를 갱신하지 못했습니다."
        });
        return;
      }

      setResult(payload.result);
    } catch {
      setResult({
        status: "error",
        message: "Lawbot 분석 결과를 다시 불러오는 중 문제가 발생했습니다."
      });
    } finally {
      setIsRefreshing(false);
    }
  }

  return renderPanel(result, refreshAnalysis, isRefreshing, connectionSnapshot, storedSnapshot);
}

function renderPanel(
  result: LawbotCaseAnalysisResult,
  onRefresh: () => void,
  isRefreshing: boolean,
  connectionSnapshot: LawbotConnectionSnapshot,
  storedSnapshot: StoredLawbotSnapshot | null
) {
  const executionFlow = buildExecutionFlow(connectionSnapshot, storedSnapshot);

  if (result.status === "disabled") {
    return (
      <Card className="p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h3 className="ui-section-title">Lawbot 참고 분석</h3>
            <p className="mt-3 text-sm text-text-muted">{result.message}</p>
          </div>
          <RefreshButton
            onRefresh={onRefresh}
            isRefreshing={isRefreshing}
            hasStoredSnapshot={Boolean(storedSnapshot)}
            connectionReady={connectionSnapshot.connectionReady}
          />
        </div>
        <Card muted className="mt-4 p-5">
          <p className="ui-kicker">연동 설정 안내</p>
          <p className="mt-3 text-sm text-text">
            환경변수 `LAWBOT_ANALYZE_URL`과 `LAWBOT_ANALYZE_TOKEN`을 설정하면 사건 상세 화면에서 바로 분석을 실행하고 결과를 저장할 수 있습니다.
          </p>
        </Card>
        <LawbotConnectionReadinessCard snapshot={connectionSnapshot} storedSnapshot={storedSnapshot} className="mt-4" />
        <LawbotExecutionFlowCard executionFlow={executionFlow} className="mt-4" />
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
          <RefreshButton
            onRefresh={onRefresh}
            isRefreshing={isRefreshing}
            hasStoredSnapshot={Boolean(storedSnapshot)}
            connectionReady={connectionSnapshot.connectionReady}
          />
        </div>
        <LawbotConnectionReadinessCard snapshot={connectionSnapshot} storedSnapshot={storedSnapshot} className="mt-4" />
        <LawbotExecutionFlowCard executionFlow={executionFlow} className="mt-4" />
      </Card>
    );
  }

  const data = result.data;
  const practicalStatusTone = getPracticalStatusTone(data.practical_use_status);
  const safetySummary = buildSafetySummary(data);
  const analysisNote = buildAnalysisNote(data);
  const searchChecklist = buildSearchChecklist(data);
  const precedentQueries =
    data.precedent_search_suggestions?.map((item) => item.query) ??
    data.recommended_search_queries.filter((item) => item.kind === "precedent").map((item) => item.query);

  return (
    <Card className="p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h3 className="ui-section-title">Lawbot 참고 분석</h3>
          <p className="mt-2 text-sm text-text-muted">
            {data.analysis_mode === "internal"
              ? "내부 심화 분석 기준으로 관련 법령, 판례/해석례, 리스크와 실무 체크포인트를 정리했습니다."
              : "공개 참고 분석 기준으로 관련 법령, 핵심 쟁점, 후속 검색어를 정리했습니다."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge>{data.analysis_mode === "internal" ? "내부 심화 분석" : "공개 빠른 분석"}</Badge>
          {data.practical_use_status ? (
            <Badge className={practicalStatusTone.badgeClass}>{practicalStatusTone.label}</Badge>
          ) : null}
          {data.precedent_source_type && data.precedent_source_type !== "none" ? (
            <Badge className="border-line-strong bg-surface text-text-strong">
              판례 {data.precedent_source_type === "real" ? "실데이터" : "보조추천"}
            </Badge>
          ) : null}
          {data.interpret_source_type && data.interpret_source_type !== "none" ? (
            <Badge className="border-line-strong bg-surface text-text-strong">
              해석례 {data.interpret_source_type === "real" ? "실데이터" : "보조추천"}
            </Badge>
          ) : null}
          <Button size="sm" variant="secondary" onClick={() => void navigator.clipboard.writeText(analysisNote)}>
            메모용 요약 복사
          </Button>
          <Button size="sm" variant="secondary" onClick={() => void navigator.clipboard.writeText(searchChecklist)}>
            조사 체크리스트 복사
          </Button>
          <RefreshButton
            onRefresh={onRefresh}
            isRefreshing={isRefreshing}
            hasStoredSnapshot={Boolean(storedSnapshot)}
            connectionReady={connectionSnapshot.connectionReady}
          />
        </div>
      </div>

      <Card muted className="mt-5 p-5">
        <p className="ui-kicker">입력 요약</p>
        <p className="mt-3 text-sm text-text">{data.input_summary}</p>
      </Card>

      <LawbotConnectionReadinessCard snapshot={connectionSnapshot} storedSnapshot={storedSnapshot} className="mt-5" />
      <LawbotExecutionFlowCard executionFlow={executionFlow} className="mt-5" />

      {safetySummary ? (
        <Card className={`mt-5 border ${practicalStatusTone.cardClass} p-5`}>
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="ui-kicker">실무 안전 요약</p>
              <p className="mt-3 text-lg font-semibold text-text">{safetySummary.headline}</p>
              <p className="mt-2 text-sm text-text-muted">{safetySummary.description}</p>
            </div>
            <Badge className={practicalStatusTone.badgeClass}>{practicalStatusTone.label}</Badge>
          </div>
          <div className="mt-4 grid gap-3 xl:grid-cols-3">
            {safetySummary.priorityAction ? <MiniSummaryCard label="우선 확인" value={safetySummary.priorityAction} /> : null}
            {safetySummary.missingFact ? <MiniSummaryCard label="빠진 핵심 사실" value={safetySummary.missingFact} /> : null}
            {safetySummary.documentNeed ? <MiniSummaryCard label="먼저 받을 자료" value={safetySummary.documentNeed} /> : null}
          </div>
        </Card>
      ) : null}

      {data.confidence_score !== undefined || data.match_reason || data.sync_ready !== undefined ? (
        <div className="mt-5 grid gap-4 xl:grid-cols-3">
          {data.confidence_score !== undefined ? (
            <Card muted className="p-5">
              <p className="ui-kicker">분석 신뢰도</p>
              <p className="mt-3 text-2xl font-semibold text-text">
                {Math.round(data.confidence_score)}점
                {data.confidence_label ? <span className="ml-2 text-sm font-medium text-text-muted">{data.confidence_label}</span> : null}
              </p>
            </Card>
          ) : null}
          {data.sync_ready !== undefined ? (
            <Card muted className="p-5">
              <p className="ui-kicker">동기화 준비</p>
              <p className="mt-3 text-lg font-semibold text-text">{data.sync_ready ? "즉시 동기화 가능" : "보조 검토 후 동기화 권장"}</p>
            </Card>
          ) : null}
          {data.match_reason ? (
            <Card muted className="p-5">
              <p className="ui-kicker">매칭 근거</p>
              <p className="mt-3 text-sm text-text">{data.match_reason}</p>
            </Card>
          ) : null}
        </div>
      ) : null}

      {data.practical_use_status || data.review_required_reasons?.length || data.critical_missing_facts?.length ? (
        <div className="mt-5 grid gap-4 xl:grid-cols-3">
          {data.practical_use_status ? (
            <Card muted className="p-5">
              <p className="ui-kicker">실전 사용 상태</p>
              <p className="mt-3 text-lg font-semibold text-text">{data.practical_use_status}</p>
            </Card>
          ) : null}
          {data.review_required_reasons?.length ? (
            <SimpleListCard title="추가 검토 필요 사유" items={data.review_required_reasons} />
          ) : null}
          {data.critical_missing_facts?.length ? (
            <SimpleListCard title="빠진 핵심 사실" items={data.critical_missing_facts} />
          ) : null}
        </div>
      ) : null}

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        <SimpleListCard title="핵심 쟁점" items={data.key_issues} />
        <SimpleListCard title="추가 확인 사실" items={data.followup_facts} />
      </div>

      {data.question_intents?.length || data.intent_notes?.length ? (
        <div className="mt-5 grid gap-4 xl:grid-cols-2">
          <SimpleListCard title="질문 의도 해석" items={(data.question_intents ?? []).map(formatQuestionIntent)} />
          <SimpleListCard title="질문 의도 메모" items={data.intent_notes ?? []} />
        </div>
      ) : null}

      {data.domain_overview_notes?.length || data.research_goal || data.research_tracks?.length || data.authority_path?.length || data.initial_checkpoints?.length ? (
        <div className="mt-5 grid gap-4 xl:grid-cols-2">
          <SimpleListCard title="분야 개요" items={data.domain_overview_notes ?? []} />
          <Card muted className="p-5">
            <p className="ui-kicker">조사 목표</p>
            <p className="mt-3 text-sm text-text">{data.research_goal ?? "표시할 목표가 없습니다."}</p>
            {data.research_tracks?.length ? (
              <>
                <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">조사 트랙</p>
                <ul className="mt-2 list-disc space-y-2 pl-5 text-sm text-text">
                  {data.research_tracks.map((item) => (
                    <li key={`research-track-${item}`}>{item}</li>
                  ))}
                </ul>
              </>
            ) : null}
            {data.authority_path?.length ? (
              <>
                <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">권한 기관 경로</p>
                <ul className="mt-2 list-disc space-y-2 pl-5 text-sm text-text">
                  {data.authority_path.map((item) => (
                    <li key={`authority-path-${item}`}>{item}</li>
                  ))}
                </ul>
              </>
            ) : null}
            {data.initial_checkpoints?.length ? (
              <>
                <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">초기 확인 포인트</p>
                <ul className="mt-2 list-disc space-y-2 pl-5 text-sm text-text">
                  {data.initial_checkpoints.map((item) => (
                    <li key={`initial-checkpoint-${item}`}>{item}</li>
                  ))}
                </ul>
              </>
            ) : null}
          </Card>
        </div>
      ) : null}

      {data.domain_routes?.length || data.research_subtypes?.length || data.subtype_notes?.length ? (
        <div className="mt-5 grid gap-4 xl:grid-cols-2">
          <SimpleListCard title="분야 라우팅" items={(data.domain_routes ?? []).map(formatDomainRoute)} />
          <SimpleListCard
            title="세부 유형 라우팅"
            items={[...(data.research_subtypes ?? []).map(formatResearchSubtype), ...(data.subtype_notes ?? [])]}
          />
        </div>
      ) : null}

      {data.priority_actions?.length || data.risk_flags?.length ? (
        <div className="mt-5 grid gap-4 xl:grid-cols-2">
          <SimpleListCard title="우선 액션" items={data.priority_actions ?? []} />
          <SimpleListCard title="리스크 플래그" items={data.risk_flags ?? []} />
        </div>
      ) : null}

      {data.practical_checklist?.length || data.document_checklist?.length ? (
        <div className="mt-5 grid gap-4 xl:grid-cols-2">
          <SimpleListCard title="실무 체크리스트" items={data.practical_checklist ?? []} />
          <SimpleListCard title="준비 자료 체크리스트" items={data.document_checklist ?? []} />
        </div>
      ) : null}

      {data.study_guide?.length ? (
        <div className="mt-5">
          <SimpleListCard title="공부 가이드" items={data.study_guide} />
        </div>
      ) : null}

      {data.visa_specific_guidance?.length || data.visa_scenario_guidance?.length ? (
        <div className="mt-5 grid gap-4 xl:grid-cols-2">
          <SimpleListCard title="비자 유형별 준비 포인트" items={data.visa_specific_guidance ?? []} />
          <SimpleListCard title="비자 세부 대응 포인트" items={data.visa_scenario_guidance ?? []} />
        </div>
      ) : null}

      {data.admin_appeal_deep_guidance?.length || data.admin_appeal_timeline_guidance?.length ? (
        <div className="mt-5 grid gap-4 xl:grid-cols-2">
          <SimpleListCard title="행정심판 심화 포인트" items={data.admin_appeal_deep_guidance ?? []} />
          <SimpleListCard title="행정심판 기간·집행정지 포인트" items={data.admin_appeal_timeline_guidance ?? []} />
        </div>
      ) : null}

      {data.licensing_industry_guidance?.length || data.licensing_sector_deep_guidance?.length ? (
        <div className="mt-5 grid gap-4 xl:grid-cols-2">
          <SimpleListCard title="업종별 인허가 포인트" items={data.licensing_industry_guidance ?? []} />
          <SimpleListCard title="업종별 인허가 심화 체크" items={data.licensing_sector_deep_guidance ?? []} />
        </div>
      ) : null}

      {data.playbook_legal_bases?.length || data.common_failure_points?.length ? (
        <div className="mt-5 grid gap-4 xl:grid-cols-2">
          <SimpleListCard title="플레이북 근거 법령" items={data.playbook_legal_bases ?? []} />
          <SimpleListCard title="자주 발생하는 실패 포인트" items={data.common_failure_points ?? []} />
        </div>
      ) : null}

      {data.supplemental_source_highlights?.length || data.source_connection_notes?.length || data.followup_narrow_questions?.length ? (
        <div className="mt-5 grid gap-4 xl:grid-cols-3">
          <SimpleListCard title="보조 자료 하이라이트" items={data.supplemental_source_highlights ?? []} />
          <SimpleListCard title="자료 연결 메모" items={data.source_connection_notes ?? []} />
          <SimpleListCard title="후속 좁은 질문 추천" items={data.followup_narrow_questions ?? []} />
        </div>
      ) : null}

      <Card muted className="mt-5 p-5">
        <p className="ui-kicker">참고 법령 요약</p>
        <div className="mt-3 space-y-3">
          {data.applicable_laws.map((item) => (
            <div key={item.law} className="rounded-2xl border border-line/60 bg-white/70 p-4">
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
        <SearchQueryCard title="판례 검색 키워드" items={precedentQueries} />
      </div>

      {data.argument_strategy?.length || data.counter_argument_points?.length ? (
        <div className="mt-5 grid gap-4 xl:grid-cols-2">
          <SimpleListCard title="권장 주장 프레임" items={data.argument_strategy ?? []} />
          <SimpleListCard title="예상 반론 포인트" items={data.counter_argument_points ?? []} />
        </div>
      ) : null}

      {data.matched_laws?.length || data.matched_articles?.length ? (
        <div className="mt-5 grid gap-4 xl:grid-cols-2">
          <MatchedLawCard items={data.matched_laws ?? []} />
          <MatchedArticleCard items={data.matched_articles ?? []} />
        </div>
      ) : null}

      {data.supplemental_sources ? <SupplementalSourcesCard sources={data.supplemental_sources} /> : null}

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        <ReferenceCard
          title="참고 판례"
          items={
            data.related_precedents?.map((item) => ({
              title: item.case_name,
              searchQuery: `${item.case_name} ${item.case_number}`,
              meta: [item.case_number, item.court_name ?? "", item.decision_date ?? ""].filter(Boolean).join(" · "),
              body: item.reason
            })) ?? []
          }
          emptyMessage="표시할 참고 판례가 없습니다. 후속 검색 추천을 활용해 보세요."
          searchLabel="판례 검색"
        />
        <ReferenceCard
          title="참고 해석례"
          items={
            data.related_interpretations?.map((item) => ({
              title: item.title,
              searchQuery: `${item.title} ${item.number ?? ""}`.trim(),
              meta: [item.number ?? "", item.agency ?? "", item.decision_date ?? ""].filter(Boolean).join(" · "),
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

function formatQuestionIntent(item: {
  label: string;
  reason?: string;
  note?: string;
}) {
  return [item.label, item.reason, item.note].filter(Boolean).join(" - ");
}

function formatDomainRoute(item: {
  label: string;
  score?: number;
  why?: string;
  priority_sources?: string[];
}) {
  return [
    item.label,
    item.score !== undefined ? `${Math.round(item.score)}점` : null,
    item.why,
    item.priority_sources?.length ? `우선 자료: ${item.priority_sources.join(", ")}` : null
  ]
    .filter(Boolean)
    .join(" - ");
}

function formatResearchSubtype(item: {
  label: string;
  domain_key: string;
  score?: number;
  note?: string;
}) {
  return [item.label, item.domain_key, item.score !== undefined ? `${Math.round(item.score)}점` : null, item.note]
    .filter(Boolean)
    .join(" - ");
}

function getPracticalStatusTone(status?: string | null) {
  const normalized = status?.trim() ?? "";

  if (!normalized) {
    return {
      label: "실전 상태 미표기",
      badgeClass: "border-line-strong bg-surface text-text-strong",
      cardClass: "border-line/60 bg-surface/60"
    };
  }

  if (/(불가|위험|보류|추가 검토|주의|확인 필요)/.test(normalized)) {
    return {
      label: "주의 필요",
      badgeClass: "border-rose-200 bg-rose-50 text-rose-700",
      cardClass: "border-rose-200 bg-rose-50/80"
    };
  }

  if (/(가능|사용|진행|바로)/.test(normalized)) {
    return {
      label: "즉시 사용 가능",
      badgeClass: "border-emerald-200 bg-emerald-50 text-emerald-700",
      cardClass: "border-emerald-200 bg-emerald-50/80"
    };
  }

  return {
    label: "검토 권장",
    badgeClass: "border-amber-200 bg-amber-50 text-amber-700",
    cardClass: "border-amber-200 bg-amber-50/80"
  };
}

function buildSafetySummary(data: {
  practical_use_status?: string;
  review_required_reasons?: string[];
  critical_missing_facts?: string[];
  priority_actions?: string[];
  document_checklist?: string[];
}) {
  const priorityAction = data.priority_actions?.[0] ?? data.review_required_reasons?.[0] ?? null;
  const missingFact = data.critical_missing_facts?.[0] ?? null;
  const documentNeed = data.document_checklist?.[0] ?? null;

  if (!data.practical_use_status && !priorityAction && !missingFact && !documentNeed) {
    return null;
  }

  return {
    headline: data.practical_use_status ?? "실전 사용 상태를 먼저 확인해 주세요.",
    description: missingFact
      ? "핵심 사실 보강 여부를 먼저 확인한 뒤, 체크리스트 순서대로 대응 포인트를 검토하는 흐름을 권장합니다."
      : "상단 요약을 기준으로 지금 필요한 확인 항목과 준비 자료를 먼저 정리해 주세요.",
    priorityAction,
    missingFact,
    documentNeed
  };
}

function buildExecutionFlow(snapshot: LawbotConnectionSnapshot, storedSnapshot: StoredLawbotSnapshot | null) {
  if (!snapshot.connectionReady) {
    return {
      headline: "연결 준비를 먼저 점검하면 사건 화면에서 바로 실행할 수 있습니다.",
      description:
        snapshot.recommendedMissingFields.length > 0
          ? "환경설정과 사건 입력 보강을 마치면 별도 이동 없이 사건 화면에서 분석을 실행하고 결과를 저장할 수 있습니다."
          : "환경설정만 완료하면 사건 상세에서 바로 초기 분석을 실행할 수 있습니다.",
      steps: [
        "사건 입력 보강 추천 항목을 먼저 확인합니다.",
        "환경설정을 완료한 뒤 사건 화면에서 초기 분석을 실행합니다.",
        "실행 결과는 사건 스냅샷으로 저장되어 이후 fallback 기준으로 사용됩니다."
      ],
      fallbackNote: storedSnapshot
        ? "실시간 연결이 불안정해도 마지막 저장 스냅샷을 기준으로 사건 검토를 이어갈 수 있습니다."
        : "첫 연결 전에는 fallback 스냅샷이 없으므로 사건 입력값 점검이 특히 중요합니다."
    };
  }

  return {
    headline: storedSnapshot
      ? "사건 화면에서 재분석하고, 실패 시 마지막 저장 스냅샷으로 이어집니다."
      : "사건 화면에서 바로 초기 분석을 실행해 첫 스냅샷을 저장합니다.",
    description: "운영자는 사건 상세에서 분석 실행과 재분석을 처리하고, 저장된 스냅샷을 기준으로 견적/메모/후속 검색까지 연계할 수 있습니다.",
    steps: storedSnapshot
      ? [
          "현재 사건 입력으로 재분석을 실행합니다.",
          "성공하면 최신 결과가 사건 스냅샷으로 갱신됩니다.",
          "실패하거나 연결이 불안정하면 마지막 저장 스냅샷 기준으로 검토를 이어갑니다."
        ]
      : [
          "현재 사건 입력으로 초기 분석을 실행합니다.",
          "첫 결과를 사건 스냅샷으로 저장합니다.",
          "이후에는 이전 스냅샷과 비교해 변경 사항을 빠르게 확인합니다."
        ],
    fallbackNote: storedSnapshot
      ? "실시간 응답이 실패해도 사건에는 마지막 정상 결과가 남아 있어 운영 흐름이 끊기지 않습니다."
      : "첫 분석 전에는 fallback 데이터가 없으므로 입력값 정확성을 먼저 확인해 주세요."
  };
}

function buildAnalysisNote(data: AvailableLawbotData) {
  return [
    "[Lawbot 참고 메모]",
    `- 입력 요약: ${data.input_summary}`,
    data.analysis_mode ? `- 분석 모드: ${data.analysis_mode === "internal" ? "내부 심화 분석" : "공개 빠른 분석"}` : null,
    data.practical_use_status ? `- 실전 사용 상태: ${data.practical_use_status}` : null,
    "",
    "[핵심 쟁점]",
    ...(data.key_issues.length > 0 ? data.key_issues.map((item) => `- ${item}`) : ["- 항목 없음"]),
    "",
    "[추가 확인 사실]",
    ...(data.followup_facts.length > 0 ? data.followup_facts.map((item) => `- ${item}`) : ["- 항목 없음"]),
    ...(data.review_required_reasons?.length
      ? ["", "[추가 검토 필요 사유]", ...data.review_required_reasons.map((item) => `- ${item}`)]
      : []),
    ...(data.critical_missing_facts?.length
      ? ["", "[빠진 핵심 사실]", ...data.critical_missing_facts.map((item) => `- ${item}`)]
      : []),
    "",
    "[참고 법령]",
    ...(data.applicable_laws.length > 0 ? data.applicable_laws.map((item) => `- ${item.law}: ${item.summary}`) : ["- 항목 없음"]),
    "",
    "[실무 메모]",
    ...(data.practitioner_brief?.length ? data.practitioner_brief.map((item) => `- ${item}`) : ["- 항목 없음"])
  ]
    .filter(Boolean)
    .join("\n");
}

function buildSearchChecklist(data: AvailableLawbotData) {
  const confidenceLabel = data.confidence_label ? ` (${data.confidence_label})` : "";

  return [
    "[Lawbot 후속 검색 체크리스트]",
    data.confidence_score !== undefined ? `- 신뢰도: ${Math.round(data.confidence_score)}점${confidenceLabel}` : null,
    data.match_reason ? `- 매칭 근거: ${data.match_reason}` : null,
    ...(data.next_search_recommendations.length > 0 ? data.next_search_recommendations.map((item) => `- ${item}`) : ["- 후속 검색 추천 없음"]),
    ...(data.research_goal ? ["", "[조사 목표]", `- ${data.research_goal}`] : []),
    ...(data.practical_checklist?.length ? ["", "[실무 체크리스트]", ...data.practical_checklist.map((item) => `- ${item}`)] : []),
    ...(data.document_checklist?.length ? ["", "[준비 자료 체크리스트]", ...data.document_checklist.map((item) => `- ${item}`)] : []),
    ...(data.priority_actions?.length ? ["", "[우선 액션]", ...data.priority_actions.map((item) => `- ${item}`)] : []),
    ...(data.risk_flags?.length ? ["", "[리스크 플래그]", ...data.risk_flags.map((item) => `- ${item}`)] : []),
    "",
    "[정확 매칭 법령/조문]",
    ...(data.matched_laws?.length
      ? data.matched_laws.map((item) => `- ${item.law}${item.match_reason ?? item.reason ? `: ${item.match_reason ?? item.reason}` : ""}`)
      : ["- 정확 매칭 법령 없음"]),
    ...(data.matched_articles?.length
      ? data.matched_articles.map((item) => {
          const lawLabel = (item.law_name ?? item.law ?? "").trim();
          const articleLabel = (item.article_label ?? item.article ?? "").trim();
          const detail = item.summary ?? item.article_text;
          return `- ${lawLabel} ${articleLabel}${detail ? `: ${detail}` : ""}`;
        })
      : ["- 정확 매칭 조문 없음"]),
    "",
    "[판례 검색 키워드]",
    ...(
      data.precedent_search_suggestions?.map((item) => item.query) ??
      data.recommended_search_queries.filter((item) => item.kind === "precedent").map((item) => item.query)
    ).map((item) => `- ${item}`)
  ]
    .filter(Boolean)
    .join("\n");
}
