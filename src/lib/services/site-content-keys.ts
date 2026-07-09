/**
 * 사이트 콘텐츠 CMS — 편집 가능한 문자열 레지스트리.
 *
 * 기존 site-settings.ts와 별개 네임스페이스(`.` 구분자 사용)로 SiteSetting 테이블에 저장합니다.
 * 관리자 UI(/admin/content-editor)에서 인라인 편집, 저장 시 즉시 반영됩니다.
 */

export type ContentType = "text" | "html" | "url";

export type ContentKeyDefinition = {
  key: string;
  section: string;
  label: string;
  type: ContentType;
  default: string;
  hint?: string;
};

export const CONTENT_KEYS: readonly ContentKeyDefinition[] = [
  // 홈 히어로
  {
    key: "home.hero.title",
    section: "홈 · 히어로",
    label: "히어로 제목",
    type: "text",
    default: "비자 거절, 행정처분, 인허가 —\n2주 안에 해결 방향을 드립니다",
    hint: "줄바꿈은 Enter"
  },
  {
    key: "home.hero.subtitle",
    section: "홈 · 히어로",
    label: "히어로 부제",
    type: "text",
    default: "행정 문제 뒤에 있는 사람의 마음까지 함께 헤아립니다."
  },
  {
    key: "home.hero.badge",
    section: "홈 · 히어로",
    label: "히어로 배지",
    type: "text",
    default: "행정사 사무소 · Logos · Pathos · Ethos"
  },
  {
    key: "home.cta.label",
    section: "홈 · CTA",
    label: "메인 CTA 버튼 문구",
    type: "text",
    default: "무료 검토 요청"
  },
  {
    key: "home.cta.secondary",
    section: "홈 · CTA",
    label: "서브 CTA 버튼 문구",
    type: "text",
    default: "상담 예약"
  },
  {
    key: "home.deadline_strip.title",
    section: "홈 · 상단 스트립",
    label: "긴급 스트립 문구",
    type: "text",
    default: "행정심판 청구기한 90일 · 이의신청 60일"
  },
  {
    key: "home.deadline_strip.subtitle",
    section: "홈 · 상단 스트립",
    label: "긴급 스트립 부연",
    type: "text",
    default: "기한이 지나면 구제가 어렵습니다."
  },
  // 서비스 페이지 짧은 문구
  {
    key: "services.section.title",
    section: "서비스",
    label: "서비스 섹션 제목",
    type: "text",
    default: "우리가 하는 일"
  },
  {
    key: "services.section.subtitle",
    section: "서비스",
    label: "서비스 섹션 부제",
    type: "text",
    default: "5개 전문 분야에서 실무 중심으로 안내합니다."
  },
  // 푸터
  {
    key: "footer.tagline",
    section: "푸터",
    label: "푸터 태그라인",
    type: "text",
    default: "절차에는 이성을, 사람에게는 공감을, 일에는 신뢰를."
  },
  {
    key: "footer.copyright",
    section: "푸터",
    label: "저작권 문구",
    type: "text",
    default: "© ETHOS 행정사사무소"
  },
  // 연락처 (푸터/컨택 페이지)
  {
    key: "contact.info.phone_label",
    section: "연락처",
    label: "전화 라벨",
    type: "text",
    default: "대표 전화"
  },
  {
    key: "contact.info.email_label",
    section: "연락처",
    label: "이메일 라벨",
    type: "text",
    default: "이메일 문의"
  },
  {
    key: "contact.info.hours_note",
    section: "연락처",
    label: "운영시간 안내",
    type: "text",
    default: "영업일 24시간 내 회신 · 야간 문의는 다음 영업일 오전 회신"
  },
  {
    key: "contact.info.consult_url",
    section: "연락처",
    label: "상담 예약 URL",
    type: "url",
    default: "/consult"
  }
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

export function groupContentKeys(): Record<string, ContentKeyDefinition[]> {
  const out: Record<string, ContentKeyDefinition[]> = {};
  for (const k of CONTENT_KEYS) {
    (out[k.section] ??= []).push(k);
  }
  return out;
}
