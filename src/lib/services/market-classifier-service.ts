/**
 * 시장 문서 분류기 (market-analyze `app/services/classifier.py` + `filters.py` 포팅)
 *
 * 순수 함수만 — I/O 없음 (단위 테스트 가능).
 *
 * 형태소 분석 대체:
 *   원본은 kiwipiepy(`korean_nlp.extract_nouns`)로 명사를 추출했습니다.
 *   여기서는 형태소 분석기를 재현하지 않고, 2글자 이상 한글 연속 구간을
 *   정규식으로 뽑아 불용어를 거르는 방식으로 대체합니다 (extractTokens).
 *   원본도 명사 매칭 실패 시 substring 폴백을 두고 있어, 도메인 키워드
 *   매칭 결과는 사실상 동일하게 유지됩니다.
 */

// ── 도메인 키워드 테이블 (원본 verbatim) ──

export const SERVICE_TOPICS: Record<string, string[]> = {
  // 비자·체류
  출입국: ["출입국", "체류", "체류자격", "외국인등록", "체류연장", "체류기간"],
  비자: ["비자", "visa", "f-6", "f-4", "f-5", "d-10", "e-7", "귀화", "국적", "영주권", "영주자격"],
  // 인허가
  인허가: [
    "인허가", "허가", "면허", "신고", "건축허가", "영업허가", "영업신고", "사업허가", "개설허가",
    "법인설립", "단체설립", "비영리", "부동산업", "공인중개사", "의료기관", "약국개설",
  ],
  // 계약서·사실조사
  계약서: [
    "계약서", "사실조사", "공증", "확인서", "사실확인", "내용증명", "서류작성", "위임장",
    "행정조사", "사실증명", "진술서", "소명서",
  ],
  // 행정심판·행정소송
  행정심판: [
    "행정심판", "영업정지", "처분취소", "행정소송", "이의신청", "불복청구",
    "음주운전 행정심판", "교통 행정심판", "과징금 취소", "행정처분 취소",
  ],
  // 민원·서류대행
  민원: [
    "민원", "정부24", "권익위", "서류대행", "대행", "민원대행", "제출대행",
    "산재", "보훈", "국가유공자", "고충처리",
  ],
  // 개인정보·AI
  개인정보: ["개인정보", "프라이버시", "개인정보보호", "정보주체", "동의서"],
  AI행정: ["ai", "인공지능", "디지털 전환", "전자정부", "자동화 행정"],
};

export const ALL_REGIONS = ["서울", "부산", "인천", "경기", "대구", "광주", "대전", "울산", "세종"];

export const NEGATIVE_HINTS = ["불만", "비용", "사기", "불신", "비싸", "느리", "불친절", "거절", "반려", "처분", "과태료"];
export const POSITIVE_HINTS = ["추천", "친절", "성공", "만족", "빠른", "해결", "승인", "허가완료", "인정"];
export const QUESTION_HINTS = ["가능", "되나요", "어떻게", "문의", "상담", "방법", "절차", "기간", "비용"];
export const PROMOTION_HINTS = ["성공사례", "전문", "사무소", "상담 안내", "대표", "노하우", "전문가"];
export const COMPETITOR_HINTS = ["행정사", "행정사사무소", "행정사 사무소"];

export const RISK_PATTERNS: [string, string][] = [
  ["과태료", "과태료 부과 위험"],
  ["영업정지", "영업정지 처분 위험"],
  ["처분취소", "행정처분 취소 필요"],
  ["반려", "서류 반려 가능성"],
  ["거절", "허가 거절 위험"],
  ["기간초과", "기간 초과 위험"],
  ["무허가", "무허가 영업 위험"],
  ["불법", "법령 위반 위험"],
  ["사기", "사기 피해 주의"],
  ["위반", "법령 위반 신호"],
];

export const EXAM_KEYWORDS = [
  "시험", "수험", "합격", "1차", "2차", "기출", "모의고사", "교재", "강의",
  "인강", "공부법", "합격수기", "원서접수", "큐넷", "자격시험",
];

// ── 순수 함수 ──

/** 수험/시험 관련 글이면 true (원본 filters.is_exam_related). */
export function isExamRelated(...parts: (string | null | undefined)[]): boolean {
  const text = parts.filter(Boolean).join(" ").toLowerCase();
  return EXAM_KEYWORDS.some((kw) => text.includes(kw.toLowerCase()));
}

/** 조사·접속사 등 의미 없는 토큰 */
const STOPWORDS = new Set([
  "그리고", "그러나", "하지만", "그래서", "때문에", "이것", "저것", "그것",
  "합니다", "입니다", "있습니다", "없습니다", "하는", "되는", "우리", "여기",
  "저희", "관련", "경우", "정도", "가지", "위해", "통해", "대한", "대해",
]);

/**
 * kiwipiepy 명사 추출 대체 — 2글자 이상 한글 연속 구간 + 영숫자 토큰 추출 후 불용어 제거.
 * 형태소 분석이 아니므로 복합어는 분해되지 않습니다 (도메인 매칭엔 substring 폴백이 있어 무해).
 */
export function extractTokens(text: string): string[] {
  const raw = (text || "").match(/[가-힣]{2,}|[a-zA-Z0-9][a-zA-Z0-9-]{1,}/g) ?? [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const t of raw) {
    const token = t.toLowerCase();
    if (STOPWORDS.has(token) || seen.has(token)) continue;
    seen.add(token);
    out.push(token);
  }
  return out;
}

/** 서비스 주제 태그 — 토큰 정확 매칭 후 substring 폴백 (원본 detect_service_tags). */
export function detectTopics(text: string): string[] {
  const tokens = new Set(extractTokens(text));
  const lowered = (text || "").toLowerCase();
  const matches: string[] = [];
  for (const [topic, keywords] of Object.entries(SERVICE_TOPICS)) {
    if (keywords.some((kw) => tokens.has(kw.toLowerCase()))) {
      matches.push(topic);
      continue;
    }
    if (keywords.some((kw) => lowered.includes(kw.toLowerCase()))) {
      matches.push(topic);
    }
  }
  return matches.length > 0 ? matches : ["일반행정"];
}

export function detectRiskFlags(text: string): string[] {
  return RISK_PATTERNS.filter(([pattern]) => (text || "").includes(pattern)).map(([, label]) => label);
}

export function looksLikeCompetitorPublisher(...parts: (string | null | undefined)[]): boolean {
  const text = parts.filter(Boolean).join(" ").toLowerCase();
  return COMPETITOR_HINTS.some((token) => text.includes(token.toLowerCase()));
}

/** 경쟁사 식별 키 정규화 — URL 스킴/네이버 블로그 호스트 제거 (원본 normalize_competitor_key). */
export function normalizeCompetitorKey(
  publisherBlogName: string | null | undefined,
  publisherName: string | null | undefined
): string | null {
  let base = (publisherBlogName || publisherName || "").trim().toLowerCase();
  if (!base) return null;
  for (const prefix of ["https://www.", "http://www.", "https://", "http://"]) {
    if (base.startsWith(prefix)) {
      base = base.slice(prefix.length);
      break;
    }
  }
  for (const host of ["blog.naver.com/", "m.blog.naver.com/"]) {
    if (base.startsWith(host)) {
      base = base.slice(host.length);
      break;
    }
  }
  base = base.split("?")[0].replace(/\/+$/, "");
  return base.replace(/\//g, "-").replace(/ /g, "-") || null;
}

export type DocType = "수험/시험 글" | "후기/불만/상담 글" | "경쟁사 홍보 글" | "제도/정책/뉴스 글" | "업무 설명 글";
export type Sentiment = "positive" | "negative" | "neutral";

export type ClassificationInput = {
  title: string;
  snippet: string;
  publisher?: string | null;
  publisherBlogName?: string | null;
  sourceType?: string | null;
};

export type ClassificationResult = {
  docType: DocType;
  sentiment: Sentiment;
  topics: string[];
  regions: string[];
  riskFlags: string[];
  isExamRelated: boolean;
  isRelevant: boolean;
  /**
   * 경쟁사로 식별된 발행처명 (없으면 null).
   * 주의: docType과 독립입니다. 원본과 동일하게 QUESTION_HINTS("상담" 등)가
   * 먼저 매칭되면 경쟁사 블로그 글이라도 docType은 "후기/불만/상담 글"이 됩니다.
   * 따라서 경쟁사 여부 판정은 docType이 아니라 이 필드를 봐야 합니다.
   */
  competitorName: string | null;
};

/** 문서 분류 (원본 classify_document). 수험 글은 즉시 제외 처리. */
export function classifyDocument(input: ClassificationInput): ClassificationResult {
  const { title, snippet, publisher, publisherBlogName, sourceType } = input;
  const text = `${title ?? ""} ${snippet ?? ""}`;
  const lowered = text.toLowerCase();
  const topics = detectTopics(text);

  if (isExamRelated(title, snippet)) {
    return {
      docType: "수험/시험 글",
      sentiment: "neutral",
      topics,
      regions: [],
      riskFlags: ["exam_related"],
      isExamRelated: true,
      isRelevant: false,
      competitorName: null,
    };
  }

  const isCompetitorPublisher = looksLikeCompetitorPublisher(publisher, publisherBlogName);

  let docType: DocType;
  if (QUESTION_HINTS.some((t) => lowered.includes(t))) {
    docType = "후기/불만/상담 글";
  } else if (sourceType === "blog" && isCompetitorPublisher) {
    docType = "경쟁사 홍보 글";
  } else if (PROMOTION_HINTS.some((t) => lowered.includes(t))) {
    docType = "경쟁사 홍보 글";
  } else if (text.includes("정부24") || text.includes("정책") || text.includes("위원회") || text.includes("기사")) {
    docType = "제도/정책/뉴스 글";
  } else {
    docType = "업무 설명 글";
  }

  let sentiment: Sentiment;
  if (NEGATIVE_HINTS.some((t) => lowered.includes(t))) sentiment = "negative";
  else if (POSITIVE_HINTS.some((t) => lowered.includes(t))) sentiment = "positive";
  else sentiment = "neutral";

  // 원본과 동일: blog + 경쟁사 발행처면 intent와 무관하게 경쟁사로 식별.
  // 그 외에도 홍보 글로 분류됐다면 발행처를 경쟁사명으로 사용.
  let competitorName: string | null = null;
  if (sourceType === "blog" && isCompetitorPublisher) competitorName = publisher ?? null;
  else if (docType === "경쟁사 홍보 글") competitorName = publisher ?? null;

  return {
    docType,
    sentiment,
    topics,
    regions: ALL_REGIONS.filter((r) => text.includes(r)),
    riskFlags: detectRiskFlags(text),
    isExamRelated: false,
    isRelevant: true,
    competitorName,
  };
}

/**
 * 인기도 점수 [0, 1] — 신선도 + 채널 가중 + 쿼리 커버리지.
 * (원본 popularity.compute_popularity_score 의 축약: 내부 클릭/트렌드 성장 신호는
 *  admin-system에 대응 데이터가 없어 제외)
 */
export function popularityScore(doc: {
  publishedAt?: Date | null;
  sourceType?: string | null;
  queryCoverage?: number;
}): number {
  const published = doc.publishedAt ?? null;
  let freshness = 0.3;
  if (published) {
    const ageDays = (Date.now() - published.getTime()) / 86_400_000;
    if (ageDays <= 7) freshness = 1.0;
    else if (ageDays <= 30) freshness = 0.7;
    else if (ageDays <= 90) freshness = 0.4;
    else freshness = 0.15;
  }
  const channelWeight = doc.sourceType === "blog" ? 0.9 : doc.sourceType === "news" ? 0.8 : 0.65;
  const coverage = doc.queryCoverage ?? 0.75;
  const score = freshness * 0.5 + channelWeight * 0.3 + coverage * 0.2;
  return Math.round(Math.min(Math.max(score, 0), 1) * 10000) / 10000;
}
