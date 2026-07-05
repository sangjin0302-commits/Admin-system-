import { notFound } from "next/navigation";
import { FRANCHISE_PLANS } from "@/lib/services/franchise-service";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { ApplyForm } from "./apply-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "ETHOS 가맹 신청" };

export default async function FranchiseApplyPage({
  searchParams,
}: {
  searchParams?: Promise<{ plan?: string }>;
}) {
  if (!(await isFeatureEnabled("franchise_saas"))) notFound();
  const params = (await searchParams) ?? {};
  const initialPlan =
    params.plan && params.plan in FRANCHISE_PLANS ? (params.plan as keyof typeof FRANCHISE_PLANS) : "pro";

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <p className="ui-kicker">Franchise Application</p>
      <h1 className="mt-2 font-serif text-3xl font-bold text-primary">가맹 신청</h1>
      <p className="mt-2 text-text-muted">담당자가 영업일 기준 2일 이내에 회신드립니다.</p>
      <div className="mt-8">
        <ApplyForm initialPlan={initialPlan} />
      </div>
    </main>
  );
}
