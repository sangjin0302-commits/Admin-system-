/**
 * 사이트 콘텐츠 CMS — 편집 가능한 문자열 레지스트리.
 *
 * 기존 site-settings.ts와 별개 네임스페이스(`.` 구분자 사용)로 SiteSetting 테이블에 저장합니다.
 * 관리자 UI(/admin/content-editor)에서 인라인 편집, 저장 시 즉시 반영됩니다.
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

// 서비스 페이지 헬퍼: page × 6 keys
type ServicePageSpec = {
  slug: string;
  section: string;
  heroTitle: string;
  heroSubtitle: string;
  intro: string;
  benefits: string;
  ctaLabel: string;
  ctaNote: string;
};

const SERVICE_PAGES: ServicePageSpec[] = [
  {
    slug: "tax",
    section: "서비스 · 조세",
    heroTitle: "조세 불복 —\n부과처분에 흔들리지 않게",
    heroSubtitle: "이의신청·심사청구·심판청구 절차를 처음부터 함께 설계합니다.",
    intro: "국세·지방세 부과처분에 대해 90일 내 대응이 관건입니다. 사실관계와 세법 쟁점을 분리해 승산을 먼저 계산합니다.",
    benefits: "• 이의신청/심판청구 기한 관리\n• 쟁점별 판례 요약\n• 서면·의견진술 리허설",
    ctaLabel: "조세 불복 무료 검토",
    ctaNote: "1영업일 내 회신 · 자료가 없어도 상담 가능"
  },
  {
    slug: "admin-appeal",
    section: "서비스 · 행정심판",
    heroTitle: "행정심판 —\n90일 안에 방향을 잡아드립니다",
    heroSubtitle: "인허가·처분 취소·의무이행 등 행정심판 전 과정 대리.",
    intro: "행정심판은 소송보다 빠르고 비용이 낮지만 청구서 완성도가 결과를 좌우합니다. 실무 감각으로 접근합니다.",
    benefits: "• 청구기한 자동 계산\n• 처분사유 반박 논리 구성\n• 증거·참고자료 편철",
    ctaLabel: "행정심판 무료 검토",
    ctaNote: "청구기한(90일) 임박 건 우선 회신"
  },
  {
    slug: "objection",
    section: "서비스 · 이의신청",
    heroTitle: "이의신청 —\n처분 60일 내 첫 반격",
    heroSubtitle: "행정처분 통지 직후 대응이 결정적입니다.",
    intro: "이의신청은 상급심 절차의 초석입니다. 초기 서면에서 다투지 않은 쟁점은 이후 되살리기 어렵습니다.",
    benefits: "• 처분사유 정면 반박\n• 재량권 일탈·남용 검토\n• 증거 우선순위 판단",
    ctaLabel: "이의신청 무료 검토",
    ctaNote: "60일 기한 임박 건 24시간 내 회신"
  },
  {
    slug: "petition",
    section: "서비스 · 청원",
    heroTitle: "청원·민원 —\n행정을 움직이는 정공법",
    heroSubtitle: "국민권익위·감사원·지자체 청원까지 서식과 논리를 함께.",
    intro: "청원은 절차 하자를 지적하고 재량을 이끌어내는 도구입니다. 감정이 아닌 사실과 근거로 씁니다.",
    benefits: "• 수신기관 선택 자문\n• 청원서 초안 대필\n• 후속 민원·감사 연계",
    ctaLabel: "청원 무료 검토",
    ctaNote: "사안 요약만 있어도 검토 가능"
  }
];

function serviceKeys(): ContentKeyDefinition[] {
  const out: ContentKeyDefinition[] = [];
  for (const p of SERVICE_PAGES) {
    out.push(
      { key: `services.${p.slug}.hero_title`, section: p.section, label: "히어로 제목", type: "text", default: p.heroTitle, hint: "줄바꿈은 Enter" },
      { key: `services.${p.slug}.hero_subtitle`, section: p.section, label: "히어로 부제", type: "text", default: p.heroSubtitle },
      { key: `services.${p.slug}.intro`, section: p.section, label: "인트로 문단", type: "text", default: p.intro },
      { key: `services.${p.slug}.benefits`, section: p.section, label: "혜택/기대효과", type: "text", default: p.benefits, hint: "각 줄 앞에 · 또는 •" },
      { key: `services.${p.slug}.cta_label`, section: p.section, label: "CTA 버튼 문구", type: "text", default: p.ctaLabel },
      { key: `services.${p.slug}.cta_note`, section: p.section, label: "CTA 부연", type: "text", default: p.ctaNote }
    );
  }
  return out;
}

const BASE_KEYS: ContentKeyDefinition[] = [
  // 홈 히어로
  { key: "home.hero.title", section: "홈 · 히어로", label: "히어로 제목", type: "text", default: "비자 거절, 행정처분, 인허가 —\n방향은 빠르게, 판단은 사안별로 드립니다", hint: "줄바꿈은 Enter" },
  { key: "home.hero.subtitle", section: "홈 · 히어로", label: "히어로 부제", type: "text", default: "행정 문제 뒤에 있는 사람의 마음까지 함께 헤아립니다." },
  { key: "home.hero.badge", section: "홈 · 히어로", label: "히어로 배지", type: "text", default: "행정사 사무소 · Logos · Pathos · Ethos" },
  { key: "home.cta.label", section: "홈 · CTA", label: "메인 CTA 버튼 문구", type: "text", default: "무료 검토 요청" },
  { key: "home.cta.secondary", section: "홈 · CTA", label: "서브 CTA 버튼 문구", type: "text", default: "상담 예약" },
  { key: "home.deadline_strip.title", section: "홈 · 상단 스트립", label: "긴급 스트립 문구", type: "text", default: "행정심판 청구기한 90일 · 이의신청 60일" },
  { key: "home.deadline_strip.subtitle", section: "홈 · 상단 스트립", label: "긴급 스트립 부연", type: "text", default: "기한이 지나면 구제가 어렵습니다." },
  // 서비스 섹션 (홈 카드 그리드)
  { key: "services.section.title", section: "서비스", label: "서비스 섹션 제목", type: "text", default: "우리가 하는 일" },
  { key: "services.section.subtitle", section: "서비스", label: "서비스 섹션 부제", type: "text", default: "5개 전문 분야에서 실무 중심으로 안내합니다." },
  // 푸터
  { key: "footer.tagline", section: "푸터", label: "푸터 태그라인", type: "text", default: "절차에는 이성을, 사람에게는 공감을, 일에는 신뢰를." },
  { key: "footer.copyright", section: "푸터", label: "저작권 문구", type: "text", default: "© ETHOS 행정사사무소" },
  // 연락처 (푸터/컨택 페이지)
  { key: "contact.info.phone_label", section: "연락처", label: "전화 라벨", type: "text", default: "대표 전화" },
  { key: "contact.info.email_label", section: "연락처", label: "이메일 라벨", type: "text", default: "이메일 문의" },
  { key: "contact.info.hours_note", section: "연락처", label: "운영시간 안내", type: "text", default: "영업일 24시간 내 회신 · 야간 문의는 다음 영업일 오전 회신" },
  { key: "contact.info.consult_url", section: "연락처", label: "상담 예약 URL", type: "url", default: "/consult" }
];

const ABOUT_KEYS: ContentKeyDefinition[] = [
  { key: "about.greeting", section: "소개 · About", label: "대표 인사말", type: "text", default: "안녕하세요. ETHOS 대표 행정사입니다. 절차의 이성과 사람의 공감을 함께 담아 일합니다.", hint: "줄바꿈 지원" },
  { key: "about.philosophy", section: "소개 · About", label: "철학·가치", type: "text", default: "Logos(논리) · Pathos(공감) · Ethos(신뢰) — 세 축이 흔들리지 않도록 실무를 설계합니다." },
  { key: "about.career", section: "소개 · About", label: "대표 경력·이력", type: "text", default: "• 행정사 자격\n• 조세·행정심판 실무 경력\n• 다국적 클라이언트 대응 경험" }
];

const CONTACT_PAGE_KEYS: ContentKeyDefinition[] = [
  { key: "contact.page.location", section: "연락처 · 페이지", label: "위치 안내", type: "text", default: "서울시 강남구 (지하철 강남역 5번 출구 도보 5분)" },
  { key: "contact.page.parking", section: "연락처 · 페이지", label: "주차 안내", type: "text", default: "건물 지하 주차장 이용 가능 · 방문 시 사전 안내 부탁드립니다." },
  { key: "contact.page.directions", section: "연락처 · 페이지", label: "오시는 길", type: "text", default: "지하철·버스·자가용 경로 안내. 방문 전 예약을 권장합니다." }
];

const IMAGE_KEYS: ContentKeyDefinition[] = [
  { key: "images.home.hero_bg", section: "이미지 · 홈", label: "홈 히어로 배경 이미지", type: "image", default: "" },
  { key: "images.about.about_photo", section: "이미지 · 소개", label: "소개 페이지 대표 사진", type: "image", default: "" },
  { key: "images.about.team_photo", section: "이미지 · 소개", label: "팀 단체 사진", type: "image", default: "" },
  { key: "images.services.tax_bg", section: "이미지 · 서비스", label: "조세 페이지 배경", type: "image", default: "" },
  { key: "images.services.admin_appeal_bg", section: "이미지 · 서비스", label: "행정심판 페이지 배경", type: "image", default: "" },
  { key: "images.services.objection_bg", section: "이미지 · 서비스", label: "이의신청 페이지 배경", type: "image", default: "" },
  { key: "images.services.petition_bg", section: "이미지 · 서비스", label: "청원 페이지 배경", type: "image", default: "" }
];

export const CONTENT_KEYS: readonly ContentKeyDefinition[] = [
  ...BASE_KEYS,
  ...serviceKeys(),
  ...ABOUT_KEYS,
  ...CONTACT_PAGE_KEYS,
  ...IMAGE_KEYS
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
