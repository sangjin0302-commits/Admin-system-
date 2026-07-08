import { Card } from "@/components/ui/card";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { prisma } from "@/lib/prisma/client";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { notFound } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

const PERIOD_OPTIONS = [
  { key: "30", label: "30일" },
  { key: "90", label: "90일" },
  { key: "365", label: "1년" },
] as const;

export default async function RefTrackingPage({
  searchParams,
}: {
  searchParams?: Promise<{ period?: string }>;
}) {
  if (!(await isFeatureEnabled("referral_tracking"))) notFound();

  const sp = (await searchParams) ?? {};
  const periodDays = Math.max(7, Math.min(365, Number(sp.period) || 90));
  const since = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000);

  const rows = await prisma.inquiry.groupBy({
    by: ["intakeRef", "status"],
    where: { createdAt: { gte: since }, intakeRef: { not: null } },
    _count: { _all: true },
  }).catch(() => [] as Array<{ intakeRef: string | null; status: string; _count: { _all: number } }>);

  const agg = new Map<string, { total: number; won: number; consulted: number }>();
  for (const r of rows) {
    const key = r.intakeRef ?? "unknown";
    const cur = agg.get(key) ?? { total: 0, won: 0, consulted: 0 };
    cur.total += r._count._all;
    if (r.status === "WON") cur.won += r._count._all;
    if (["QUOTE_SENT", "QUOTE_PENDING", "QUOTE_DRAFTED", "WAITING_CONSULTATION"].includes(r.status)) {
      cur.consulted += r._count._all;
    }
    agg.set(key, cur);
  }

  const refs = Array.from(agg.entries())
    .map(([ref, v]) => ({
      ref,
      total: v.total,
      won: v.won,
      consulted: v.consulted,
      wonRate: v.total > 0 ? (v.won / v.total) * 100 : 0,
      qualifyRate: v.total > 0 ? ((v.consulted + v.won) / v.total) * 100 : 0,
    }))
    .sort((a, b) => b.total - a.total);

  const totalRef = refs.reduce((s, r) => s + r.total, 0);
  const totalWon = refs.reduce((s, r) => s + r.won, 0);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        kicker="Marketing"
        title="레퍼럴 링크 트래킹"
        description="?ref=xxx 링크별 유입·계약 분석. Jean의 공유 링크마다 개별 ref 부여."
      />

      <div className="flex flex-wrap items-center gap-2">
        <span className="font-serif text-xs font-bold uppercase tracking-[0.2em] text-gold-deep">기간</span>
        {PERIOD_OPTIONS.map((p) => (
          <Link
            key={p.key}
            href={`/admin/ref-tracking?period=${p.key}`}
            className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
              String(periodDays) === p.key
                ? "bg-primary text-white"
                : "border border-gold/30 bg-surface text-text-muted hover:bg-gold-soft/30"
            }`}
          >
            {p.label}
          </Link>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <p className="text-xs uppercase tracking-wider text-text-muted">고유 ref 개수</p>
          <p className="mt-2 text-3xl font-bold text-primary">{refs.length}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs uppercase tracking-wider text-text-muted">ref 총 유입 문의</p>
          <p className="mt-2 text-3xl font-bold text-primary">{totalRef.toLocaleString()}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs uppercase tracking-wider text-text-muted">ref 계약 성사</p>
          <p className="mt-2 text-3xl font-bold text-emerald-600">{totalWon.toLocaleString()}</p>
          <p className="mt-1 text-[11px] text-text-muted">
            평균 계약률 {totalRef > 0 ? ((totalWon / totalRef) * 100).toFixed(1) : "—"}%
          </p>
        </Card>
      </div>

      <Card className="p-0 overflow-hidden">
        {refs.length === 0 ? (
          <p className="p-6 text-sm text-text-muted">
            기간 내 <code>?ref=</code> 파라미터 유입이 없습니다. 공유 링크에 <code>?ref=친구</code>, <code>?ref=강연2026</code> 형식으로 부여하세요.
          </p>
        ) : (
          <table className="w-full text-xs">
            <thead className="bg-surface-muted">
              <tr className="text-left">
                <th className="px-4 py-2 font-bold text-text-strong">ref</th>
                <th className="px-4 py-2 text-right font-bold text-text-strong">유입</th>
                <th className="px-4 py-2 text-right font-bold text-text-strong">상담 이상</th>
                <th className="px-4 py-2 text-right font-bold text-text-strong">계약</th>
                <th className="px-4 py-2 text-right font-bold text-text-strong">계약률</th>
                <th className="px-4 py-2 text-right font-bold text-text-strong">quality</th>
              </tr>
            </thead>
            <tbody>
              {refs.map((r) => (
                <tr key={r.ref} className="border-t border-gold/10">
                  <td className="px-4 py-2 font-mono text-text-strong">{r.ref}</td>
                  <td className="px-4 py-2 text-right text-text-muted">{r.total}</td>
                  <td className="px-4 py-2 text-right text-text-muted">{r.consulted + r.won}</td>
                  <td className="px-4 py-2 text-right text-text-muted">{r.won}</td>
                  <td className={`px-4 py-2 text-right font-bold ${r.wonRate >= 15 ? "text-emerald-600" : "text-amber-600"}`}>
                    {r.wonRate.toFixed(1)}%
                  </td>
                  <td className={`px-4 py-2 text-right ${r.qualifyRate >= 40 ? "text-emerald-600" : "text-text-muted"}`}>
                    {r.qualifyRate.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Card className="p-5">
        <p className="ui-kicker">사용법</p>
        <ul className="mt-3 space-y-2 text-sm text-text-muted">
          <li>• Jean 공유 링크에 <code className="text-gold-deep">?ref=</code> 추가 — 예: <code>ethosattorney.com/?ref=강연2026</code></li>
          <li>• 강연/파트너/지인 등 채널별로 다른 ref 부여</li>
          <li>• <strong>quality</strong> = 상담 이상 진입률 (냉담한 링크 vs 뜨거운 링크 감별)</li>
        </ul>
      </Card>
    </div>
  );
}
