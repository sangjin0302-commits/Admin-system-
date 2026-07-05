import { getTaxPartnerStats, listReferrals } from "@/lib/services/tax-partner-referral-service";
import { TaxPartnersAdminClient } from "./client";

export const dynamic = "force-dynamic";

export default async function AdminTaxPartnersPage() {
  const [stats, referrals] = await Promise.all([getTaxPartnerStats(), listReferrals()]);
  return (
    <section className="rounded-[20px] border border-line bg-surface px-5 py-6 shadow-panel sm:px-7">
      <p className="ui-kicker">Partnerships</p>
      <h2 className="mt-2 text-xl font-semibold text-text-strong">세무사 연계</h2>
      <p className="mt-2 text-sm text-text-muted">
        파트너 세무사를 관리하고 사건에 맞는 세무사를 매칭합니다.
      </p>
      <div className="mt-6">
        <TaxPartnersAdminClient initialStats={stats} initialReferrals={referrals} />
      </div>
    </section>
  );
}
