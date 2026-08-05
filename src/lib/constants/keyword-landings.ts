/**
 * 키워드 랜딩 기본 7종 — 단일 진실 소스(single source of truth).
 *
 * 이전엔 keyword/[term]·keyword/index·landing-gaps·sitemap 4곳에 각자 하드코딩돼
 * 동기화가 어긋날 위험이 있었다. 이제 모두 이 모듈을 참조한다.
 * DB 확장 랜딩(keyword-landing-service)은 런타임에 이 목록과 병합.
 */

export type BaseKeywordLanding = {
  term: string; // URL 슬러그
  label: string; // 표시 제목
  group: string; // index 묶음(비자/심판/법인)
  query: string[]; // 관련 블로그 매칭어(/keyword/[term])
  tokens: string[]; // GSC 갭 매칭 토큰(landing-gaps)
  description: string; // 히어로/메타 설명
  deadlineNote?: string; // 기한 긴급 마이크로카피
  priority: number; // sitemap 우선순위
};

export const BASE_KEYWORD_LANDINGS: BaseKeywordLanding[] = [
  {
    term: "d-8-비자",
    label: "D-8 비자 (기업투자)",
    group: "비자",
    query: ["D-8", "D8", "기업투자", "투자비자"],
    tokens: ["d-8", "d8", "기업투자"],
    description:
      "외국인 창업가 D-8 비자 신청, 요건, 사업계획서, 자본금 안내 — 행정사 지상진이 정리한 실무 가이드.",
    priority: 0.8,
  },
  {
    term: "d-10-비자",
    label: "D-10 비자 (구직)",
    group: "비자",
    query: ["D-10", "D10", "구직비자", "기술창업"],
    tokens: ["d-10", "d10", "구직비자"],
    description: "D-10 구직비자에서 D-8 전환, 점수제 가산점, 활동 범위 — Jean의 실무 안내.",
    deadlineNote: "D-10 체류 기간 만료 전 전환·연장 준비가 필요합니다. 만료가 임박했다면 서둘러 검토받으세요.",
    priority: 0.8,
  },
  {
    term: "f-2-7-비자",
    label: "F-2-7 비자 (점수제 거주)",
    group: "비자",
    query: ["F-2-7", "F27", "점수제", "거주비자"],
    tokens: ["f-2-7", "f2-7", "점수제"],
    description: "F-2-7 점수제 거주 비자 신청 점수 계산, 필요 서류, 갱신 안내.",
    deadlineNote:
      "점수·체류 요건은 심사 시점 기준으로 계산됩니다. 신청 시기에 따라 결과가 달라질 수 있어 미리 점검하는 것이 좋습니다.",
    priority: 0.8,
  },
  {
    term: "행정심판",
    label: "행정심판",
    group: "심판",
    query: ["행정심판", "재결", "청구기한"],
    tokens: ["행정심판", "이의신청"],
    description: "행정심판 청구 90일 기한, 처분 취소, 재결 절차 — 행정사 지상진의 실무 안내.",
    deadlineNote:
      "행정심판 청구는 처분을 안 날부터 90일 이내입니다. 기한을 놓치면 청구 자체가 각하될 수 있어 빠른 검토가 중요합니다.",
    priority: 0.8,
  },
  {
    term: "귀화",
    label: "귀화 · 국적",
    group: "비자",
    query: ["귀화", "국적", "외국국적불행사"],
    tokens: ["귀화", "국적"],
    description: "일반/간이/특별 귀화, 외국국적불행사 서약 안내 — 다국어 응대 가능.",
    priority: 0.75,
  },
  {
    term: "강제퇴거",
    label: "강제퇴거 대응",
    group: "비자",
    query: ["강제퇴거", "출국명령", "이의신청"],
    tokens: ["강제퇴거", "출국명령"],
    description: "강제퇴거 명령, 출국명령 이의신청, 행정심판 대응 절차.",
    deadlineNote:
      "강제퇴거·출국명령에 대한 이의신청·행정심판은 기한이 짧습니다. 처분서를 받으셨다면 즉시 검토를 권해드립니다.",
    priority: 0.75,
  },
  {
    term: "법인설립",
    label: "법인 설립",
    group: "법인",
    query: ["법인설립", "주식회사", "정관"],
    tokens: ["법인설립", "회사설립"],
    description: "외국인 1인 창업 법인 vs 개인사업자, 정관 작성, 등기 준비 — Jean의 실무 가이드.",
    priority: 0.75,
  },
];

/** 슬러그 → 기본 랜딩 조회 */
export function getBaseKeywordLanding(term: string): BaseKeywordLanding | undefined {
  return BASE_KEYWORD_LANDINGS.find((k) => k.term === term);
}

export const BASE_KEYWORD_SLUGS: readonly string[] = BASE_KEYWORD_LANDINGS.map((k) => k.term);
