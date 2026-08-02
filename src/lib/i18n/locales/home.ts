/**
 * 홈페이지 마케팅 문구 — admin(/admin/i18n)에서 편집 가능한 네임스페이스.
 *
 * 키 이름은 i18n-public.ts 의 HOME_COPY 와 일치시켜, 홈 페이지가
 * override[key] ?? HOME_COPY[lang][key] 로 읽는다(override 없으면 기본값).
 *
 * ⚠️ 배열/객체(whyCards·benefits 등)는 override 시스템이 문자열만 지원하므로
 *    여기 넣지 않는다. 편집 대상은 헤드라인·CTA·섹션 제목 등 스칼라 문구만.
 */

export const HOME_MESSAGES: Record<"ko" | "en" | "zh", Record<string, string>> = {
  ko: {
    heroEyebrow: "행정사 사무소 · 비자 · 행정심판 · 인허가",
    ctaFreeReview: "무료 검토 신청",
    ctaQuickCheck30: "30초 AI 사전 진단",
    socialEcho: "접수 후 영업일 24시간 내 담당 행정사가 직접 회신드립니다.",
    practiceTitle: "다섯 가지 주력 분야",
    practiceSubtitle: "각 분야별 전문 워크플로우로 처음부터 끝까지 안내합니다.",
    whyTitle: "왜 ETHOS인가",
    whySubtitle: "변호사, 셀프, 행정사 — 사안별로 적합한 경로가 다릅니다.",
    processTitle: "다섯 단계 진행 절차",
    processSubtitle: "고객이 준비할 일과 사무소가 확인할 일을 단계별로 안내합니다.",
    faqTitle: "자주 묻는 질문",
    faqMore: "더 궁금한 점이 있으신가요?",
    finalCtaTitle: "지금 필요한 업무를 접수하고 다음 단계를 확인하세요",
    finalCtaDescription: "비자·행정심판·계약서·인허가 — 어떤 사안이든 사실관계 확인부터 신중하게 시작합니다."
  },
  en: {
    heroEyebrow: "Administrative Attorney · Visa · Appeal · Permits",
    ctaFreeReview: "Free Review",
    ctaQuickCheck30: "30-sec AI Pre-Check",
    socialEcho: "A dedicated attorney replies within 24 business hours of intake.",
    practiceTitle: "Five Core Areas",
    practiceSubtitle: "A dedicated workflow for each area, organized step by step.",
    whyTitle: "Why ETHOS",
    whySubtitle: "Lawyer, DIY, or administrative attorney — the right path depends on the matter.",
    processTitle: "Five-Step Procedure",
    processSubtitle: "What you prepare and what we verify, clearly separated step by step.",
    faqTitle: "Frequently Asked Questions",
    faqMore: "Have more questions?",
    finalCtaTitle: "Start your matter and confirm your next step.",
    finalCtaDescription: "Visa · Admin Appeal · Contract · License — whatever the matter, we start by verifying the facts."
  },
  zh: {}
};
