/**
 * 블로그 글에서 행정사 도메인 태그 추출.
 * - 비자 코드 (D-8, F-2-7, E-7 등)
 * - 행정심판 키워드
 * - 법령 조항 (89조 등)
 * - 일반 키워드 (체류, 영주, 등)
 */

const PATTERNS: Array<{ tag: string; re: RegExp }> = [
  // 비자 코드
  { tag: "D-8", re: /D-?8\b/gi },
  { tag: "D-10", re: /D-?10\b/gi },
  { tag: "D-2", re: /D-?2\b/gi },
  { tag: "E-7", re: /E-?7\b/gi },
  { tag: "E-9", re: /E-?9\b/gi },
  { tag: "F-2", re: /F-?2(?!-7)\b/gi },
  { tag: "F-2-7", re: /F-?2-?7\b/gi },
  { tag: "F-4", re: /F-?4\b/gi },
  { tag: "F-5", re: /F-?5\b/gi },
  { tag: "F-6", re: /F-?6\b/gi },
  { tag: "H-2", re: /H-?2\b/gi },
  // 도메인
  { tag: "체류연장", re: /체류\s*기간\s*연장|체류연장/g },
  { tag: "자격변경", re: /자격\s*변경|체류자격\s*변경/g },
  { tag: "강제퇴거", re: /강제\s*퇴거/g },
  { tag: "출국명령", re: /출국\s*명령/g },
  { tag: "영주", re: /영주(?!\s*권)|영주권/g },
  { tag: "귀화", re: /귀화|국적\s*취득/g },
  { tag: "난민", re: /난민/g },
  { tag: "행정심판", re: /행정\s*심판/g },
  { tag: "이의신청", re: /이의\s*신청/g },
  { tag: "처분취소", re: /처분\s*취소/g },
  { tag: "재결", re: /재결/g },
  { tag: "법인설립", re: /법인\s*설립|주식회사\s*설립/g },
  { tag: "정관", re: /정관/g },
  { tag: "사업자등록", re: /사업자\s*등록/g },
  { tag: "통신판매업", re: /통신\s*판매업/g },
  { tag: "투자비자", re: /투자\s*비자|투자\s*이민/g },
  { tag: "창업비자", re: /창업\s*비자|기술\s*창업/g },
  { tag: "계약검토", re: /계약\s*검토|계약\s*서\s*검토/g },
  { tag: "사실조사", re: /사실\s*조사|증거\s*수집/g },
  { tag: "OASIS", re: /OASIS/gi }
];

export function extractTags(text: string, opts?: { max?: number }): string[] {
  const max = opts?.max ?? 8;
  const t = text.normalize("NFC");
  const scores: Record<string, number> = {};
  for (const p of PATTERNS) {
    const m = t.match(new RegExp(p.re.source, p.re.flags));
    if (m && m.length > 0) {
      scores[p.tag] = (scores[p.tag] ?? 0) + m.length;
    }
  }
  return Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, max)
    .map(([tag]) => tag);
}
