/**
 * Public nav / footer / common CTA translations for ko / en / zh.
 * Namespace: "public-nav"
 */

export type PublicNavKey =
  | "nav.home"
  | "nav.about"
  | "nav.services"
  | "nav.consult"
  | "nav.blog"
  | "nav.portal"
  | "cta.consult"
  | "cta.portal"
  | "cta.freeReview"
  | "footer.rights"
  | "footer.privacy"
  | "footer.terms"
  | "footer.contact";

export const PUBLIC_NAV_MESSAGES: Record<"ko" | "en" | "zh", Record<PublicNavKey, string>> = {
  ko: {
    "nav.home": "홈",
    "nav.about": "소개",
    "nav.services": "분야",
    "nav.consult": "상담",
    "nav.blog": "칼럼",
    "nav.portal": "포털",
    "cta.consult": "상담 신청",
    "cta.portal": "포털 · 진행조회",
    "cta.freeReview": "무료 검토 요청",
    "footer.rights": "All rights reserved.",
    "footer.privacy": "개인정보처리방침",
    "footer.terms": "이용약관",
    "footer.contact": "연락처",
  },
  en: {
    "nav.home": "Home",
    "nav.about": "About",
    "nav.services": "Services",
    "nav.consult": "Consult",
    "nav.blog": "Blog",
    "nav.portal": "Portal",
    "cta.consult": "Consult",
    "cta.portal": "Portal / Track",
    "cta.freeReview": "Free Review",
    "footer.rights": "All rights reserved.",
    "footer.privacy": "Privacy Policy",
    "footer.terms": "Terms of Service",
    "footer.contact": "Contact",
  },
  zh: {
    "nav.home": "首页",
    "nav.about": "关于",
    "nav.services": "服务",
    "nav.consult": "咨询",
    "nav.blog": "专栏",
    "nav.portal": "门户",
    "cta.consult": "申请咨询",
    "cta.portal": "门户 / 进度",
    "cta.freeReview": "免费审查",
    "footer.rights": "版权所有",
    "footer.privacy": "隐私政策",
    "footer.terms": "服务条款",
    "footer.contact": "联系方式",
  },
};
