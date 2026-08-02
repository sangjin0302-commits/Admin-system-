/**
 * 공개 페이지 간단 i18n — searchParams.lang 으로 ko/en 분기.
 * 큰 i18n 인프라 없이 페이지별 카피만 한정 사용.
 */

export type PublicLocale = "ko" | "en";

export function normalizeLang(raw?: string): PublicLocale {
  return raw === "en" ? "en" : "ko";
}

export const HOME_COPY = {
  ko: {
    heroTagBadge: "행정사 사무소 · 사건 관리 시스템",
    heroTitleA: "이성으로 풀고,",
    heroTitleB: "공감으로 듣고,",
    heroTitleC: "신뢰로 완성",
    heroTitleD: "합니다.",
    heroDescription:
      "접수부터 기한관리, 자료요청, 문서 준비까지 놓치기 쉬운 단계를 체계적으로 정리합니다. 접수 후 받은 접수번호로 진행상황을 언제든 확인하실 수 있습니다.",
    ctaQuickCheck: "AI 사전 진단 (무료)",
    ctaIntake: "무료 검토 요청",
    ctaTrack: "포털 · 진행조회",
    safetyNote: "※ 사안별 검토가 필요하며, 기관 제출 방식은 공식 기준 확인 후 안내드립니다.",
    storyKicker: "Brand Story",
    storyTitle: "절차에는 이성을, 사람에게는 공감을, 일에는 신뢰를.",
    practiceKicker: "Practice Areas",
    practiceTitle: "다섯 가지 주력 분야",
    practiceSubtitle: "각 분야별 전문 워크플로우로 처음부터 끝까지 안내합니다.",
    processKicker: "Our Process",
    processTitle: "다섯 단계 진행 절차",
    processSubtitle: "고객이 준비할 일과 사무소가 확인할 일을 단계별로 안내합니다.",
    faqTitle: "자주 묻는 질문",
    finalCtaKicker: "Begin Your Story",
    finalCtaTitle: "지금 필요한 업무를 접수하고 다음 단계를 확인하세요",
    finalCtaDescription: "비자·행정심판·계약서·인허가 — 어떤 사안이든 사실관계 확인부터 신중하게 시작합니다.",
    heroEyebrow: "행정사 사무소 · 비자 · 행정심판 · 인허가",
    benefits: ["주한 대사관 실무 3년", "영업일 24시간 내 회신 안내", "한국어 · 영어 상담"],
    heroTitleLead: "비자 거절, 행정처분, 인허가 —",
    heroTitleEmph: "방향은 빠르게, 판단은 사안별로",
    heroTitleTail: " 드립니다",
    ctaFreeReview: "무료 검토 신청",
    ctaQuickCheck30: "30초 AI 사전 진단",
    socialEcho: "접수 후 영업일 24시간 내 담당 행정사가 직접 회신드립니다.",
    deadlineCta: "무료로 남은 기한 확인",
    noticeLabel: "공지",
    cardAuthority: "주한 대사관 비자 실무 3년\n법무부 번역인 · 법원 통번역인",
    practiceDetail: "자세히 보기",
    practiceConsult: "이 분야 상담",
    whyTitle: "왜 ETHOS인가",
    whySubtitle: "변호사, 셀프, 행정사 — 사안별로 적합한 경로가 다릅니다.",
    whyCards: [
      { title: "행정 절차 근거 명확", desc: "행정사법 제2조 업무 범위 내에서 사안별로 견적하고 착수 전 서면으로 확인합니다." },
      { title: "대사관 실무 3년", desc: "주한 대사관 비자·출입국 실무 경험을 바탕으로 서식·기한·근거를 짚어드립니다." },
      { title: "끝까지 한 창구", desc: "검토 → 서면 → 제출 → 결과까지 담당 행정사가 직접 관리합니다." },
      { title: "다국어 대응", desc: "한국어 · 영어로 외국인 의뢰인도 편하게 상담할 수 있습니다." }
    ],
    leadTitle: "행정사 지상진",
    leadDesc: "비자·출입국, 행정심판, 계약서·사실조사, 인허가 업무를 직접 담당합니다. 외국인 의뢰인도 모국어로 안심하고 상담할 수 있습니다.",
    leadBullets: ["주한 대사관 비자·출입국 실무 3년", "법무부 난민 판결문 공식 번역인", "법원행정처 법정 통번역인 등록", "한국어 · 영어 상담 가능"],
    profileCta: "프로필 자세히 보기 →",
    brandHeading: ["행정 문제 뒤에 있는", "사람의 마음까지", "함께 헤아립니다."],
    brandPara1: "행정 문제는 단순한 서류 작성이 아닙니다. 그 안에는 누군가의 생계, 체류, 권리, 가족, 사업, 그리고 앞으로의 삶이 함께 담겨 있습니다.",
    brandPara2Pre: "에토스 행정사사무소는 아리스토텔레스가 말한 설득의 세 요소, ",
    brandPara2Post: " 를 바탕으로 사안에 맞는 방향을 함께 찾아갑니다.",
    brandQuote: "절차에는 이성을, 사람에게는 공감을, 일에는 신뢰를.",
    pricingTitle: "비용이 궁금하세요?",
    pricingDesc: "사안·난이도별 예상 수임료를 30초 만에 확인해 보세요.",
    pricingCta: "예상 수임료 30초 계산 →",
    officeTitle: "사무소 운영 원칙",
    officeCards: [
      { title: "공식 기준 우선", desc: "공식 서식·제출기관 기준 확인 후 진행합니다." },
      { title: "관리자 검토", desc: "기관 제출은 관리자 검토 후 안내합니다." },
      { title: "정보 보호", desc: "민감 정보 분리 보관, 외부 자동 전송 없습니다." },
      { title: "사안별 상담", desc: "사안마다 자료·절차가 다르므로 개별 검토합니다." }
    ],
    faqMore: "더 궁금한 점이 있으신가요?"
  },
  en: {
    heroTagBadge: "Administrative Attorney Office · Case Management System",
    heroTitleA: "Reason to resolve,",
    heroTitleB: "empathy to listen,",
    heroTitleC: "trust to complete",
    heroTitleD: ".",
    heroDescription:
      "From intake to deadline tracking, document requests, and submission preparation — every step is organized so nothing slips through. You can check progress anytime with your tracking code.",
    ctaQuickCheck: "AI Pre-Check (Free)",
    ctaIntake: "Free Review",
    ctaTrack: "Portal / Track",
    safetyNote: "* Each matter is reviewed individually; submission methods follow official agency rules.",
    storyKicker: "Brand Story",
    storyTitle: "Reason in Process. Empathy for People. Trust in Every Step.",
    practiceKicker: "Practice Areas",
    practiceTitle: "Five Core Areas",
    practiceSubtitle: "A dedicated workflow for each area, organized step by step.",
    processKicker: "Our Process",
    processTitle: "Five-Step Procedure",
    processSubtitle: "What you prepare and what we verify, clearly separated step by step.",
    faqTitle: "Frequently Asked Questions",
    finalCtaKicker: "Begin Your Story",
    finalCtaTitle: "Start your matter and confirm your next step.",
    finalCtaDescription:
      "Visa · Admin Appeal · Contract · License — whatever the matter, we start by verifying the facts.",
    heroEyebrow: "Administrative Attorney · Visa · Appeal · Permits",
    benefits: ["3 yrs embassy practice", "Reply within 24 business hours", "Korean · English consultation"],
    heroTitleLead: "Visa denials, dispositions, permits —",
    heroTitleEmph: "fast direction, case-by-case judgment",
    heroTitleTail: "",
    ctaFreeReview: "Free Review",
    ctaQuickCheck30: "30-sec AI Pre-Check",
    socialEcho: "A dedicated attorney replies within 24 business hours of intake.",
    deadlineCta: "Check your remaining deadline (free)",
    noticeLabel: "Notice",
    cardAuthority: "3 yrs embassy visa practice\nMOJ translator · Court interpreter",
    practiceDetail: "Learn more",
    practiceConsult: "Consult this area",
    whyTitle: "Why ETHOS",
    whySubtitle: "Lawyer, DIY, or administrative attorney — the right path depends on the matter.",
    whyCards: [
      { title: "Clear legal basis", desc: "We quote within the scope of the Administrative Attorney Act Art. 2 and confirm in writing before starting." },
      { title: "3 yrs embassy practice", desc: "Grounded in embassy visa & immigration practice, we pinpoint forms, deadlines, and grounds." },
      { title: "One point of contact", desc: "From review to filing to result, your dedicated attorney handles it directly." },
      { title: "Multilingual", desc: "Korean · English, so foreign clients can consult comfortably." }
    ],
    leadTitle: "Attorney Ji Sang-jin",
    leadDesc: "Handles visa & immigration, administrative appeals, contracts & fact-finding, and permits directly. Foreign clients can consult with confidence.",
    leadBullets: ["3 yrs embassy visa & immigration practice", "MOJ official translator for refugee rulings", "Registered court interpreter/translator", "Korean · English consultation"],
    profileCta: "View full profile →",
    brandHeading: ["We consider the person's heart", "behind the", "administrative matter."],
    brandPara1: "An administrative matter is not just paperwork. Within it are someone's livelihood, residency, rights, family, business, and the life ahead.",
    brandPara2Pre: "ETHOS builds on Aristotle's three elements of persuasion, ",
    brandPara2Post: ", to find the right direction for each matter.",
    brandQuote: "Reason in process, empathy for people, trust in every step.",
    pricingTitle: "Curious about fees?",
    pricingDesc: "Check an estimated fee by matter and difficulty in 30 seconds.",
    pricingCta: "Estimate fees in 30s →",
    officeTitle: "Office Principles",
    officeCards: [
      { title: "Official standards first", desc: "We proceed after confirming official forms and agency rules." },
      { title: "Manager review", desc: "Agency submissions are advised after manager review." },
      { title: "Data protection", desc: "Sensitive data kept separate; no automatic external transfer." },
      { title: "Case-by-case", desc: "Documents and procedures differ per matter, so we review individually." }
    ],
    faqMore: "Have more questions?"
  }
} as const;
