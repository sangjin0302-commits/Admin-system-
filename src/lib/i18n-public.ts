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
    ctaIntake: "상담 신청",
    ctaTrack: "진행상황 조회",
    safetyNote: "※ 사안별 검토가 필요하며, 기관 제출 방식은 공식 기준 확인 후 안내드립니다.",
    storyKicker: "Brand Story",
    storyTitle: "절차에는 이성을, 사람에게는 공감을, 일에는 신뢰를.",
    practiceKicker: "Practice Areas",
    practiceTitle: "네 가지 주력 분야",
    practiceSubtitle: "각 분야별 전문 워크플로우로 사안을 체계적으로 정리합니다.",
    processKicker: "Our Process",
    processTitle: "다섯 단계 진행 절차",
    processSubtitle: "고객이 준비할 일과 사무소가 확인할 일을 단계별로 안내합니다.",
    faqTitle: "자주 묻는 질문",
    finalCtaKicker: "Begin Your Story",
    finalCtaTitle: "지금 필요한 업무를 접수하고 다음 단계를 확인하세요",
    finalCtaDescription: "비자·행정심판·계약서·인허가 — 어떤 사안이든 사실관계 확인부터 신중하게 시작합니다."
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
    ctaIntake: "Apply",
    ctaTrack: "Check Status",
    safetyNote: "* Each matter is reviewed individually; submission methods follow official agency rules.",
    storyKicker: "Brand Story",
    storyTitle: "Reason in Process. Empathy for People. Trust in Every Step.",
    practiceKicker: "Practice Areas",
    practiceTitle: "Four Core Areas",
    practiceSubtitle: "A dedicated workflow for each area, organized step by step.",
    processKicker: "Our Process",
    processTitle: "Five-Step Procedure",
    processSubtitle: "What you prepare and what we verify, clearly separated step by step.",
    faqTitle: "Frequently Asked Questions",
    finalCtaKicker: "Begin Your Story",
    finalCtaTitle: "Start your matter and confirm your next step.",
    finalCtaDescription:
      "Visa · Admin Appeal · Contract · License — whatever the matter, we start by verifying the facts."
  }
} as const;
