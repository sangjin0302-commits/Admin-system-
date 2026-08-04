/**
 * 관보 항목 → 관련 서비스 CTA 매칭 (순수 모듈).
 *
 * 관보 제목·기관·구분·요약 텍스트를 블로그 분류기(classifyBlogPost)로 5대 분야로
 * 분류한 뒤, 분야별 공개 서비스 페이지로 연결한다. 확신 없는 항목("other")은
 * null 을 반환해 무관한 CTA 노출을 막는다(노이즈 방지).
 *
 * 네트워크·DB 접근 없음 → 단위 테스트로 계약 고정(test:gazette-service).
 */

import { classifyBlogPost, toPublicCategory, type PublicCategory } from "@/lib/services/blog-categorizer";

export type GazetteServiceLink = { href: string; label: string };

type ServiceTarget = { href: string; ko: string; en: string };

// 공개 5대 분야 → 실제 공개 서비스 URL(legacy 라우트). "other" 는 제외.
const CATEGORY_SERVICE: Partial<Record<PublicCategory, ServiceTarget>> = {
  visa: { href: "/services/immigration", ko: "비자·체류 업무", en: "Visa & Residency" },
  appeal: { href: "/services/appeal", ko: "행정심판·이의신청", en: "Administrative Appeal" },
  contract: { href: "/services/contract", ko: "계약·사실조사", en: "Contracts & Fact-finding" },
  license: { href: "/services/license", ko: "인허가·등록", en: "Licensing & Permits" },
  corporate: { href: "/services/corporate", ko: "법인·사업 행정", en: "Company & Business" },
};

export type GazetteMatchInput = {
  title?: string | null;
  agency?: string | null;
  category?: string | null;
  summary?: string | null;
};

/**
 * 관보 항목에 대응하는 서비스 링크. 매칭 확신 없으면 null.
 * @param lang 라벨 언어(기본 ko).
 */
export function matchGazetteService(item: GazetteMatchInput, lang: "ko" | "en" = "ko"): GazetteServiceLink | null {
  const title = (item.title ?? "").trim();
  if (!title) return null;
  // 제목은 가중(분류기 내부 TITLE_WEIGHT), 본문에는 기관·구분·요약을 합쳐 신호 보강.
  const body = [item.agency ?? "", item.category ?? "", item.summary ?? ""].join(" ").trim();
  const cat = toPublicCategory(classifyBlogPost(body, title));
  const target = CATEGORY_SERVICE[cat];
  if (!target) return null;
  return { href: target.href, label: lang === "en" ? target.en : target.ko };
}
