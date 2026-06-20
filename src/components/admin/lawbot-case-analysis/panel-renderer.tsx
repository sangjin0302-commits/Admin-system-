"use client";

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
import type {
  LawbotCaseAnalysisResult,
  LawbotConnectionSnapshot,
  StoredLawbotSnapshot
} from "@/lib/services/lawbot-case-analysis-service";

import {
  buildAnalysisNote,
  buildExecutionFlow,
  buildSafetySummary,
  buildSearchChecklist,
  formatDomainRoute,
  formatQuestionIntent,
  formatResearchSubtype,
  getPracticalStatusTone
} from "./formatters";

export function renderPanel(
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
