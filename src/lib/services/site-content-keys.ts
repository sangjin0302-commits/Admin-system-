/**
 * 사이트 콘텐츠 CMS — 편집 가능한 문자열 레지스트리.
 *
 * 기존 site-settings.ts와 별개 네임스페이스(`.` 구분자 사용)로 SiteSetting 테이블에 저장합니다.
 * 관리자 UI(/admin/content-editor)에서 인라인 편집, 저장 시 즉시 반영됩니다.
 *
 * 주의: 여기 정의된 키만 편집기에 노출됩니다. 실제 페이지에서 소비(getContentBatch/getContent
 * 또는 동일 SiteSetting 행을 읽는 getSiteSetting)되지 않는 "죽은 키"는 편집해도 아무 효과가
 * 없어 관리자에게 혼란을 주므로 제거합니다. 키 추가 시 반드시 소비처를 함께 배선하세요.
 */

export type ContentType = "text" | "html" | "url" | "image";

export type ContentKeyDefinition = {
  key: string;
  section: string;
  label: string;
  type: ContentType;
  default: string;
  hint?: string;
};

const BASE_KEYS: ContentKeyDefinition[] = [
  // 홈 CTA — page.tsx getContentBatch 에서 소비
  { key: "home.cta.label", section: "홈 · CTA", label: "메인 CTA 버튼 문구", type: "text", default: "무료 검토 요청" },
  // 홈 상단 스트립 — page.tsx 에서 렌더
  { key: "home.deadline_strip.title", section: "홈 · 상단 스트립", label: "긴급 스트립 문구", type: "text", default: "행정심판 청구기한 90일 · 이의신청 60일" },
  { key: "home.deadline_strip.subtitle", section: "홈 · 상단 스트립", label: "긴급 스트립 부연", type: "text", default: "기한이 지나면 구제가 어렵습니다." },
  // 푸터 — page.tsx getContentBatch 에서 소비
  { key: "footer.tagline", section: "푸터", label: "푸터 태그라인", type: "text", default: "절차에는 이성을, 사람에게는 공감을, 일에는 신뢰를." }
];

const ABOUT_KEYS: ContentKeyDefinition[] = [
  // about/page.tsx 가 getSiteSetting 으로 동일 SiteSetting 행을 읽으므로 편집이 실제 반영됨.
  { key: "about.greeting", section: "소개 · About", label: "대표 인사말", type: "text", default: "안녕하세요. ETHOS 대표 행정사입니다. 절차의 이성과 사람의 공감을 함께 담아 일합니다.", hint: "줄바꿈 지원" },
  { key: "about.brandStory.eyebrow", section: "소개 · 로고·브랜드 스토리", label: "섹션 상단 라벨 (Eyebrow)", type: "text", default: "", hint: "예: Brand Story / 로고 이야기 — 비워두면 섹션 자체가 숨겨집니다." },
  { key: "about.brandStory.title", section: "소개 · 로고·브랜드 스토리", label: "헤드라인", type: "text", default: "", hint: "로고와 철학을 아우르는 한 줄 헤드라인" },
  { key: "about.brandStory.body", section: "소개 · 로고·브랜드 스토리", label: "본문", type: "text", default: "", hint: "여러 문단 가능. 줄바꿈은 Enter (Enter 두번 = 문단 구분)" },
  { key: "about.brandStory.logoNote", section: "소개 · 로고·브랜드 스토리", label: "로고 아래 캡션", type: "text", default: "", hint: "로고 이미지 아래 작은 설명 (예: 로고 상징·색·서체 의미)" }
];

export const CONTENT_KEYS: readonly ContentKeyDefinition[] = [
  ...BASE_KEYS,
  ...ABOUT_KEYS
] as const;

export const CONTENT_KEY_MAP: Map<string, ContentKeyDefinition> = new Map(
  CONTENT_KEYS.map((c) => [c.key, c])
);

export function getContentDefault(key: string): string {
  return CONTENT_KEY_MAP.get(key)?.default ?? "";
}

export function isValidContentKey(key: string): boolean {
  return CONTENT_KEY_MAP.has(key);
}

export function getContentType(key: string): ContentType | undefined {
  return CONTENT_KEY_MAP.get(key)?.type;
}

export function groupContentKeys(): Record<string, ContentKeyDefinition[]> {
  const out: Record<string, ContentKeyDefinition[]> = {};
  for (const k of CONTENT_KEYS) {
    (out[k.section] ??= []).push(k);
  }
  return out;
}
