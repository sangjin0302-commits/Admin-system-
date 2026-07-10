/**
 * 블로그 면책 문구 자동 삽입 서비스 (v6.4 §8-6)
 *
 * 발행 시 본문 말미에 표준 면책 문구를 자동으로 덧붙인다.
 * 이미 동일 문구가 포함돼 있으면 중복 삽입하지 않는다.
 */

export const DISCLAIMER_TEXT =
  "※ 본 글은 일반적 정보 제공을 목적으로 하며, 개별 사안에 대한 법률·행정 자문이 아닙니다. " +
  "실제 사안은 사실관계와 관련 법령·행정 처분에 따라 결과가 달라질 수 있으므로, " +
  "구체적인 판단은 반드시 담당 행정사 또는 전문가와 개별 상담하시기 바랍니다.";

const MARKER = "본 글은 일반적 정보 제공을 목적으로 하며";

/** 본문에 면책 문구가 없으면 추가한다. */
export function ensureDisclaimer(blogBody: string | null | undefined): string {
  const body = blogBody ?? "";
  if (body.includes(MARKER)) return body;
  const trimmed = body.replace(/\s+$/u, "");
  const separator = trimmed.length > 0 ? "\n\n" : "";
  return `${trimmed}${separator}${DISCLAIMER_TEXT}`;
}

/** 면책 문구 포함 여부 확인. */
export function hasDisclaimer(blogBody: string | null | undefined): boolean {
  return (blogBody ?? "").includes(MARKER);
}
