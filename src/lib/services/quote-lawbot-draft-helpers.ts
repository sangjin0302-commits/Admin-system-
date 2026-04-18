import { getLawbotCaseAnalysis } from "@/lib/services/lawbot-case-analysis-service";

function buildLawbotSection(title: string, items?: string[] | null) {
  return [
    "",
    title,
    ...(items && items.length > 0 ? items.map((item) => `- ${item}`) : ["- 원문 명시 없음"])
  ];
}

function formatLawbotDomainRoute(item: {
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
    .join(" / ");
}

function formatLawbotResearchSubtype(item: {
  label: string;
  domain_key: string;
  score?: number;
  note?: string;
}) {
  return [item.label, item.domain_key, item.score !== undefined ? `${Math.round(item.score)}점` : null, item.note]
    .filter(Boolean)
    .join(" / ");
}

export function buildLawbotAnalysisDraft(result: Awaited<ReturnType<typeof getLawbotCaseAnalysis>>) {
  if (result.status !== "available") {
    return null;
  }

  const data = result.data;
  return [
    "[Lawbot 참고 분석]",
    `- 입력 요약: ${data.input_summary}`,
    data.confidence_score !== undefined
      ? `- 분석 신뢰도: ${Math.round(data.confidence_score)}점${data.confidence_label ? ` (${data.confidence_label})` : ""}`
      : null,
    data.match_reason ? `- 매칭 근거: ${data.match_reason}` : null,
    data.sync_ready !== undefined ? `- 동기화 준비 여부: ${data.sync_ready ? "저장 가능" : "보조 검토 필요"}` : null,
    data.practical_use_status ? `- 실전 사용 상태: ${data.practical_use_status}` : null,
    "",
    "[Lawbot 핵심 쟁점]",
    ...(data.key_issues.length > 0 ? data.key_issues.map((item) => `- ${item}`) : ["- 원문 명시 없음"]),
    "",
    "[Lawbot 추가 확인 사실]",
    ...(data.followup_facts.length > 0 ? data.followup_facts.map((item) => `- ${item}`) : ["- 원문 명시 없음"]),
    ...buildLawbotSection("[Lawbot 추가 검토 필요 사유]", data.review_required_reasons),
    ...buildLawbotSection("[Lawbot 빠진 핵심 사실]", data.critical_missing_facts),
    data.research_goal ? "" : null,
    data.research_goal ? "[Lawbot 조사 목표]" : null,
    data.research_goal ? `- ${data.research_goal}` : null,
    ...buildLawbotSection("[Lawbot 분야 라우팅]", data.domain_routes?.map(formatLawbotDomainRoute)),
    ...buildLawbotSection("[Lawbot 세부 유형 라우팅]", data.research_subtypes?.map(formatLawbotResearchSubtype)),
    ...buildLawbotSection("[Lawbot 실무 체크리스트]", data.practical_checklist),
    ...buildLawbotSection("[Lawbot 준비 자료 체크리스트]", data.document_checklist),
    ...buildLawbotSection("[Lawbot 공부 가이드]", data.study_guide),
    "",
    "[Lawbot 정확 매칭 법령]",
    ...(data.matched_laws?.length
      ? data.matched_laws.map(
          (item) =>
            `- ${item.law}${item.match_type ? ` / ${item.match_type}` : ""}${item.score !== undefined ? ` / ${Math.round(item.score)}점` : ""}${item.reason ? ` / ${item.reason}` : ""}`
        )
      : ["- 원문 명시 없음"]),
    "",
    "[Lawbot 정확 매칭 조문]",
    ...(data.matched_articles?.length
      ? data.matched_articles.map(
          (item) =>
            `- ${(item.law_name ?? item.law ?? "").trim()} ${(item.article_label ?? item.article ?? "").trim()}${item.summary ?? item.article_text ? ` / ${item.summary ?? item.article_text}` : ""}${item.match_reason ? ` / ${item.match_reason}` : ""}`
        )
      : ["- 원문 명시 없음"]),
    "",
    "[Lawbot 우선 액션]",
    ...(data.priority_actions?.length ? data.priority_actions.map((item) => `- ${item}`) : ["- 원문 명시 없음"]),
    "",
    "[Lawbot 리스크 플래그]",
    ...(data.risk_flags?.length ? data.risk_flags.map((item) => `- ${item}`) : ["- 원문 명시 없음"]),
    ...buildLawbotSection("[Lawbot 비자 유형별 준비 포인트]", data.visa_specific_guidance),
    ...buildLawbotSection("[Lawbot 비자 세부 대응 포인트]", data.visa_scenario_guidance),
    ...buildLawbotSection("[Lawbot 행정심판 심화 포인트]", data.admin_appeal_deep_guidance),
    ...buildLawbotSection("[Lawbot 행정심판 기간·집행정지 포인트]", data.admin_appeal_timeline_guidance),
    ...buildLawbotSection("[Lawbot 업종별 인허가 포인트]", data.licensing_industry_guidance),
    ...buildLawbotSection("[Lawbot 업종별 인허가 심화 체크]", data.licensing_sector_deep_guidance),
    "",
    "[Lawbot 실무자용 메모]",
    ...(data.practitioner_brief?.length ? data.practitioner_brief.map((item) => `- ${item}`) : ["- 원문 명시 없음"]),
    "",
    "[Lawbot 교육용 설명]",
    ...(data.training_notes?.length ? data.training_notes.map((item) => `- ${item}`) : ["- 원문 명시 없음"]),
    "",
    "[Lawbot 고객 설명 초안]",
    ...(data.client_ready_summary?.length ? data.client_ready_summary.map((item) => `- ${item}`) : ["- 원문 명시 없음"]),
    "",
    "[Lawbot 사건 유형별 플레이북]",
    ...(data.practice_playbook?.length ? data.practice_playbook.map((item) => `- ${item}`) : ["- 원문 명시 없음"]),
    ...buildLawbotSection("[Lawbot 플레이북 근거 법령]", data.playbook_legal_bases),
    "",
    "[Lawbot 참고 법령]",
    ...(data.applicable_laws.length > 0 ? data.applicable_laws.map((item) => `- ${item.law}: ${item.summary}`) : ["- 원문 명시 없음"]),
    "",
    "[Lawbot 참고 판례]",
    ...(data.related_precedents?.length
      ? data.related_precedents.map((item) =>
          `- ${item.case_name} / ${item.case_number}${item.court_name ? ` / ${item.court_name}` : ""}${item.decision_date ? ` / ${item.decision_date}` : ""}`
        )
      : ["- 원문 명시 없음"]),
    "",
    "[Lawbot 참고 해석례]",
    ...(data.related_interpretations?.length
      ? data.related_interpretations.map((item) =>
          `- ${item.title}${item.number ? ` / ${item.number}` : ""}${item.agency ? ` / ${item.agency}` : ""}${item.decision_date ? ` / ${item.decision_date}` : ""}`
        )
      : ["- 원문 명시 없음"]),
    "",
    "[Lawbot 보조 참고 자료]",
    ...(data.supplemental_sources
      ? Object.entries(data.supplemental_sources)
          .flatMap(([category, items]) =>
            items.map(
              (item) =>
                `- ${category}: ${String(item.title ?? item.query ?? "참고 자료")}${item.snippet ? ` / ${String(item.snippet)}` : ""}`
            )
          )
      : ["- 원문 명시 없음"]),
    ...buildLawbotSection("[Lawbot 보조 자료 하이라이트]", data.supplemental_source_highlights),
    ...buildLawbotSection("[Lawbot 후속 좁은 질문 추천]", data.followup_narrow_questions),
    data.sync_payload
      ? [
          "",
          "[Lawbot 동기화 요약]",
          ...(data.sync_payload.practical_use_status ? [`- 실전 사용 상태: ${data.sync_payload.practical_use_status}`] : []),
          ...(data.sync_payload.review_required_reasons?.map((item) => `- 추가 검토: ${item}`) ?? []),
          ...(data.sync_payload.critical_missing_facts?.map((item) => `- 부족 사실: ${item}`) ?? []),
          ...(data.sync_payload.primary_law ? [`- 대표 법령: ${data.sync_payload.primary_law}`] : []),
          ...(data.sync_payload.primary_article ? [`- 대표 조문: ${data.sync_payload.primary_article}`] : []),
          ...(data.sync_payload.primary_precedent ? [`- 대표 판례: ${data.sync_payload.primary_precedent}`] : []),
          ...(data.sync_payload.priority_actions?.map((item) => `- 우선 액션: ${item}`) ?? []),
          ...(data.sync_payload.risk_flags?.map((item) => `- 리스크: ${item}`) ?? []),
          ...(data.sync_payload.domain_routes?.map((item) => `- 분야 라우팅: ${formatLawbotDomainRoute(item)}`) ?? []),
          ...(data.sync_payload.research_subtypes?.map((item) => `- 세부 유형: ${formatLawbotResearchSubtype(item)}`) ?? []),
          ...(data.sync_payload.research_goal ? [`- 조사 목표: ${data.sync_payload.research_goal}`] : []),
          ...(data.sync_payload.practical_checklist?.map((item) => `- 실무 체크: ${item}`) ?? []),
          ...(data.sync_payload.document_checklist?.map((item) => `- 준비 자료: ${item}`) ?? []),
          ...(data.sync_payload.study_guide?.map((item) => `- 공부 가이드: ${item}`) ?? []),
          ...(data.sync_payload.visa_specific_guidance?.map((item) => `- 비자 준비: ${item}`) ?? []),
          ...(data.sync_payload.visa_scenario_guidance?.map((item) => `- 비자 대응: ${item}`) ?? []),
          ...(data.sync_payload.admin_appeal_deep_guidance?.map((item) => `- 행정심판 심화: ${item}`) ?? []),
          ...(data.sync_payload.admin_appeal_timeline_guidance?.map((item) => `- 행정심판 기간: ${item}`) ?? []),
          ...(data.sync_payload.licensing_industry_guidance?.map((item) => `- 인허가 업종: ${item}`) ?? []),
          ...(data.sync_payload.licensing_sector_deep_guidance?.map((item) => `- 인허가 심화: ${item}`) ?? []),
          ...(data.sync_payload.matched_laws?.length
            ? data.sync_payload.matched_laws.map((item) => `- 법령: ${item.law}`)
            : []),
          ...(data.sync_payload.matched_articles?.length
            ? data.sync_payload.matched_articles.map(
                (item) => `- 조문: ${(item.law_name ?? item.law ?? "").trim()} ${(item.article_label ?? item.article ?? "").trim()}`
              )
            : []),
          ...(data.sync_payload.supplemental_sources?.map((item) => `- 보조 자료: ${item}`) ?? [])
        ].join("\n")
      : null
  ]
    .filter(Boolean)
    .join("\n");
}

export function mergeEditableSpecialTerms(
  manualTerms: string | null | undefined,
  analysisTerms: string
) {
  const cleanedManualTerms = manualTerms
    ?.split("\n\n[자동 분석 참고]\n\n")[0]
    ?.trim();
  const cleanedAnalysisTerms = analysisTerms.trim();

  if (cleanedManualTerms && cleanedAnalysisTerms) {
    return [cleanedManualTerms, "[자동 분석 참고]", cleanedAnalysisTerms].join("\n\n");
  }

  return cleanedManualTerms || cleanedAnalysisTerms || null;
}
