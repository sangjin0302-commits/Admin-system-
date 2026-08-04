/**
 * 서비스 CMS override 파싱(공개 페이지·테스트 공용).
 * 관리자가 site-content 에 입력한 멀티라인 문자열을 배열/쌍으로 안전 변환.
 * 유효 항목이 없으면 null → 호출부가 기본값으로 폴백(절대 crash 안 함).
 */

/** 줄당 1항목(빈 줄 제외). 항목 없으면 null. */
export function parseLineList(raw?: string | null): string[] | null {
  const lines = (raw ?? "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  return lines.length > 0 ? lines : null;
}

/**
 * "앞 :: 뒤" 줄당 1쌍. requireBoth=true 면 뒤도 있어야 채택(faq·deadlines),
 * false 면 앞만 있으면 채택하고 뒤는 빈 문자열 허용(process 설명 생략).
 */
export function parsePairList(
  raw?: string | null,
  opts?: { requireBoth?: boolean }
): { a: string; b: string }[] | null {
  const rows = (raw ?? "")
    .split("\n")
    .map((line) => {
      const [a, ...rest] = line.split("::");
      return { a: (a ?? "").trim(), b: rest.join("::").trim() };
    })
    .filter((x) => (opts?.requireBoth ? x.a && x.b : x.a));
  return rows.length > 0 ? rows : null;
}
