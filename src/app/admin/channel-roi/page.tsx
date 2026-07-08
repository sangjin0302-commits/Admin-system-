import { Card } from "@/components/ui/card";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { prisma } from "@/lib/prisma/client";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

const SPEND_SETTING_KEY = "channel.roi.spend";
const AVG_DEAL_KEY = "channel.roi.avgDealKRW";

const PERIOD_OPTIONS = [
  { key: "30", label: "30일" },
  { key: "90", label: "90일" },
  { key: "365", label: "1년" },
] as const;

async function readSpendMap(): Promise<Record<string, number>> {
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key: SPEND_SETTING_KEY } });
    if (!row?.value) return {};
    const parsed = JSON.parse(row.value);
    if (!parsed || typeof parsed !== "object") return {};
    const out: Record<string, number> = {};
    for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
      const n = Number(v);
      if (Number.isFinite(n) && n >= 0) out[k] = n;
    }
    return out;
  } catch {
    return {};
  }
}

async function readAvgDeal(): Promise<number> {
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key: AVG_DEAL_KEY } });
    const n = Number(row?.value);
    return Number.isFinite(n) && n > 0 ? n : 500_000;
  } catch {
    return 500_000;
  }
}

export default async function ChannelRoiPage({
  searchParams,
}: {
  searchParams?: Promise<{ period?: string }>;
}) {
  if (!(await isFeatureEnabled("channel_roi"))) notFound();

  const sp = (await searchParams) ?? {};
  const periodDays = Math.max(7, Math.min(365, Number(sp.period) || 30));
  const since = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000);

  const [byChannel, spendMap, avgDeal] = await Promise.all([
    prisma.inquiry.groupBy({
      by: ["intakeChannel", "status"],
      where: { createdAt: { gte: since }, intakeChannel: { not: null } },
      _count: { _all: true },
    }).catch(() => [] as Array<{ intakeChannel: string | null; status: string; _count: { _all: number } }>),
    readSpendMap(),
    readAvgDeal(),
  ]);

  const channelAgg = new Map<string, { total: number; won: number }>();
  for (const row of byChannel) {
    const ch = row.intakeChannel ?? "unknown";
    const cur = channelAgg.get(ch) ?? { total: 0, won: 0 };
    cur.total += row._count._all;
    if (row.status === "WON") cur.won += row._count._all;
    channelAgg.set(ch, cur);
  }

  const scale = periodDays / 30; // 광고비는 월 기준 입력 → 기간 스케일링
  const rows = Array.from(channelAgg.entries())
    .map(([channel, v]) => {
      const spend = (spendMap[channel] ?? 0) * scale;
      const revenue = v.won * avgDeal;
      const cpa = v.won > 0 ? spend / v.won : null;
      const cpl = v.total > 0 ? spend / v.total : null;
      const roas = spend > 0 ? (revenue / spend) * 100 : null;
      const rate = v.total > 0 ? (v.won / v.total) * 100 : 0;
      return { channel, total: v.total, won: v.won, spend, revenue, cpa, cpl, roas, rate };
    })
    .sort((a, b) => b.total - a.total);

  const totalSpend = rows.reduce((s, r) => s + r.spend, 0);
  const totalRevenue = rows.reduce((s, r) => s + r.revenue, 0);
  const totalROAS = totalSpend > 0 ? (totalRevenue / totalSpend) * 100 : 0;

  const fmt = (n: number) => n.toLocaleString("ko-KR");

  return (
    <div className="space-y-6">
      <AdminPageHeader
        kicker="Marketing"
        title="채널별 ROI"
        description="채널별 광고비 대비 계약 성사 · CPA · ROAS 자동 산출."
      />

      <div className="flex flex-wrap items-center gap-2">
        <span className="font-serif text-xs font-bold uppercase tracking-[0.2em] text-gold-deep">기간</span>
        {PERIOD_OPTIONS.map((p) => (
          <a
            key={p.key}
            href={`/admin/channel-roi?period=${p.key}`}
            className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
              String(periodDays) === p.key
                ? "bg-primary text-white"
                : "border border-gold/30 bg-surface text-text-muted hover:bg-gold-soft/30"
            }`}
          >
            {p.label}
          </a>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <p className="text-xs uppercase tracking-wider text-text-muted">총 광고비 ({periodDays}일)</p>
          <p className="mt-2 text-2xl font-bold text-primary">₩{fmt(Math.round(totalSpend))}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs uppercase tracking-wider text-text-muted">추정 매출</p>
          <p className="mt-2 text-2xl font-bold text-emerald-600">₩{fmt(Math.round(totalRevenue))}</p>
          <p className="mt-1 text-[11px] text-text-muted">평균 계약 ₩{fmt(avgDeal)} 기준</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs uppercase tracking-wider text-text-muted">전체 ROAS</p>
          <p className={`mt-2 text-2xl font-bold ${totalROAS >= 200 ? "text-emerald-600" : "text-amber-600"}`}>
            {totalSpend > 0 ? `${totalROAS.toFixed(0)}%` : "—"}
          </p>
        </Card>
      </div>

      <Card className="p-5">
        <p className="ui-kicker">채널별 성과</p>
        <p className="mt-1 text-xs text-text-muted">
          채널 광고비는 <strong>월 기준</strong>으로 저장. 선택 기간에 비례 스케일 적용.
        </p>
        {rows.length === 0 ? (
          <p className="mt-3 text-sm text-text-muted">기간 내 채널 데이터 없음.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gold/20 text-left">
                  <th className="pb-2 font-bold text-text-strong">채널</th>
                  <th className="pb-2 text-right font-bold text-text-strong">문의</th>
                  <th className="pb-2 text-right font-bold text-text-strong">계약</th>
                  <th className="pb-2 text-right font-bold text-text-strong">계약률</th>
                  <th className="pb-2 text-right font-bold text-text-strong">광고비</th>
                  <th className="pb-2 text-right font-bold text-text-strong">CPL</th>
                  <th className="pb-2 text-right font-bold text-text-strong">CPA</th>
                  <th className="pb-2 text-right font-bold text-text-strong">ROAS</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.channel} className="border-b border-gold/10">
                    <td className="py-2 font-medium text-text">{r.channel}</td>
                    <td className="py-2 text-right text-text-muted">{r.total}</td>
                    <td className="py-2 text-right text-text-muted">{r.won}</td>
                    <td className={`py-2 text-right ${r.rate >= 15 ? "text-emerald-600" : "text-amber-600"}`}>
                      {r.rate.toFixed(1)}%
                    </td>
                    <td className="py-2 text-right text-text-muted">
                      {r.spend > 0 ? `₩${fmt(Math.round(r.spend))}` : "—"}
                    </td>
                    <td className="py-2 text-right text-text-muted">
                      {r.cpl != null ? `₩${fmt(Math.round(r.cpl))}` : "—"}
                    </td>
                    <td className="py-2 text-right text-text-muted">
                      {r.cpa != null ? `₩${fmt(Math.round(r.cpa))}` : "—"}
                    </td>
                    <td className={`py-2 text-right font-bold ${
                      r.roas == null ? "text-text-muted" : r.roas >= 200 ? "text-emerald-600" : "text-amber-600"
                    }`}>
                      {r.roas != null ? `${r.roas.toFixed(0)}%` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card className="p-5">
        <p className="ui-kicker">광고비 설정</p>
        <p className="mt-1 text-xs text-text-muted">
          채널별 월 광고비 · 평균 계약금액은 <code className="text-gold-deep">SiteSetting</code> 키로 저장됩니다.
        </p>
        <ul className="mt-3 space-y-1 text-xs text-text-muted">
          <li>• <code>{SPEND_SETTING_KEY}</code> — JSON <code>{`{ "kakao": 100000, "naver_ads": 500000, "google_ads": 300000 }`}</code></li>
          <li>• <code>{AVG_DEAL_KEY}</code> — 숫자, 예: <code>500000</code> (원)</li>
        </ul>
        <p className="mt-3 text-xs text-text-muted">
          채널 키는 <code>intakeChannel</code> 값과 정확히 일치해야 합니다. 현재 관측 채널:{" "}
          {rows.length > 0
            ? rows.map((r) => <code key={r.channel} className="mr-2 text-gold-deep">{r.channel}</code>)
            : "—"}
        </p>
      </Card>
    </div>
  );
}
