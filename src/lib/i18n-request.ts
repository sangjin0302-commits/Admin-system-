import { headers } from "next/headers";
import { LOCALE_HEADER, normalizeLocale, type PublicLocale } from "@/lib/i18n-locale";

/**
 * 서버 컴포넌트에서 현재 요청의 공개 로케일 판별(경로기반).
 *
 * 미들웨어가 `/en/*` 요청을 rewrite 하며 x-ethos-locale 헤더를 주입한다.
 * 이를 우선 읽고, 없으면 레거시 `?lang=en` 쿼리로 폴백(마이그레이션 과도기 호환).
 *
 * 주의: headers()/searchParams 읽기는 동적 렌더를 유발한다. ISR 정적화는 후속
 * 단계(로케일별 정적 경로)에서 처리 — 이 헬퍼는 과도기용 통합 판별점이다.
 */
export async function getRequestLocale(legacyLangParam?: string): Promise<PublicLocale> {
  try {
    const h = await headers();
    const fromHeader = h.get(LOCALE_HEADER);
    if (fromHeader) return normalizeLocale(fromHeader);
  } catch {
    /* headers() 사용 불가 컨텍스트 → 폴백 */
  }
  return normalizeLocale(legacyLangParam);
}
