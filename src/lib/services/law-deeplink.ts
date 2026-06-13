/**
 * 법령명 자동 인식 + 법제처 deeplink 변환.
 * - 입력: 일반 텍스트 또는 ["행정심판법", ...] 배열
 * - 출력: 동일 형태 + 법령명 → 법제처 URL 매핑
 *
 * 법제처 deeplink (인증 없이 동작):
 *   https://www.law.go.kr/법령/<법령명>
 */

const LAW_NAME_PATTERN = /([가-힣A-Za-z]+(?:법|령|규칙|시행령|시행규칙|예규|훈령|조례))/g;

const KNOWN_LAWS = new Set([
  "행정심판법",
  "행정소송법",
  "행정절차법",
  "행정사법",
  "출입국관리법",
  "재한외국인 처우 기본법",
  "국적법",
  "민법",
  "상법",
  "건축법",
  "식품위생법",
  "의료법",
  "사회복지사업법",
  "전자상거래 등에서의 소비자보호에 관한 법률",
  "개인정보 보호법"
]);

export function buildLawDeeplink(lawName: string): string {
  return `https://www.law.go.kr/법령/${encodeURIComponent(lawName.trim())}`;
}

export function extractLawNames(text: string): string[] {
  const out = new Set<string>();
  for (const m of text.matchAll(LAW_NAME_PATTERN)) {
    const name = m[1];
    if (name.length >= 2 && name.length <= 50) out.add(name);
  }
  return Array.from(out);
}

export type LawCitation = {
  name: string;
  url: string;
  isKnown: boolean;
};

export function annotateText(text: string): {
  text: string;
  citations: LawCitation[];
} {
  const names = extractLawNames(text);
  const citations: LawCitation[] = names.map((name) => ({
    name,
    url: buildLawDeeplink(name),
    isKnown: KNOWN_LAWS.has(name)
  }));
  return { text, citations };
}

/**
 * lawbot must_verify_sources (또는 must_verify) 문자열 배열에서
 * 법령명을 추출하여 인용 정보로 반환.
 */
export function buildCitationsFromLawbotSources(sources: readonly string[]): LawCitation[] {
  const seen = new Set<string>();
  const result: LawCitation[] = [];
  for (const s of sources) {
    for (const name of extractLawNames(s)) {
      if (seen.has(name)) continue;
      seen.add(name);
      result.push({ name, url: buildLawDeeplink(name), isKnown: KNOWN_LAWS.has(name) });
    }
  }
  return result;
}
