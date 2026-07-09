import { Card } from "@/components/ui/card";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { prisma } from "@/lib/prisma/client";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

type DayStat = { date: string; sent: number; failed: number };

export default async function KakaoStatsPage() {
  if (!(await isFeatureEnabled("kakao_delivery_dashboard"))) notFound();

  const [statusCounts, dailyRows] = await Promise.all([
    prisma.notificationLog.groupBy({
      by: ["status"],
      where: { channel: "ALIMTALK" },
      _count: { id: true },
    }),
    prisma.notificationLog.findMany({
      where: {
        channel: "ALIMTALK",
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
      select: { status: true, createdAt: true },
    }),
  ]);

  const total: Record<string, number> = {};
  for (const r of statusCounts) total[r.status] = r._count.id;
  const allCount = (total["SENT"] ?? 0) + (total["FAILED"] ?? 0) + (total["QUEUED"] ?? 0) + (total["SKIPPED"] ?? 0);
  const successRate = allCount > 0 ? Math.round(((total["SENT"] ?? 0) / allCount) * 1000) / 10 : 0;
  const failureRate = allCount > 0 ? Math.round(((total["FAILED"] ?? 0) / allCount) * 1000) / 10 : 0;

  const dayMap = new Map<string, { sent: number; failed: number }>();
  for (const r of dailyRows) {
    const d = r.createdAt.toISOString().slice(0, 10);
    const b = dayMap.get(d) ?? { sent: 0, failed: 0 };
    if (r.status === "SENT") b.sent += 1;
    if (r.status === "FAILED") b.failed += 1;
    dayMap.set(d, b);
  }
  const trend: DayStat[] = Array.from(dayMap.entries())
    .map(([date, v]) => ({ date, ...v }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="space-y-6">
      <AdminPageHeader kicker="마케팅" title="카카오 알림톡 발송 통계" />

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">전체 발송</p>
          <p className="text-2xl font-bold">{allCount.toLocaleString()}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">성공률</p>
          <p className="text-2xl font-bold text-green-600">{successRate}%</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">실패률</p>
          <p className="text-2xl font-bold text-red-600">{failureRate}%</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">대기 중</p>
          <p className="text-2xl font-bold">{(total["QUEUED"] ?? 0).toLocaleString()}</p>
        </Card>
      </div>

      <Card className="p-4">
        <h3 className="font-semibold mb-3">최근 7일 추이</h3>
        {trend.length === 0 ? (
          <p className="text-sm text-muted-foreground">데이터 없음</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">날짜</th>
                  <th className="text-right py-2">성공</th>
                  <th className="text-right py-2">실패</th>
                </tr>
              </thead>
              <tbody>
                {trend.map((d) => (
                  <tr key={d.date} className="border-b">
                    <td className="py-2">{d.date}</td>
                    <td className="text-right text-green-600">{d.sent}</td>
                    <td className="text-right text-red-600">{d.failed}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
