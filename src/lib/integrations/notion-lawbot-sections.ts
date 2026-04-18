import type { LawbotCaseAnalysisResult } from "@/lib/services/lawbot-case-analysis-service";

type AvailableLawbotData = Extract<LawbotCaseAnalysisResult, { status: "available" }>["data"];

function bulletList(items?: string[] | null) {
  return items?.length ? items.map((item) => `- ${item}`).join("\n") : "원문 명시 없음";
}

function formatDomainRoutes(
  items?: Array<{ label: string; score?: number; why?: string; priority_sources?: string[] }> | null
) {
  return bulletList(
    items?.map((item) =>
      [
        item.label,
        item.score !== undefined ? `${Math.round(item.score)}점` : null,
        item.why,
        item.priority_sources?.length ? `우선 자료: ${item.priority_sources.join(", ")}` : null
      ]
        .filter(Boolean)
        .join(" / ")
    )
  );
}

function formatResearchSubtypes(
  items?: Array<{ label: string; domain_key: string; score?: number; note?: string }> | null
) {
  return bulletList(
    items?.map((item) =>
      [item.label, item.domain_key, item.score !== undefined ? `${Math.round(item.score)}점` : null, item.note]
        .filter(Boolean)
        .join(" / ")
    )
  );
}

export function buildLawbotCaseSectionTuples(data: AvailableLawbotData): Array<[string, string]> {
  return [
    ["Lawbot 입력 요약", data.input_summary],
    [
      "Lawbot 신뢰도",
      data.confidence_score !== undefined
        ? `${Math.round(data.confidence_score)}점${data.confidence_label ? ` (${data.confidence_label})` : ""}`
        : "원문 명시 없음"
    ],
    ["Lawbot 매칭 근거", data.match_reason || "원문 명시 없음"],
    ["Lawbot 실전 사용 상태", data.practical_use_status || "원문 명시 없음"],
    ["Lawbot 추가 검토 필요 사유", bulletList(data.review_required_reasons)],
    ["Lawbot 빠진 핵심 사실", bulletList(data.critical_missing_facts)],
    ["Lawbot 조사 목표", data.research_goal || "원문 명시 없음"],
    ["Lawbot 분야 라우팅", formatDomainRoutes(data.domain_routes)],
    ["Lawbot 세부 유형 라우팅", formatResearchSubtypes(data.research_subtypes)],
    ["Lawbot 실무 체크리스트", bulletList(data.practical_checklist)],
    ["Lawbot 준비 자료 체크리스트", bulletList(data.document_checklist)],
    ["Lawbot 비자 세부 대응 포인트", bulletList(data.visa_scenario_guidance)],
    ["Lawbot 행정심판 기간·집행정지 포인트", bulletList(data.admin_appeal_timeline_guidance)],
    ["Lawbot 업종별 인허가 심화 체크", bulletList(data.licensing_sector_deep_guidance)],
    [
      "Lawbot 정확 매칭 법령",
      data.matched_laws
        ?.map((item) =>
          `- ${item.law}${item.match_type ? ` / ${item.match_type}` : ""}${item.score !== undefined ? ` / ${Math.round(item.score)}점` : ""}${item.reason ? ` / ${item.reason}` : ""}`
        )
        .join("\n") || "원문 명시 없음"
    ],
    [
      "Lawbot 정확 매칭 조문",
      data.matched_articles
        ?.map(
          (item) =>
            `- ${(item.law_name ?? item.law ?? "").trim()} ${(item.article_label ?? item.article ?? "").trim()}${item.summary ?? item.article_text ? ` / ${item.summary ?? item.article_text}` : ""}${item.full_text ? `\n  ${item.full_text}` : ""}${item.match_reason ? `\n  근거: ${item.match_reason}` : ""}`
        )
        .join("\n") || "원문 명시 없음"
    ],
    [
      "Lawbot 우선 액션",
      data.priority_actions?.map((item) => `- ${item}`).join("\n") || "원문 명시 없음"
    ],
    [
      "Lawbot 리스크 플래그",
      data.risk_flags?.map((item) => `- ${item}`).join("\n") || "원문 명시 없음"
    ],
    [
      "Lawbot 실무자용 메모",
      data.practitioner_brief?.map((item) => `- ${item}`).join("\n") || "원문 명시 없음"
    ],
    [
      "Lawbot 교육용 설명",
      data.training_notes?.map((item) => `- ${item}`).join("\n") || "원문 명시 없음"
    ],
    [
      "Lawbot 고객 설명 초안",
      data.client_ready_summary?.map((item) => `- ${item}`).join("\n") || "원문 명시 없음"
    ],
    [
      "Lawbot 사건 유형별 플레이북",
      data.practice_playbook?.map((item) => `- ${item}`).join("\n") || "원문 명시 없음"
    ],
    ["Lawbot 핵심 쟁점", data.key_issues.map((item) => `- ${item}`).join("\n") || "원문 명시 없음"],
    ["Lawbot 추가 확인 사실", data.followup_facts.map((item) => `- ${item}`).join("\n") || "원문 명시 없음"],
    [
      "Lawbot 참고 법령",
      data.applicable_laws.map((item) => `- ${item.law}: ${item.summary}`).join("\n") || "원문 명시 없음"
    ],
    [
      "Lawbot 참고 판례",
      data.related_precedents
        ?.map(
          (item) =>
            `- ${item.case_name} / ${item.case_number}${item.court_name ? ` / ${item.court_name}` : ""}${item.decision_date ? ` / ${item.decision_date}` : ""}\n  ${item.reason}`
        )
        .join("\n") || "원문 명시 없음"
    ],
    [
      "Lawbot 참고 해석례",
      data.related_interpretations
        ?.map(
          (item) =>
            `- ${item.title}${item.number ? ` / ${item.number}` : ""}${item.agency ? ` / ${item.agency}` : ""}${item.decision_date ? ` / ${item.decision_date}` : ""}\n  ${item.reason}`
        )
        .join("\n") || "원문 명시 없음"
    ],
    [
      "Lawbot 보조 참고 자료",
      data.supplemental_sources
        ? Object.entries(data.supplemental_sources)
            .flatMap(([category, items]) =>
              items.map(
                (item) =>
                  `- ${category}: ${String(item.title ?? item.query ?? "참고 자료")}${item.snippet ? ` / ${String(item.snippet)}` : ""}`
              )
            )
            .join("\n") || "원문 명시 없음"
        : "원문 명시 없음"
    ],
    ["Lawbot 보조 자료 하이라이트", bulletList(data.supplemental_source_highlights)],
    [
      "Lawbot 동기화 요약",
      data.sync_payload
        ? [
            data.sync_payload.confidence_score !== undefined
              ? `- 신뢰도: ${Math.round(data.sync_payload.confidence_score)}점${data.sync_payload.confidence_label ? ` (${data.sync_payload.confidence_label})` : ""}`
              : null,
            data.sync_payload.match_reason ? `- 근거: ${data.sync_payload.match_reason}` : null,
            ...(data.sync_payload.priority_actions?.map((item) => `- 우선 액션: ${item}`) ?? []),
            ...(data.sync_payload.risk_flags?.map((item) => `- 리스크: ${item}`) ?? []),
            ...(data.sync_payload.primary_law ? [`- 대표 법령: ${data.sync_payload.primary_law}`] : []),
            ...(data.sync_payload.primary_article ? [`- 대표 조문: ${data.sync_payload.primary_article}`] : []),
            ...(data.sync_payload.primary_precedent ? [`- 대표 판례: ${data.sync_payload.primary_precedent}`] : []),
            ...(data.sync_payload.matched_laws?.map((item) => `- 법령: ${item.law}`) ?? []),
            ...(data.sync_payload.matched_articles?.map((item) => `- 조문: ${(item.law_name ?? item.law ?? "").trim()} ${(item.article_label ?? item.article ?? "").trim()}`) ?? []),
            ...(data.sync_payload.matched_precedents?.map((item) => `- 판례: ${item.case_name}`) ?? []),
            ...(data.sync_payload.matched_interpretations?.map((item) => `- 해석례: ${item.title}`) ?? []),
            ...(data.sync_payload.supplemental_sources?.map((item) => `- 보조 자료: ${item}`) ?? [])
          ]
            .filter(Boolean)
            .join("\n")
        : "원문 명시 없음"
    ]
  ];
}
