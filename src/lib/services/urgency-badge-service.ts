/**
 * 긴급 뱃지 소재 게이트 서비스 (v6.4 §9-6)
 *
 * 실제 법정 기한이 존재하는 카테고리에서만 긴급 뱃지를 노출한다.
 * "지금 신청 안 하면 손해" 류 마케팅 남용 방지.
 */

export const URGENT_CATEGORIES = ["visa", "appeal"] as const;
export type UrgentCategory = (typeof URGENT_CATEGORIES)[number];

function normalize(category: string | null | undefined): string {
  return (category ?? "").toLowerCase();
}

/** 해당 카테고리에서 긴급 뱃지를 노출해도 되는지 여부. */
export function shouldShowUrgencyBadge(category: string | null | undefined): boolean {
  const c = normalize(category);
  return (URGENT_CATEGORIES as readonly string[]).includes(c);
}

/** 카테고리별 긴급 뱃지 문구. 미해당 카테고리는 null. */
export function getUrgencyText(category: string | null | undefined): string | null {
  const c = normalize(category);
  if (c === "visa") return "만료 D-30 주의";
  if (c === "appeal") return "청구 기한 90일";
  return null;
}
