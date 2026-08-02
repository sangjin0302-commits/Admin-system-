/**
 * 블로그 글 키워드 기반 자동 분류기.
 *
 * 공개: 5대 분야 (의뢰인이 보는 카테고리 — 전문성 유지)
 * 내부: 행정사 100% 커버용 세분류 (admin/통계용)
 *
 * 내부 카테고리는 공개 노출 시 자동으로 primary 5대로 매핑.
 */

// ── 공개 5대 분야 ─────────────────────────────────────
export type PublicCategory = "visa" | "appeal" | "contract" | "license" | "corporate" | "other";

export const PUBLIC_CATEGORY_LABEL: Record<PublicCategory, string> = {
  visa: "비자·체류",
  appeal: "행정심판",
  contract: "계약·사실조사",
  license: "인허가",
  corporate: "법인설립",
  other: "기타"
};

// 영문 사이트(?lang=en)용 라벨. 영문 블로그에서도 카테고리가 한글로 나오던 문제 대응.
export const PUBLIC_CATEGORY_LABEL_EN: Record<PublicCategory, string> = {
  visa: "Visa & Residency",
  appeal: "Administrative Appeal",
  contract: "Contracts & Fact-finding",
  license: "Licensing & Permits",
  corporate: "Company Formation",
  other: "Other"
};

/** 언어별 공개 카테고리 라벨. lang 미지정이면 한글. */
export function publicCategoryLabel(cat: PublicCategory, lang: "ko" | "en" = "ko"): string {
  return lang === "en" ? PUBLIC_CATEGORY_LABEL_EN[cat] : PUBLIC_CATEGORY_LABEL[cat];
}

// ── 내부 세분류 (admin 전용) ─────────────────────────
export type InternalCategory =
  | "naturalization"     // 귀화·국적
  | "refugee"            // 난민·인도적체류
  | "complaint"          // 권익위·인권위·진정
  | "petition"           // 민원·탄원·청원
  | "deposit"            // 공탁
  | "building_permit"    // 건축·소방
  | "vehicle"            // 자동차 등록·이전
  | "social_security";   // 사회보장·외국인 보험

export type BlogCategory = PublicCategory | InternalCategory;

// 내부 → 공개 매핑 (의뢰인 노출용)
export const INTERNAL_TO_PUBLIC: Record<InternalCategory, PublicCategory> = {
  naturalization: "visa",
  refugee: "visa",
  complaint: "appeal",
  petition: "appeal",
  deposit: "contract",
  building_permit: "license",
  vehicle: "license",
  social_security: "visa"
};

// admin/통계용 라벨 (한글)
export const INTERNAL_CATEGORY_LABEL: Record<InternalCategory, string> = {
  naturalization: "귀화·국적",
  refugee: "난민·인도적체류",
  complaint: "권익위·인권위",
  petition: "민원·탄원",
  deposit: "공탁",
  building_permit: "건축·소방",
  vehicle: "자동차",
  social_security: "사회보장"
};

// 통합 라벨 매핑
export const CATEGORY_LABEL: Record<BlogCategory, string> = {
  ...PUBLIC_CATEGORY_LABEL,
  ...INTERNAL_CATEGORY_LABEL
};

/** 공개 페이지에 노출할 카테고리로 정규화 */
export function toPublicCategory(c: string): PublicCategory {
  if (c in PUBLIC_CATEGORY_LABEL) return c as PublicCategory;
  if (c in INTERNAL_TO_PUBLIC) return INTERNAL_TO_PUBLIC[c as InternalCategory];
  return "other";
}

/**
 * key(visa…)·internal(naturalization…)뿐 아니라 **한글 라벨**("비자·체류")도 인식.
 * 마크다운 글은 category 가 라벨로 저장돼 toPublicCategory 로는 항상 "기타"가 되던 문제 대응.
 */
export function toPublicCategoryLoose(c: string): PublicCategory {
  const direct = toPublicCategory(c);
  if (direct !== "other") return direct;
  const byLabel = (Object.entries(PUBLIC_CATEGORY_LABEL) as [PublicCategory, string][]).find(
    ([, label]) => label === c
  );
  if (byLabel) return byLabel[0];
  // 내부 라벨("귀화·국적" 등)도 시도
  const byInternalLabel = (Object.entries(INTERNAL_CATEGORY_LABEL) as [InternalCategory, string][]).find(
    ([, label]) => label === c
  );
  if (byInternalLabel) return INTERNAL_TO_PUBLIC[byInternalLabel[0]];
  return "other";
}

// ── 카테고리 → 추천 채널 ─────────────────────────────
export const CATEGORY_CHANNEL: Record<PublicCategory, "naverTalk" | "kakao" | "email" | "telegram"> = {
  visa: "naverTalk",
  appeal: "email",
  contract: "email",
  license: "naverTalk",
  corporate: "email",
  other: "naverTalk"
};

// ── 키워드 패턴 ──────────────────────────────────────
const KEYWORDS: Partial<Record<BlogCategory, RegExp[]>> = {
  // 공개 5대
  visa: [
    /비자|체류|D-?\d+|E-?\d+|F-?\d+|H-?\d+/i,
    /출입국|영주|초청/,
    /외국인|강제퇴거|출국명령/,
    /immigrat|visa|residenc/i
  ],
  appeal: [
    /행정심판|행심|재결|청구기한|처분/,
    /정보공개|비공개\s*통지|정보공개청구|이의신청/,
    /administrative appeal|appeal|information disclosure/i
  ],
  contract: [
    /계약서|계약 검토|계약 작성|사실조사|증거/,
    /contract|fact[- ]?find|investigat/i
  ],
  license: [
    /인허가|허가|면허|등록|건축|식품|의료|환경/,
    /license|permit|registration/i
  ],
  corporate: [
    /법인|설립|정관|등기|개인사업|주식회사|유한회사/,
    /corporat|incorporat|company formation/i
  ],

  // 내부 세분류
  naturalization: [
    /귀화|국적\s*취득|국적\s*회복|외국국적\s*불행사/,
    /naturali|citizenship|nationality/i
  ],
  refugee: [
    /난민|G-?1|인도적\s*체류|박해|persecut/i,
    /refugee|asylum/i
  ],
  complaint: [
    /권익위|국민권익위|인권위|국가인권위|진정/,
    /ombudsman|human rights commission/i
  ],
  petition: [
    /민원|탄원|청원/,
    /petition/i
  ],
  deposit: [
    /공탁|변제공탁|담보공탁/,
    /deposit\s+with\s+court/i
  ],
  building_permit: [
    /건축\s*허가|소방\s*시설|사용\s*승인|착공/,
    /building permit|fire safety/i
  ],
  vehicle: [
    /자동차\s*등록|차량\s*이전|말소\s*등록/,
    /vehicle registration|car registration/i
  ],
  social_security: [
    /건강보험|국민건강|산재|고용보험|기초생활|복지/,
    /health insurance|workers compensation|social security/i
  ]
};

export function classifyBlogPost(text: string, title = ""): BlogCategory {
  const t = text.normalize("NFC");
  const tt = title.normalize("NFC");
  const TITLE_WEIGHT = 5; // 제목은 본문 예시보다 주제를 강하게 반영 → 가중.
  const scores: Partial<Record<BlogCategory, number>> = {};
  for (const [cat, patterns] of Object.entries(KEYWORDS) as [BlogCategory, RegExp[]][]) {
    let s = 0;
    for (const p of patterns) {
      const g = p.flags.includes("g") ? p.flags : p.flags + "g";
      const bodyMatches = t.match(new RegExp(p.source, g));
      if (bodyMatches) s += bodyMatches.length;
      if (tt) {
        const titleMatches = tt.match(new RegExp(p.source, g));
        if (titleMatches) s += titleMatches.length * TITLE_WEIGHT;
      }
    }
    scores[cat] = s;
  }
  const best = (Object.entries(scores) as [BlogCategory, number][])
    .sort((a, b) => b[1] - a[1])[0];
  if (!best || best[1] === 0) return "other";
  return best[0];
}
