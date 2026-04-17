"use client";

import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type {
  LawbotCaseAnalysisResult,
  LawbotConnectionSnapshot,
  StoredLawbotSnapshot
} from "@/lib/services/lawbot-case-analysis-service";

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
          <p className="ui-kicker">나중에 연결하는 방법</p>
          <p className="mt-3 text-sm text-text">
            환경변수 `LAWBOT_ANALYZE_URL`에 Lawbot 공개 분석 주소를 넣으면 이 패널에서 사건별 참고 법령과 판례 검색어를 자동으로 불러옵니다.
          </p>
        </Card>
        <LawbotConnectionReadinessCard snapshot={connectionSnapshot} storedSnapshot={storedSnapshot} />
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
  const analysisNote = [
    "[Lawbot 참고 메모]",
    `- 입력 요약: ${data.input_summary}`,
    data.analysis_mode ? `- 분석 모드: ${data.analysis_mode === "internal" ? "내부 심화 분석" : "공개 빠른 분석"}` : null,
    data.practical_use_status ? `- 실전 사용 상태: ${data.practical_use_status}` : null,
    "",
    "[핵심 쟁점]",
    ...(data.key_issues.length > 0 ? data.key_issues.map((item) => `- ${item}`) : ["- 원문 명시 없음"]),
    "",
    "[추가 확인 사실]",
    ...(data.followup_facts.length > 0 ? data.followup_facts.map((item) => `- ${item}`) : ["- 원문 명시 없음"]),
    ...(data.review_required_reasons?.length
      ? ["", "[추가 검토 필요 사유]", ...data.review_required_reasons.map((item) => `- ${item}`)]
      : []),
    ...(data.critical_missing_facts?.length
      ? ["", "[빠진 핵심 사실]", ...data.critical_missing_facts.map((item) => `- ${item}`)]
      : []),
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
    "",
    "[실무자용 메모]",
    ...(data.practitioner_brief?.length ? data.practitioner_brief.map((item) => `- ${item}`) : ["- 추가 정리 없음"]),
    "",
    "[교육용 설명]",
    ...(data.training_notes?.length ? data.training_notes.map((item) => `- ${item}`) : ["- 추가 정리 없음"]),
  ]
    .filter(Boolean)
    .join("\n");
  const searchChecklist = [
    "[Lawbot 후속 검색 체크리스트]",
    data.confidence_score !== undefined
      ? `- 신뢰도: ${Math.round(data.confidence_score)}점${data.confidence_label ? ` (${data.confidence_label})` : ""}`
      : null,
    data.match_reason ? `- 매칭 근거: ${data.match_reason}` : null,
    ...(data.next_search_recommendations.length > 0
      ? data.next_search_recommendations.map((item) => `- ${item}`)
      : ["- 후속 검색 추천 없음"]),
    ...(data.research_goal ? ["", `[조사 목표]`, `- ${data.research_goal}`] : []),
    ...(data.practical_checklist?.length
      ? ["", "[실무 체크리스트]", ...data.practical_checklist.map((item) => `- ${item}`)]
      : []),
    ...(data.document_checklist?.length
      ? ["", "[준비 자료 체크리스트]", ...data.document_checklist.map((item) => `- ${item}`)]
      : []),
    ...(data.priority_actions?.length ? ["", "[우선 액션]", ...data.priority_actions.map((item) => `- ${item}`)] : []),
    ...(data.risk_flags?.length ? ["", "[리스크 플래그]", ...data.risk_flags.map((item) => `- ${item}`)] : []),
    "",
    "[정확 매칭 법령/조문]",
    ...(data.matched_laws?.length
      ? data.matched_laws.map((item) => `- ${item.law}${item.match_reason ?? item.reason ? `: ${item.match_reason ?? item.reason}` : ""}`)
      : ["- 정확 매칭 법령 없음"]),
    ...(data.matched_articles?.length
      ? data.matched_articles.map(
          (item) =>
            `- ${(item.law_name ?? item.law ?? "").trim()} ${(item.article_label ?? item.article ?? "").trim()}${item.summary ?? item.article_text ? `: ${item.summary ?? item.article_text}` : ""}`
        )
      : ["- 정확 매칭 조문 없음"]),
    "",
    "[판례 검토 검색어]",
    ...(
      data.precedent_search_suggestions?.map((item) => item.query) ??
      data.recommended_search_queries.filter((item) => item.kind === "precedent").map((item) => item.query)
    ).map((item) => `- ${item}`),
  ]
    .filter(Boolean)
    .join("\n");

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
          {data.practical_use_status ? (
            <Badge className={practicalStatusTone.badgeClass}>{practicalStatusTone.label}</Badge>
          ) : null}
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
              <p className="ui-kicker">실무 우선 요약</p>
              <p className="mt-3 text-lg font-semibold text-text">{safetySummary.headline}</p>
              <p className="mt-2 text-sm text-text-muted">{safetySummary.description}</p>
            </div>
            <Badge className={practicalStatusTone.badgeClass}>{practicalStatusTone.label}</Badge>
          </div>
          <div className="mt-4 grid gap-3 xl:grid-cols-3">
            {safetySummary.priorityAction ? (
              <MiniSummaryCard label="우선 확인" value={safetySummary.priorityAction} />
            ) : null}
            {safetySummary.missingFact ? (
              <MiniSummaryCard label="빠진 핵심 사실" value={safetySummary.missingFact} />
            ) : null}
            {safetySummary.documentNeed ? (
              <MiniSummaryCard label="먼저 받을 자료" value={safetySummary.documentNeed} />
            ) : null}
          </div>
        </Card>
      ) : null}

      {(data.confidence_score !== undefined || data.match_reason || data.sync_ready !== undefined) ? (
        <div className="mt-5 grid gap-4 xl:grid-cols-3">
          {data.confidence_score !== undefined ? (
            <Card muted className="p-5">
              <p className="ui-kicker">분석 신뢰도</p>
              <p className="mt-3 text-2xl font-semibold text-text">
                {Math.round(data.confidence_score)}점
                {data.confidence_label ? (
                  <span className="ml-2 text-sm font-medium text-text-muted">{data.confidence_label}</span>
                ) : null}
              </p>
            </Card>
          ) : null}
          {data.sync_ready !== undefined ? (
            <Card muted className="p-5">
              <p className="ui-kicker">시스템 동기화 준비</p>
              <p className="mt-3 text-lg font-semibold text-text">
                {data.sync_ready ? "저장 가능한 구조" : "보조 검토 후 저장 권장"}
              </p>
            </Card>
          ) : null}
          {data.match_reason ? (
            <Card muted className="p-5 xl:col-span-1">
              <p className="ui-kicker">매칭 근거</p>
              <p className="mt-3 text-sm text-text">{data.match_reason}</p>
            </Card>
          ) : null}
        </div>
      ) : null}

      {(data.practical_use_status || data.review_required_reasons?.length || data.critical_missing_facts?.length) ? (
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

      {(data.question_intents?.length || data.intent_notes?.length) ? (
        <div className="mt-5 grid gap-4 xl:grid-cols-2">
          <SimpleListCard title="질문 의도 해석" items={(data.question_intents ?? []).map(formatQuestionIntent)} />
          <SimpleListCard title="질문 의도 메모" items={data.intent_notes ?? []} />
        </div>
      ) : null}

      {(data.domain_overview_notes?.length || data.research_goal || data.research_tracks?.length || data.authority_path?.length || data.initial_checkpoints?.length) ? (
        <div className="mt-5 grid gap-4 xl:grid-cols-2">
          <SimpleListCard title="분야 개요" items={data.domain_overview_notes ?? []} />
          <Card muted className="p-5">
            <p className="ui-kicker">조사 목표</p>
            <p className="mt-3 text-sm text-text">{data.research_goal ?? "표시할 항목이 없습니다."}</p>
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

      {(data.domain_routes?.length || data.research_subtypes?.length || data.subtype_notes?.length) ? (
        <div className="mt-5 grid gap-4 xl:grid-cols-2">
          <SimpleListCard title="분야 라우팅" items={(data.domain_routes ?? []).map(formatDomainRoute)} />
          <SimpleListCard
            title="세부 유형 라우팅"
            items={[
              ...(data.research_subtypes ?? []).map(formatResearchSubtype),
              ...(data.subtype_notes ?? [])
            ]}
          />
        </div>
      ) : null}

      {(data.pros?.length || data.cons?.length) ? (
        <div className="mt-5 grid gap-4 xl:grid-cols-2">
          <SimpleListCard title="유리 포인트" items={data.pros ?? []} />
          <SimpleListCard title="불리 포인트" items={data.cons ?? []} />
        </div>
      ) : null}

      {(data.priority_actions?.length || data.risk_flags?.length) ? (
        <div className="mt-5 grid gap-4 xl:grid-cols-2">
          <SimpleListCard title="우선 액션" items={data.priority_actions ?? []} />
          <SimpleListCard title="리스크 플래그" items={data.risk_flags ?? []} />
        </div>
      ) : null}

      {(data.practitioner_brief?.length || data.training_notes?.length) ? (
        <div className="mt-5 grid gap-4 xl:grid-cols-2">
          <SimpleListCard title="실무자용 메모" items={data.practitioner_brief ?? []} />
          <SimpleListCard title="교육용 설명" items={data.training_notes ?? []} />
        </div>
      ) : null}

      {(data.practical_checklist?.length || data.document_checklist?.length) ? (
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

      {(data.client_ready_summary?.length || data.practice_playbook?.length) ? (
        <div className="mt-5 grid gap-4 xl:grid-cols-2">
          <SimpleListCard title="고객 설명 초안" items={data.client_ready_summary ?? []} />
          <SimpleListCard title="사건 유형별 플레이북" items={data.practice_playbook ?? []} />
        </div>
      ) : null}

      {(data.playbook_legal_bases?.length || data.common_failure_points?.length) ? (
        <div className="mt-5 grid gap-4 xl:grid-cols-2">
          <SimpleListCard title="플레이북 근거 법령" items={data.playbook_legal_bases ?? []} />
          <SimpleListCard title="자주 놓치는 실패 포인트" items={data.common_failure_points ?? []} />
        </div>
      ) : null}

      {(data.visa_specific_guidance?.length || data.visa_scenario_guidance?.length) ? (
        <div className="mt-5 grid gap-4 xl:grid-cols-2">
          <SimpleListCard title="비자 유형별 준비 포인트" items={data.visa_specific_guidance ?? []} />
          <SimpleListCard title="비자 세부 대응 포인트" items={data.visa_scenario_guidance ?? []} />
        </div>
      ) : null}

      {(data.admin_appeal_deep_guidance?.length || data.admin_appeal_timeline_guidance?.length) ? (
        <div className="mt-5 grid gap-4 xl:grid-cols-2">
          <SimpleListCard title="행정심판 심화 포인트" items={data.admin_appeal_deep_guidance ?? []} />
          <SimpleListCard title="행정심판 기간·집행정지 포인트" items={data.admin_appeal_timeline_guidance ?? []} />
        </div>
      ) : null}

      {(data.licensing_industry_guidance?.length || data.licensing_sector_deep_guidance?.length) ? (
        <div className="mt-5 grid gap-4 xl:grid-cols-2">
          <SimpleListCard title="업종별 인허가 포인트" items={data.licensing_industry_guidance ?? []} />
          <SimpleListCard title="업종별 인허가 심화 체크" items={data.licensing_sector_deep_guidance ?? []} />
        </div>
      ) : null}

      {(data.supplemental_source_highlights?.length || data.source_connection_notes?.length || data.followup_narrow_questions?.length) ? (
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

      {(data.matched_laws?.length || data.matched_articles?.length) ? (
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

function MatchedLawCard({
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
            <div key={`${item.law}-${item.match_type ?? "unknown"}`} className="rounded-2xl border border-border/60 bg-white/70 p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-sm font-semibold text-text">{item.law}</p>
                  <p className="mt-1 text-xs text-text-muted">
                    {[
                      item.exact_name && item.exact_name !== item.law ? `정확명 ${item.exact_name}` : null,
                      item.kind,
                      item.match_type,
                      item.score !== undefined ? `${Math.round(item.score)}점` : null,
                      item.confidence !== undefined ? `${Math.round(item.confidence)}점` : null
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                  {(item.ministry || item.effective_date || item.promulgation_date) ? (
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

function MatchedArticleCard({
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
              className="rounded-2xl border border-border/60 bg-white/70 p-4"
            >
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-sm font-semibold text-text">
                    {item.law_name ?? item.law} {item.article_label ?? item.article}
                  </p>
                  <p className="mt-1 text-xs text-text-muted">
                    {[item.article_key, item.jo, item.confidence !== undefined ? `${Math.round(item.confidence)}점` : null]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                  {item.summary ?? item.article_text ? (
                    <p className="mt-2 text-sm text-text-muted">{item.summary ?? item.article_text}</p>
                  ) : null}
                  {item.full_text ? <p className="mt-2 text-sm leading-6 text-text">{item.full_text}</p> : null}
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

function RefreshButton({
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
  const idleLabel = connectionReady
    ? hasStoredSnapshot
      ? "재분석"
      : "초기 분석 실행"
    : hasStoredSnapshot
      ? "연결 후 재분석"
      : "연결 준비 확인";

  return (
    <button
      type="button"
      onClick={onRefresh}
      disabled={isRefreshing}
      className="inline-flex items-center rounded-full border border-border/70 px-4 py-2 text-xs font-medium text-text transition hover:bg-surface disabled:cursor-not-allowed disabled:opacity-60"
    >
      {isRefreshing ? "다시 분석 중..." : idleLabel}
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

function MiniSummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-white/70 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">{label}</p>
      <p className="mt-2 text-sm font-medium text-text">{value}</p>
    </div>
  );
}

function LawbotConnectionReadinessCard({
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
          <p className="ui-kicker">고객 사건 기준 Lawbot 연결 준비</p>
          <p className="mt-3 text-sm text-text">
            고객 사건 상세에 저장된 정보로 바로 Lawbot 분석을 보낼 수 있도록, 현재 사건 데이터와 환경설정 준비 상태를 함께 표시합니다.
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
          label="사건 입력 컨텍스트"
          value={snapshot.availableContextLabels.length > 0 ? `${snapshot.availableContextLabels.length}개 확보` : "기본 정보만 있음"}
        />
      </div>

      {storedSnapshot ? (
        <div className="mt-4 grid gap-4 xl:grid-cols-3">
          <MiniSummaryCard
            label="마지막 저장 시각"
            value={storedSnapshot.analyzedAt ? new Date(storedSnapshot.analyzedAt).toLocaleString("ko-KR") : "기록 없음"}
          />
          <MiniSummaryCard label="저장된 상태" value={storedSnapshot.status ?? "기록 없음"} />
          <MiniSummaryCard label="스냅샷 버전" value={`v${storedSnapshot.version}`} />
        </div>
      ) : null}

      {storedSnapshot?.summary ? (
        <div className="mt-4 rounded-2xl border border-border/60 bg-white/70 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">마지막 저장 요약</p>
          <p className="mt-2 text-sm text-text">{storedSnapshot.summary}</p>
          {storedSnapshot.payload?.practical_use_status ? (
            <p className="mt-2 text-xs text-text-muted">실전 사용 상태: {storedSnapshot.payload.practical_use_status}</p>
          ) : null}
        </div>
      ) : null}

      {snapshot.recommendedMissingFields.length > 0 ? (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">연결 전 보강 추천</p>
          <ul className="mt-2 list-disc space-y-2 pl-5 text-sm text-text">
            {snapshot.recommendedMissingFields.map((item) => (
              <li key={`lawbot-missing-${item}`}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-4 rounded-2xl border border-border/60 bg-white/70 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">Lawbot 전송 미리보기</p>
        <pre className="mt-3 whitespace-pre-wrap text-xs leading-6 text-text">{snapshot.factInputPreview}</pre>
      </div>
    </Card>
  );
}

function LawbotExecutionFlowCard({
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
      <p className="ui-kicker">고객 사건 기준 실행 흐름</p>
      <p className="mt-3 text-sm font-medium text-text">{executionFlow.headline}</p>
      <p className="mt-2 text-sm text-text-muted">{executionFlow.description}</p>
      <div className="mt-4 grid gap-3 xl:grid-cols-3">
        {executionFlow.steps.map((step, index) => (
          <MiniSummaryCard key={`lawbot-step-${index}`} label={`Step ${index + 1}`} value={step} />
        ))}
      </div>
      <div className="mt-4 rounded-2xl border border-border/60 bg-white/70 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">Fallback 기준</p>
        <p className="mt-2 text-sm text-text">{executionFlow.fallbackNote}</p>
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
  return [
    item.label,
    item.domain_key,
    item.score !== undefined ? `${Math.round(item.score)}점` : null,
    item.note
  ]
    .filter(Boolean)
    .join(" - ");
}

function getPracticalStatusTone(status?: string | null) {
  const normalized = status?.trim() ?? "";

  if (!normalized) {
    return {
      label: "실무 상태 미표기",
      badgeClass: "border-line-strong bg-surface text-text-strong",
      cardClass: "border-border/60 bg-surface/60"
    };
  }

  if (/(불가|위험|보류|추가 검토|주의|확인 필요)/.test(normalized)) {
    return {
      label: "주의 필요",
      badgeClass: "border-rose-200 bg-rose-50 text-rose-700",
      cardClass: "border-rose-200 bg-rose-50/80"
    };
  }

  if (/(가능|활용|진행|사용 가능|바로)/.test(normalized)) {
    return {
      label: "즉시 활용 가능",
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
    headline: data.practical_use_status ?? "실무 사용 상태를 먼저 확인해 주세요.",
    description:
      missingFact
        ? "핵심 사실 보완 여부를 먼저 확인한 뒤 체크리스트와 세부 대응 포인트를 검토하는 흐름을 권장합니다."
        : "상단 요약을 기준으로 바로 필요한 확인 사항과 준비 자료를 먼저 정리할 수 있습니다.",
    priorityAction,
    missingFact,
    documentNeed
  };
}

function buildExecutionFlow(
  snapshot: LawbotConnectionSnapshot,
  storedSnapshot: StoredLawbotSnapshot | null
) {
  if (!snapshot.connectionReady) {
    return {
      headline: "연결 준비를 먼저 확인한 뒤 고객 사건에서 바로 실행할 수 있습니다.",
      description:
        snapshot.recommendedMissingFields.length > 0
          ? "환경설정과 사건 입력 보강이 끝나면 별도 화면 이동 없이 이 패널에서 바로 초기 분석을 실행하는 흐름을 기준으로 설계되어 있습니다."
          : "환경설정만 완료되면 고객 사건 상세에서 바로 초기 분석을 실행할 수 있습니다.",
      steps: [
        "고객 사건의 입력 보강 추천 항목을 먼저 확인합니다.",
        "환경설정이 완료되면 이 패널에서 초기 분석을 실행합니다.",
        "실행 결과는 사건 스냅샷으로 저장되어 이후 fallback 기준이 됩니다."
      ],
      fallbackNote: storedSnapshot
        ? "현재는 실시간 연결이 없어도 마지막 저장 스냅샷을 기준으로 사건 판단을 이어갈 수 있습니다."
        : "저장된 스냅샷이 아직 없으므로, 첫 연결 후 초기 분석 결과가 고객 사건의 기준 스냅샷이 됩니다."
    };
  }

  return {
    headline: storedSnapshot
      ? "고객 사건에서 바로 재분석하고, 실패 시 마지막 저장 스냅샷으로 이어집니다."
      : "고객 사건에서 바로 초기 분석을 실행해 첫 기준 스냅샷을 남길 수 있습니다.",
    description:
      "운영자는 사건 상세에서 분석 실행과 재분석을 처리하고, 저장된 스냅샷을 기준으로 견적·메모·후속 검토 흐름을 이어가게 됩니다.",
    steps: storedSnapshot
      ? [
          "현재 사건 입력을 기준으로 재분석을 실행합니다.",
          "성공 시 최신 결과가 사건 스냅샷으로 저장됩니다.",
          "실패하거나 연결이 불안정하면 마지막 저장 스냅샷을 기준으로 이어서 검토합니다."
        ]
      : [
          "현재 사건 입력으로 초기 분석을 실행합니다.",
          "첫 결과를 사건 스냅샷으로 저장합니다.",
          "이후 재분석부터는 이전 스냅샷과 함께 비교·활용할 수 있습니다."
        ],
    fallbackNote: storedSnapshot
      ? "실시간 응답에 문제가 생겨도 고객 사건에는 마지막 저장 결과가 남아 있어 운영 흐름이 끊기지 않습니다."
      : "첫 분석 전에는 fallback 스냅샷이 없으므로, 현재 사건 입력 품질을 먼저 확인하는 것이 가장 중요합니다."
  };
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

function SupplementalSourcesCard({
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
      <p className="ui-kicker">보조 참고 자료</p>
      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        {entries.map(([category, items]) => (
          <div key={category} className="rounded-2xl border border-border/60 bg-white/70 p-4">
            <p className="text-sm font-semibold text-text">{labelSupplementalCategory(category)}</p>
            <div className="mt-3 space-y-3">
              {items.map((item, index) => (
                <div key={`${category}-${index}`} className="rounded-2xl border border-border/50 bg-surface/80 p-3">
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
  if (category === "admin_rules") return "행정규칙·고시";
  if (category === "ordinances") return "자치법규";
  if (category === "admin_appeals") return "행정심판·재결례";
  return category;
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
