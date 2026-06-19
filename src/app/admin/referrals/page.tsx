import { Card } from "@/components/ui/card";
import { getReferralStats, listCodes } from "@/lib/services/referral-service";

import { NewCodeButton } from "./new-code-button";

export const dynamic = "force-dynamic";

export default async function ReferralsPage() {
  const stats = getReferralStats();
  const codes = listCodes();

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <p className="ui-kicker">Growth</p>
        <h1 className="mt-2 ui-page-title">Customer Referrals</h1>
        <p className="mt-2 text-sm text-text-muted">
          Generate referral codes and track top referrers.
        </p>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-5">
          <p className="text-xs text-text-muted">Total Codes</p>
          <p className="mt-1 text-2xl font-semibold">{stats.totalCodes}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs text-text-muted">Total Uses</p>
          <p className="mt-1 text-2xl font-semibold">{stats.totalUses}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs text-text-muted">Top Referrers</p>
          <p className="mt-1 text-2xl font-semibold">{stats.topReferrers.length}</p>
        </Card>
      </div>

      <NewCodeButton />

      <Card className="p-5">
        <h2 className="text-sm font-semibold text-text-strong">Top Referrers</h2>
        {stats.topReferrers.length === 0 ? (
          <p className="mt-3 text-sm text-text-muted">No referrers yet.</p>
        ) : (
          <table className="mt-4 w-full text-sm">
            <thead>
              <tr className="text-left text-text-muted">
                <th className="py-2">Email</th>
                <th className="py-2">Uses</th>
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
        <h2 className="text-sm font-semibold text-text-strong">All Codes</h2>
        {codes.length === 0 ? (
          <p className="mt-3 text-sm text-text-muted">No codes yet.</p>
        ) : (
          <table className="mt-4 w-full text-sm">
            <thead>
              <tr className="text-left text-text-muted">
                <th className="py-2">Code</th>
                <th className="py-2">Referrer</th>
                <th className="py-2">Email</th>
                <th className="py-2">Uses</th>
                <th className="py-2">Reward</th>
                <th className="py-2">Created</th>
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
