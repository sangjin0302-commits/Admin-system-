/**
 * 사이트 정식 URL 단일 소스.
 *
 * 반드시 호출 시점에 env를 읽는다 — 모듈 레벨 const로 캐시하면 Vercel 빌드 캐시가
 * 빈 값을 고정시킬 수 있음.
 */
const DEFAULT_SITE_URL = "https://ethosattorney.com";

export function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (raw) {
    try {
      new URL(raw);
      return raw;
    } catch {
      // 잘못된 값이면 기본값으로 폴백
    }
  }
  return DEFAULT_SITE_URL;
}
