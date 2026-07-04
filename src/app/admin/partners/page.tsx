import { getPartnerStats, listCommissions } from "@/lib/services/partner-referral-service";
import { PartnersAdminClient } from "./client";

export const dynamic = "force-dynamic";

export default async function AdminPartnersPage() {
  const [stats, commissions] = await Promise.all([getPartnerStats(), listCommissions()]);
  return (
    <section className="rounded-[20px] border border-line bg-surface px-5 py-6 shadow-panel sm:px-7">
      <p className="ui-kicker">Growth</p>
      <h2 className="mt-2 text-xl font-semibold text-text-strong">파트너 관리</h2>
      <p className="mt-2 text-sm text-text-muted">
        파트너 승인, 추천 코드, 수수료 지급을 관리합니다.
      </p>
      <div className="mt-6">
        <PartnersAdminClient initialStats={stats} initialCommissions={commissions} />
      </div>
    </section>
  );
}
