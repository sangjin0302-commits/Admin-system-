import { listFranchises } from "@/lib/services/franchise-service";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { notFound } from "next/navigation";
import { FranchiseActions } from "./franchise-actions";

export const dynamic = "force-dynamic";

export default async function AdminFranchisePage() {
  if (!(await isFeatureEnabled("franchise_saas"))) notFound();
  const all = await listFranchises();
  const pending = all.filter((f) => f.status === "pending");
  const active = all.filter((f) => f.status === "active");

  return (
    <section className="space-y-6">
      <div className="rounded-[20px] border border-line bg-surface px-5 py-6 shadow-panel">
        <p className="ui-kicker">Franchise</p>
        <h2 className="mt-2 text-xl font-semibold text-text-strong">프랜차이즈 관리</h2>
        <p className="mt-1 text-sm text-text-muted">가맹 신청·활성 사무소·월간 청구 현황.</p>
      </div>

      <div className="rounded-[20px] border border-line bg-surface px-5 py-6 shadow-panel">
        <h3 className="font-semibold">대기중 신청 ({pending.length})</h3>
        <ul className="mt-3 divide-y divide-line rounded border border-line">
          {pending.map((f) => (
            <li key={f.id} className="flex items-center justify-between px-3 py-3">
              <div>
                <p className="font-semibold">{f.orgName}</p>
                <p className="text-xs text-text-muted">
                  {f.adminEmail} · {f.plan} · 예상 {f.estimatedCases ?? "?"}건/월
                </p>
              </div>
              <FranchiseActions id={f.id} action="provision" />
            </li>
          ))}
          {pending.length === 0 && <li className="px-3 py-4 text-center text-text-muted">대기 신청 없음</li>}
        </ul>
      </div>

      <div className="rounded-[20px] border border-line bg-surface px-5 py-6 shadow-panel">
        <h3 className="font-semibold">활성 가맹 ({active.length})</h3>
        <table className="mt-3 w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs text-text-muted">
              <th className="py-2">사무소</th>
              <th>플랜</th>
              <th>서브도메인</th>
              <th className="text-right">월비</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {active.map((f) => (
              <tr key={f.id} className="border-b border-line/60">
                <td className="py-2">{f.orgName}</td>
                <td>{f.plan}</td>
                <td className="text-text-muted">{f.subdomain}</td>
                <td className="text-right">₩{f.monthlyFee.toLocaleString()}</td>
                <td className="text-right">
                  <FranchiseActions id={f.id} action="suspend" />
                </td>
              </tr>
            ))}
            {active.length === 0 && (
              <tr>
                <td colSpan={5} className="py-4 text-center text-text-muted">
                  활성 가맹 없음
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
