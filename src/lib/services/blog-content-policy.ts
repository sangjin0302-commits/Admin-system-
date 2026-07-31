/**
 * 블로그 콘텐츠 출처 정책 (강한 잠금).
 *
 * 정책: 블로그는 **네이버 블로그 수입글 + 그 영문 번역본만** 허용한다.
 *       수동 작성·AI 생성·검색트렌드/커뮤니티/사건 자동 글 등 **임의 생성은 금지**.
 *
 * 근거: 운영자가 네이버 블로그 원문을 정본으로 삼고, 사이트는 그 반영 + 번역만 제공한다.
 *       사실검증되지 않은 임의/AI 글이 사무소 이름으로 게시되는 것을 원천 차단한다.
 *
 * 탈출구: 정말 필요할 때만 env `BLOG_ALLOW_NONNAVER_AUTHORING="true"` 로 명시적 해제.
 *        (기본값=차단. 코드/플래그 토글이 아니라 배포 env 변경이라야 풀림 → 강한 잠금.)
 *
 * 이 가드는 blogPost 를 생성하는 **네이버 외 모든 경로**에서 호출해야 한다.
 * (`src/lib/services/__tests__/blog-source-guard.test.ts` 가 이를 강제한다.)
 */

import { NAVER_BLOG_SOURCE } from "@/lib/services/naver-rss-importer";

/** blogPost.create 가 허용되는 출처(네이버 계열만). 번역본은 같은 레코드의 titleEn/bodyEn 이라 별도 생성 없음. */
export const ALLOWED_BLOG_SOURCES: readonly string[] = [NAVER_BLOG_SOURCE];

export class BlogContentPolicyError extends Error {
  readonly code = "BLOG_NAVER_ONLY_POLICY";
  constructor(source: string) {
    super(
      `블로그 글 생성이 정책으로 차단되었습니다(source="${source}"). ` +
        `네이버 수입글과 그 번역본만 허용됩니다. ` +
        `필요 시 env BLOG_ALLOW_NONNAVER_AUTHORING=true 로만 해제할 수 있습니다.`
    );
    this.name = "BlogContentPolicyError";
  }
}

/** 명시적 해제 여부(기본 false). */
export function isNonNaverAuthoringAllowed(): boolean {
  return process.env.BLOG_ALLOW_NONNAVER_AUTHORING?.trim().toLowerCase() === "true";
}

/** 네이버 외 출처면 정책 위반으로 throw. 네이버 외 모든 blogPost.create 앞에서 호출할 것. */
export function assertBlogCreateAllowed(source: string | null | undefined): void {
  const normalized = (source ?? "").trim();
  if (ALLOWED_BLOG_SOURCES.includes(normalized)) return;
  if (isNonNaverAuthoringAllowed()) return;
  throw new BlogContentPolicyError(normalized || "unknown");
}
