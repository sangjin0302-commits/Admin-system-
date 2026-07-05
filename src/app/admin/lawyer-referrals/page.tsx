import { listPartners, listReferrals, totalCommissions } from "@/lib/services/lawyer-referral-service";
import { LawyerReferralsClient } from "./client";

export const dynamic = "force-dynamic";
export const metadata = { title: "변호사 소개 관리 · Admin" };

export default async function AdminLawyerReferralsPage() {
  const [partners, referrals, commissions] = await Promise.all([
    listPartners(), listReferrals(), totalCommissions(),
  ]);
  return (
    <section className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="font-serif text-2xl font-bold text-primary">변호사 소개 · 커미션</h1>
      <p className="mt-2 text-sm text-text-muted">파트너 변호사를 등록·매칭하고 소개 이력·수수료를 추적합니다.</p>
      <div className="mt-8">
        <LawyerReferralsClient initialPartners={partners} initialReferrals={referrals} initialCommissions={commissions} />
      </div>
    </section>
  );
}
