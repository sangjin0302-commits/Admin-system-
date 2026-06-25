/**
 * 경량 HTML sanitizer — Naver 블로그 본문에 적합.
 * - script/style/iframe/object/embed/form 제거
 * - on* 이벤트 핸들러 제거
 * - href/src의 javascript: data: 스킴 차단
 * - 외부 의존성 없음
 */

const BLOCKED_TAGS = /<(script|style|iframe|object|embed|form|noscript|meta|link|svg|math)\b[^>]*>[\s\S]*?<\/\1>/gi;
const SELF_CLOSING_BLOCKED = /<(script|style|iframe|object|embed|form|noscript|meta|link)\b[^>]*\/?>/gi;
const EVENT_HANDLERS = /\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi;
const JS_HREF = /\s+(href|src|action|formaction|xlink:href|data)\s*=\s*(["'])\s*(?:javascript|data|vbscript):[^"']*\2/gi;

export function sanitizeHtml(input: string): string {
  if (!input) return "";
  let s = input;
  s = s.replace(BLOCKED_TAGS, "");
  s = s.replace(SELF_CLOSING_BLOCKED, "");
  s = s.replace(EVENT_HANDLERS, "");
  s = s.replace(JS_HREF, "");
  return s;
}
