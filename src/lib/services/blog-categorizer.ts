/**
 * 블로그 글 키워드 기반 자동 분류기.
 * 5대 분야 + 기타 → category 필드에 저장.
 */

export type BlogCategory = "visa" | "appeal" | "contract" | "license" | "corporate" | "other";

export const CATEGORY_LABEL: Record<BlogCategory, string> = {
  visa: "비자·체류",
  appeal: "행정심판",
  contract: "계약·사실조사",
  license: "인허가",
  corporate: "법인설립",
  other: "기타"
};

export const CATEGORY_CHANNEL: Record<BlogCategory, "naverTalk" | "kakao" | "email" | "telegram"> = {
  visa: "naverTalk",      // 외국인 → 한국인 → 톡톡
  appeal: "email",        // 행정심판 → 공식 채널
  contract: "email",      // 계약 → 공식 채널
  license: "naverTalk",   // 인허가 → 빠른 회신
  corporate: "email",     // 법인설립 → 공식 채널
  other: "naverTalk"
};

const KEYWORDS: Record<BlogCategory, RegExp[]> = {
  visa: [
    /비자|체류|D-?\d+|E-?\d+|F-?\d+|H-?\d+/i,
    /출입국|영주|국적|귀화/,
    /외국인|난민|강제퇴거|출국명령|초청/,
    /immigrat|visa|residenc|naturali/i
  ],
  appeal: [
    /행정심판|행심|재결|청구기한|처분/,
    /administrative appeal|appeal/i
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
    /corporat|incorporat|company formation|articles of incorporation/i
  ],
  other: []
};

export function classifyBlogPost(text: string): BlogCategory {
  const t = text.normalize("NFC");
  const scores: Partial<Record<BlogCategory, number>> = {};
  for (const [cat, patterns] of Object.entries(KEYWORDS) as [BlogCategory, RegExp[]][]) {
    if (cat === "other") continue;
    let s = 0;
    for (const p of patterns) {
      const matches = t.match(new RegExp(p.source, p.flags.includes("g") ? p.flags : p.flags + "g"));
      if (matches) s += matches.length;
    }
    scores[cat] = s;
  }
  const best = (Object.entries(scores) as [BlogCategory, number][])
    .sort((a, b) => b[1] - a[1])[0];
  if (!best || best[1] === 0) return "other";
  return best[0];
}
