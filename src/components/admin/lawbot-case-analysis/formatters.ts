import type { LawbotConnectionSnapshot, StoredLawbotSnapshot } from "@/lib/services/lawbot-case-analysis-service";

import type { AvailableLawbotData } from "./types";

export function formatQuestionIntent(item: {
  label: string;
  reason?: string;
  note?: string;
}) {
  return [item.label, item.reason, item.note].filter(Boolean).join(" - ");
}

export function formatDomainRoute(item: {
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

export function formatResearchSubtype(item: {
  label: string;
  domain_key: string;
  score?: number;
  note?: string;
}) {
  return [item.label, item.domain_key, item.score !== undefined ? `${Math.round(item.score)}점` : null, item.note]
    .filter(Boolean)
    .join(" - ");
}

export function getPracticalStatusTone(status?: string | null) {
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

export function buildSafetySummary(data: {
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

export function buildExecutionFlow(snapshot: LawbotConnectionSnapshot, storedSnapshot: StoredLawbotSnapshot | null) {
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

export function buildAnalysisNote(data: AvailableLawbotData) {
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

export function buildSearchChecklist(data: AvailableLawbotData) {
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
