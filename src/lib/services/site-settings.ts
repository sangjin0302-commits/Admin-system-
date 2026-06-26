/**
 * 사이트 운영 설정 (관리자가 직접 편집하는 홈페이지 컨텐츠).
 *
 * DB(SiteSetting) 우선, 없으면 DEFAULT 사용 → 관리자가 비워두면 자동으로 기본값.
 */

import { prisma } from "@/lib/prisma/client";

export type SiteSettingsKey =
  | "home.heroBadge"
  | "home.heroTitle"
  | "home.heroDescription"
  | "home.noticeBanner"
  | "home.brandStory"
  | "home.faq"
  | "about.greeting"
  | "contact.phone"
  | "contact.email"
  | "contact.address"
  | "contact.hours"
  | "contact.kakaoUrl"
  | "naver.blogId" // 네이버 블로그 ID (RSS 연동)
  | "analytics.gaId"
  | "seo.googleVerification"
  | "seo.naverVerification"
  | "home.stat1"
  | "home.stat2"
  | "home.stat3"
  | "home.stat4"
  | "services.immigration.desc"
  | "services.appeal.desc"
  | "services.contract.desc"
  | "services.license.desc"
  | "services.corporate.desc"
  | "payment.bankName"        // 계좌이체용 은행명
  | "payment.accountNumber"   // 계좌번호
  | "payment.accountHolder";  // 예금주

export const SITE_SETTINGS_DEFAULTS: Record<SiteSettingsKey, string> = {
  "home.heroBadge": "행정사 사무소 · Logos · Pathos · Ethos",
  "home.heroTitle": "",
  "home.heroDescription":
    "비자/외국인 체류, 행정심판, 계약서·사실조사, 인허가 — 행정 문제 뒤에 있는 사람의 마음까지 함께 헤아립니다.",
  "home.noticeBanner": "",
  "home.brandStory": "",
  "home.faq": "",
  "about.greeting":
    "행정 문제는 단순히 서류를 작성하고 절차를 밟는 일만은 아닙니다. 그 안에는 누군가의 생계, 체류, 권리, 가족, 사업, 그리고 앞으로의 삶이 함께 담겨 있습니다.",
  "contact.phone": "02-0000-0000",
  "contact.email": "a.attorneyjean@gmail.com",
  "contact.address": "서울 동대문구 (비상주 · 전국 비대면 가능)",
  "contact.hours": "평일 09:00 - 18:00",
  "contact.kakaoUrl": "http://pf.kakao.com/_xnQLnX",
  "naver.blogId": "attorney_jean",
  "analytics.gaId": "",
  "seo.googleVerification": "",
  "seo.naverVerification": "",
  "home.stat1": "2년+ 대사관 비자 실무 | 주한 대사관 비자·출입국 경력",
  "home.stat2": "3개 언어 | 한국어·영어·아랍어 응대",
  "home.stat3": "5대 전문 분야 | 비자·심판·계약·인허가·법인설립",
  "home.stat4": "24h 검토 회신 | 영업일 기준 무료 검토",
  "services.immigration.desc": "",
  "services.appeal.desc": "",
  "services.contract.desc": "",
  "services.license.desc": "",
  "services.corporate.desc": "",
  "payment.bankName": "",
  "payment.accountNumber": "",
  "payment.accountHolder": "행정사 Jean"
};

export const SITE_SETTINGS_LABELS: Record<SiteSettingsKey, { label: string; hint?: string; multiline?: boolean }> = {
  "home.heroBadge": { label: "홈 상단 배지 문구" },
  "home.heroTitle": { label: "홈 대표 제목", hint: "비우면 기본 제목. 줄바꿈은 Enter로 (각 줄이 한 행)", multiline: true },
  "home.heroDescription": { label: "홈 히어로 소개글", multiline: true },
  "home.noticeBanner": { label: "공지 배너 (비우면 숨김)", hint: "전 페이지 상단에 표시되는 공지", multiline: true },
  "home.brandStory": { label: "홈 Brand Story 본문", hint: "비우면 기본 문구. 빈 줄로 문단 구분", multiline: true },
  "home.faq": { label: "홈 자주 묻는 질문", hint: "한 줄에 'Q :: A' 형식. 한 줄 = 한 문답. 비우면 기본 FAQ", multiline: true },
  "about.greeting": { label: "사무소 소개 인사말", multiline: true },
  "contact.phone": { label: "대표 전화" },
  "contact.email": { label: "이메일" },
  "contact.address": { label: "사무소 주소" },
  "contact.hours": { label: "운영시간" },
  "contact.kakaoUrl": { label: "카카오 채널 URL" },
  "naver.blogId": {
    label: "네이버 블로그 ID",
    hint: "blog.naver.com/<ID> 의 ID만 입력하면 칼럼 페이지에 자동 연동됩니다"
  },
  "analytics.gaId": { label: "Google Analytics ID", hint: "예: G-XXXXXXXXXX (방문 통계 측정)" },
  "seo.googleVerification": { label: "Google 사이트 인증코드", hint: "Search Console 소유확인 meta content 값" },
  "seo.naverVerification": { label: "네이버 사이트 인증코드", hint: "네이버 서치어드바이저 소유확인 content 값" },
  "home.stat1": { label: "홈 통계 ①", hint: "형식: 숫자+단위 | 제목 | 설명  (예: 500+ 처리 사건 | 비자·심판 분야)" },
  "home.stat2": { label: "홈 통계 ②", hint: "형식: 숫자+단위 | 제목 | 설명" },
  "home.stat3": { label: "홈 통계 ③", hint: "형식: 숫자+단위 | 제목 | 설명" },
  "home.stat4": { label: "홈 통계 ④", hint: "형식: 숫자+단위 | 제목 | 설명" },
  "services.immigration.desc": { label: "서비스: 비자/체류 소개글", hint: "비우면 기본 문구 사용", multiline: true },
  "services.appeal.desc": { label: "서비스: 행정심판 소개글", hint: "비우면 기본 문구 사용", multiline: true },
  "services.contract.desc": { label: "서비스: 계약서/사실조사 소개글", hint: "비우면 기본 문구 사용", multiline: true },
  "services.license.desc": { label: "서비스: 인허가 소개글", hint: "비우면 기본 문구 사용", multiline: true },
  "services.corporate.desc": { label: "서비스: 법인 설립 소개글", hint: "비우면 기본 문구 사용", multiline: true },
  "payment.bankName": { label: "결제: 은행명", hint: "예: 국민은행, 우리은행 (계좌이체 안내용)" },
  "payment.accountNumber": { label: "결제: 계좌번호", hint: "예: 123-456-789012" },
  "payment.accountHolder": { label: "결제: 예금주", hint: "예: 행정사 Jean / 김OO" }
};

// 짧은 인메모리 캐시 — 공개 페이지 다발 조회 시 DB 부하↓ (편집은 저장 시 무효화)
let _cache: { at: number; data: Record<SiteSettingsKey, string> } | null = null;
const CACHE_MS = 8000;

export function invalidateSiteSettingsCache() {
  _cache = null;
}

/** 전체 설정 조회 (DB + 기본값 병합, 캐시). */
export async function getSiteSettings(): Promise<Record<SiteSettingsKey, string>> {
  if (_cache && Date.now() - _cache.at < CACHE_MS) return _cache.data;

  const rows = await prisma.siteSetting.findMany().catch(() => []);
  const map: Record<string, string> = { ...SITE_SETTINGS_DEFAULTS };
  for (const row of rows) {
    if (row.key in SITE_SETTINGS_DEFAULTS) {
      map[row.key] = row.value; // 빈 문자열도 명시적 저장값 반영 (공지 숨김 등)
    }
  }
  const data = map as Record<SiteSettingsKey, string>;
  _cache = { at: Date.now(), data };
  return data;
}

/** 단일 키 조회. */
export async function getSiteSetting(key: SiteSettingsKey): Promise<string> {
  const row = await prisma.siteSetting.findUnique({ where: { key } }).catch(() => null);
  if (row && row.value !== "") return row.value;
  if (row && key === "home.noticeBanner") return row.value; // 공지는 빈값 허용
  return SITE_SETTINGS_DEFAULTS[key];
}

/** 일괄 저장. */
export async function saveSiteSettings(
  values: Partial<Record<SiteSettingsKey, string>>,
  updatedBy?: string
): Promise<void> {
  const entries = Object.entries(values) as [SiteSettingsKey, string][];
  await Promise.all(
    entries
      .filter(([key]) => key in SITE_SETTINGS_DEFAULTS)
      .map(([key, value]) =>
        prisma.siteSetting.upsert({
          where: { key },
          create: { key, value, updatedBy: updatedBy ?? null },
          update: { value, updatedBy: updatedBy ?? null }
        })
      )
  );
  invalidateSiteSettingsCache(); // 저장 즉시 반영
}
