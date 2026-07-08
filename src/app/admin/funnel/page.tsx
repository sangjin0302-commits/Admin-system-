import { Card } from "@/components/ui/card";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { prisma } from "@/lib/prisma/client";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

const STAGES: Array<{ key: string; label: string; statuses: string[] }> = [
  { key: "intake", label: "신규 접수", statuses: ["NEW", "PRE_DIAGNOSED"] },
  { key: "consult", label: "상담 대기·진행", statuses: ["CONSULTATION_REQUIRED", "WAITING_CONSULTATION", "IN_REVIEW"] },
  { key: "quote", label: "견적 발송", statuses: ["QUOTE_DRAFTED", "QUOTE_PENDING", "QUOTE_SENT"] },
  { key: "won", label: "계약 성사", statuses: ["WON"] },
  { key: "closed", label: "종결", statuses: ["CLOSED"] },
];

const PERIOD_OPTIONS = [
  { key: "30", label: "30일" },
  { key: "90", label: "90일" },
  { key: "365", label: "1년" },
] as const;

export default async function FunnelPage({
  searchParams,
}: {
  searchParams?: Promise<{ period?: string }>;
}) {
  if (!(await isFeatureEnabled("funnel_analytics"))) notFound();

  const sp = (await searchParams) ?? {};
  const periodDays = Math.max(7, Math.min(365, Number(sp.period) || 90));
  const since = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000);

  const [byStatus, byIntakeChannel, avgResponseGrouped] = await Promise.all([
    prisma.inquiry.groupBy({
      by: ["status"],
      where: { createdAt: { gte: since } },
      _count: { _all: true },
    }).catch(() => [] as Array<{ status: string; _count: { _all: number } }>),
    prisma.inquiry.groupBy({
      by: ["intakeChannel", "status"],
      where: { createdAt: { gte: since }, intakeChannel: { not: null } },
      _count: { _all: true },
    }).catch(() => [] as Array<{ intakeChannel: string | null; status: string; _count: { _all: number } }>),
    prisma.inquiry.findMany({
      where: { createdAt: { gte: since }, firstResponseAt: { not: null } },
      select: { createdAt: true, firstResponseAt: true, status: true },
    }).catch(() => [] as Array<{ createdAt: Date; firstResponseAt: Date | null; status: string }>),
  ]);

  const statusCount = new Map<string, number>();
  for (const row of byStatus) statusCount.set(row.status, row._count._all);

  const stageData = STAGES.map((s) => ({
    ...s,
    count: s.statuses.reduce((sum, st) => sum + (statusCount.get(st) ?? 0), 0),
  }));

  const total = stageData.reduce((s, x) => s + x.count, 0);
  const topStage = Math.max(1, ...stageData.map((s) => s.count));

  // 채널별 계약 성사 (WON)
  const channelWon = new Map<string, { total: number; won: number }>();
  for (const row of byIntakeChannel) {
    const ch = row.intakeChannel ?? "unknown";
    const cur = channelWon.get(ch) ?? { total: 0, won: 0 };
    cur.total += row._count._all;
    if (row.status === "WON") cur.won += row._count._all;
    channelWon.set(ch, cur);
  }
  const channels = Array.from(channelWon.entries())
    .map(([channel, v]) => ({
      channel,
      total: v.total,
      won: v.won,
      rate: v.total > 0 ? (v.won / v.total) * 100 : 0,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 8);

  // 응답시간 → 계약률 상관
  const bucketByHour = { fast: { total: 0, won: 0 }, mid: { total: 0, won: 0 }, slow: { total: 0, won: 0 } };
  for (const inq of avgResponseGrouped) {
    if (!inq.firstResponseAt) continue;
    const hours = (inq.firstResponseAt.getTime() - inq.createdAt.getTime()) / (1000 * 60 * 60);
    const bucket = hours <= 4 ? bucketByHour.fast : hours <= 24 ? bucketByHour.mid : bucketByHour.slow;
    bucket.total += 1;
    if (inq.status === "WON") bucket.won += 1;
  }
  const responseCorr = [
    { label: "4시간 이내", ...bucketByHour.fast },
    { label: "4-24시간", ...bucketByHour.mid },
    { label: "24시간 초과", ...bucketByHour.slow },
  ].map((b) => ({ ...b, rate: b.total > 0 ? (b.won / b.total) * 100 : 0 }));

  return (
    <div className="space-y-6">
      <AdminPageHeader
        kicker="Analytics"
        title="전환 퍼널"
        description="문의 → 상담 → 견적 → 계약 → 종결 단계별 전환율 및 채널별 성과."
      />

      <div className="flex flex-wrap items-center gap-2">
        <span className="font-serif text-xs font-bold uppercase tracking-[0.2em] text-gold-deep">기간</span>
        {PERIOD_OPTIONS.map((p) => (
          <a
            key={p.key}
            href={`/admin/funnel?period=${p.key}`}
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

      <Card className="p-5">
        <p className="ui-kicker">스테이지별 문의 분포</p>
        <p className="mt-1 text-xs text-text-muted">최근 {periodDays}일 · 총 {total.toLocaleString()}건</p>
        <div className="mt-5 space-y-3">
          {stageData.map((s, idx) => {
            const prev = idx > 0 ? stageData[idx - 1].count : total;
            const conversion = prev > 0 ? (s.count / prev) * 100 : 0;
            const width = (s.count / topStage) * 100;
            return (
              <div key={s.key} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-text-strong">
                    {idx + 1}. {s.label}
                  </span>
                  <span className="font-mono text-xs text-text-muted">
                    {s.count.toLocaleString()}건
                    {idx > 0 && (
                      <span className={`ml-2 ${conversion >= 30 ? "text-emerald-600" : "text-amber-600"}`}>
                        · 전단계 대비 {conversion.toFixed(1)}%
                      </span>
                    )}
                  </span>
                </div>
                <div className="relative h-6 overflow-hidden rounded bg-surface-muted">
                  <div
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-gold to-gold-deep transition-all"
                    style={{ width: `${Math.max(4, width)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        {stageData[3].count > 0 && total > 0 && (
          <p className="mt-4 text-sm text-text-muted">
            <strong className="text-text-strong">최종 계약 전환율:</strong>{" "}
            <span className="text-lg font-bold text-emerald-600">
              {((stageData[3].count / total) * 100).toFixed(1)}%
            </span>{" "}
            (신규 접수 → WON)
          </p>
        )}
      </Card>

      <Card className="p-5">
        <p className="ui-kicker">채널별 성과</p>
        <p className="mt-1 text-xs text-text-muted">intakeChannel 필드 기준 · 계약률 = WON / 총 문의</p>
        {channels.length === 0 ? (
          <p className="mt-3 text-sm text-text-muted">채널 데이터 없음. UTM 파라미터를 통한 트래킹이 활성화되어야 합니다.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gold/20 text-left">
                  <th className="pb-2 font-bold text-text-strong">채널</th>
                  <th className="pb-2 text-right font-bold text-text-strong">문의</th>
                  <th className="pb-2 text-right font-bold text-text-strong">계약</th>
                  <th className="pb-2 text-right font-bold text-text-strong">계약률</th>
                </tr>
              </thead>
              <tbody>
                {channels.map((c) => (
                  <tr key={c.channel} className="border-b border-gold/10">
                    <td className="py-2 font-medium text-text">{c.channel}</td>
                    <td className="py-2 text-right text-text-muted">{c.total}</td>
                    <td className="py-2 text-right text-text-muted">{c.won}</td>
                    <td className={`py-2 text-right font-bold ${c.rate >= 15 ? "text-emerald-600" : "text-amber-600"}`}>
                      {c.rate.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card className="p-5">
        <p className="ui-kicker">응답 속도 ↔ 계약률 상관</p>
        <p className="mt-1 text-xs text-text-muted">첫 응답 시간대별 WON 전환율 — 빠를수록 계약률 높음</p>
        <div className="mt-4 space-y-2">
          {responseCorr.map((b) => (
            <div key={b.label} className="flex items-center gap-3 text-sm">
              <span className="w-28 shrink-0 text-text-strong">{b.label}</span>
              <div className="relative h-5 flex-1 overflow-hidden rounded bg-surface-muted">
                <div
                  className={`absolute inset-y-0 left-0 ${b.rate >= 15 ? "bg-emerald-400" : "bg-amber-400"}`}
                  style={{ width: `${Math.min(100, b.rate * 2)}%` }}
                />
              </div>
              <span className="w-24 text-right font-mono text-xs text-text-muted">
                {b.won}/{b.total} · {b.rate.toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
