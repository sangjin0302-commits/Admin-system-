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
    finalCtaDescription: "비자·행정심판·계약서·인허가 — 어떤 사안이든 사실관계 확인부터 신중하게 시작합니다.",
    safetyNote: "※ 사안별 검토가 필요하며, 기관 제출 방식은 공식 기준 확인 후 안내드립니다.",
    deadlineCta: "무료로 남은 기한 확인",
    noticeLabel: "공지",
    cardAuthority: "주한 대사관 비자 실무 3년\n법무부 번역인 · 법원 통번역인",
    practiceDetail: "자세히 보기",
    practiceConsult: "이 분야 상담",
    leadTitle: "행정사 지상진",
    leadDesc: "비자·출입국, 행정심판, 계약서·사실조사, 인허가 업무를 직접 담당합니다. 외국인 의뢰인도 모국어로 안심하고 상담할 수 있습니다.",
    profileCta: "프로필 자세히 보기 →",
    brandPara1: "행정 문제는 단순한 서류 작성이 아닙니다. 그 안에는 누군가의 생계, 체류, 권리, 가족, 사업, 그리고 앞으로의 삶이 함께 담겨 있습니다.",
    brandPara2Pre: "에토스 행정사사무소는 아리스토텔레스가 말한 설득의 세 요소, ",
    brandPara2Post: " 를 바탕으로 사안에 맞는 방향을 함께 찾아갑니다.",
    brandQuote: "절차에는 이성을, 사람에게는 공감을, 일에는 신뢰를.",
    pricingTitle: "비용이 궁금하세요?",
    pricingDesc: "사안·난이도별 예상 수임료를 30초 만에 확인해 보세요.",
    pricingCta: "예상 수임료 30초 계산 →",
    officeTitle: "사무소 운영 원칙",
    ctaTrack: "포털 · 진행조회"
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
    finalCtaDescription: "Visa · Admin Appeal · Contract · License — whatever the matter, we start by verifying the facts.",
    safetyNote: "* Each matter is reviewed individually; submission methods follow official agency rules.",
    deadlineCta: "Check your remaining deadline (free)",
    noticeLabel: "Notice",
    cardAuthority: "3 yrs embassy visa practice\nMOJ translator · Court interpreter",
    practiceDetail: "Learn more",
    practiceConsult: "Consult this area",
    leadTitle: "Attorney Ji Sang-jin",
    leadDesc: "Handles visa & immigration, administrative appeals, contracts & fact-finding, and permits directly. Foreign clients can consult with confidence.",
    profileCta: "View full profile →",
    brandPara1: "An administrative matter is not just paperwork. Within it are someone's livelihood, residency, rights, family, business, and the life ahead.",
    brandPara2Pre: "ETHOS builds on Aristotle's three elements of persuasion, ",
    brandPara2Post: ", to find the right direction for each matter.",
    brandQuote: "Reason in process, empathy for people, trust in every step.",
    pricingTitle: "Curious about fees?",
    pricingDesc: "Check an estimated fee by matter and difficulty in 30 seconds.",
    pricingCta: "Estimate fees in 30s →",
    officeTitle: "Office Principles",
    ctaTrack: "Portal / Track"
  },
  zh: {}
};
