import { Card } from "@/components/ui/card";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { getReferralStats, listCodes } from "@/lib/services/referral-service";

import { NewCodeButton } from "./new-code-button";

export const dynamic = "force-dynamic";

export default async function ReferralsPage() {
  const stats = getReferralStats();
  const codes = listCodes();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        kicker="성장"
        title="고객 추천"
        description="추천 코드를 발급하고 주요 추천인 현황을 관리합니다."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-5">
          <p className="text-xs text-text-muted">전체 코드 수</p>
          <p className="mt-1 text-2xl font-semibold">{stats.totalCodes}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs text-text-muted">전체 사용 횟수</p>
          <p className="mt-1 text-2xl font-semibold">{stats.totalUses}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs text-text-muted">주요 추천인</p>
          <p className="mt-1 text-2xl font-semibold">{stats.topReferrers.length}</p>
        </Card>
      </div>

      <NewCodeButton />

      <Card className="p-5">
        <h2 className="text-sm font-semibold text-text-strong">주요 추천인</h2>
        {stats.topReferrers.length === 0 ? (
          <p className="mt-3 text-sm text-text-muted">등록된 추천인이 없습니다.</p>
        ) : (
          <table className="mt-4 w-full text-sm">
            <thead>
              <tr className="text-left text-text-muted">
                <th className="py-2">이메일</th>
                <th className="py-2">사용 횟수</th>
              </tr>
            </thead>
            <tbody>
              {stats.topReferrers.map((r) => (
                <tr key={r.email} className="border-t border-line">
                  <td className="py-2">{r.email}</td>
                  <td className="py-2">{r.uses}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Card className="p-5">
        <h2 className="text-sm font-semibold text-text-strong">전체 코드</h2>
        {codes.length === 0 ? (
          <p className="mt-3 text-sm text-text-muted">발급된 코드가 없습니다.</p>
        ) : (
          <table className="mt-4 w-full text-sm">
            <thead>
              <tr className="text-left text-text-muted">
                <th className="py-2">코드</th>
                <th className="py-2">추천인</th>
                <th className="py-2">이메일</th>
                <th className="py-2">사용 횟수</th>
                <th className="py-2">보상금</th>
                <th className="py-2">발급일</th>
              </tr>
            </thead>
            <tbody>
              {codes.map((c) => (
                <tr key={c.code} className="border-t border-line">
                  <td className="py-2 font-mono">{c.code}</td>
                  <td className="py-2">{c.referrerName}</td>
                  <td className="py-2">{c.referrerEmail}</td>
                  <td className="py-2">{c.usageCount}</td>
                  <td className="py-2">{c.rewardAmount.toLocaleString()}</td>
                  <td className="py-2 text-text-muted">
                    {c.createdAt.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
