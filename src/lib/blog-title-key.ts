/**
 * 블로그 제목 정규화 키 — 중복 판정용.
 *
 * 문제: 예전 수입분은 제목이 `%20`/`+`/엔티티 인코딩된 채 저장돼, dedup 이 raw
 * `title.trim()` 으로 비교하면 `A%20B` 와 `A B` 가 다른 키로 취급돼 "중복 0"이 나오지만
 * 공개 페이지는 둘 다 디코딩해 "A B"로 똑같이 보여 사용자 눈엔 중복이었다.
 *
 * 이 함수는 공개 표시와 동일하게 디코딩(%,+) + 엔티티 + 공백 정규화 + 소문자화해
 * **표시가 같은 제목은 같은 키**가 되도록 한다. dedup·중복검사에서 이 키를 쓴다.
 */
export function blogTitleKey(raw: string): string {
  let s = (raw ?? "").trim();
  if (!s) return "";
  // %-인코딩/+ 디코딩(공개 decodeTitle 과 동일 규칙).
  if (s.includes("%") || s.includes("+")) {
    try {
      s = decodeURIComponent(s.replace(/\+/g, " "));
    } catch {
      s = s.replace(/\+/g, " ");
    }
  }
  // 흔한 HTML 엔티티.
  s = s
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&nbsp;/gi, " ");
  // 공백 정규화 + 소문자(대소문자만 다른 변종도 묶음).
  return s.replace(/\s+/g, " ").trim().toLowerCase();
}
