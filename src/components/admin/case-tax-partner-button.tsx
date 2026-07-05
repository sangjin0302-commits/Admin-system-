import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { caseHasTaxSignal } from "@/lib/services/tax-partner-referral-service";

/**
 * 사건 상세에서 "세무사 소개" 버튼. 다음 조건 모두 만족 시에만 노출:
 *  - feature flag tax_partner_referral 활성
 *  - category === "법인" (또는 "CORPORATE"/"CORPORATION")
 *  - 요약/제목에 세무 신호 키워드
 */
export async function CaseTaxPartnerButton(props: {
  category: string | null | undefined;
  text: string | null | undefined;
}) {
  if (!(await isFeatureEnabled("tax_partner_referral"))) return null;
  const cat = (props.category ?? "").toUpperCase();
  const isCorporate = cat.includes("법인") || cat.includes("CORPOR");
  if (!isCorporate) return null;
  if (!caseHasTaxSignal(props.text)) return null;
  return (
    <a
      href="/admin/tax-partners"
      className="inline-flex h-10 items-center rounded-lg border border-gold/40 bg-surface px-4 text-sm font-medium text-primary transition hover:bg-gold-soft/30"
    >
      세무사 소개
    </a>
  );
}
