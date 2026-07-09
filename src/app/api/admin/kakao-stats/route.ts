import { prisma } from "@/lib/prisma/client";
import { createAdminRequestContext } from "@/lib/http/admin-api";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const api = createAdminRequestContext("admin.kakao-stats");
  if (!(await isFeatureEnabled("kakao_delivery_dashboard"))) {
    return api.error(403, "카카오 발송 대시보드가 비활성화되어 있습니다.", { code: "FEATURE_DISABLED" });
  }

  try {
    const [statusCounts, trend] = await Promise.all([
      prisma.notificationLog.groupBy({
        by: ["status"],
        where: { channel: "ALIMTALK" },
        _count: { id: true },
      }),
      prisma.notificationLog.groupBy({
        by: ["status"],
        where: {
          channel: "ALIMTALK",
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
        _count: { id: true },
      }),
    ]);

    const toMap = (rows: typeof statusCounts) => {
      const m: Record<string, number> = {};
      for (const r of rows) m[r.status] = r._count.id;
      return m;
    };

    const total = toMap(statusCounts);
    const last7d = toMap(trend);

    const totalSent = (total["SENT"] ?? 0) + (total["FAILED"] ?? 0) + (total["QUEUED"] ?? 0) + (total["SKIPPED"] ?? 0);
    const successRate = totalSent > 0 ? ((total["SENT"] ?? 0) / totalSent) * 100 : 0;
    const failureRate = totalSent > 0 ? ((total["FAILED"] ?? 0) / totalSent) * 100 : 0;

    return api.ok({
      total: {
        sent: total["SENT"] ?? 0,
        failed: total["FAILED"] ?? 0,
        queued: total["QUEUED"] ?? 0,
        skipped: total["SKIPPED"] ?? 0,
        all: totalSent,
        successRate: Math.round(successRate * 10) / 10,
        failureRate: Math.round(failureRate * 10) / 10,
      },
      last7d: {
        sent: last7d["SENT"] ?? 0,
        failed: last7d["FAILED"] ?? 0,
        queued: last7d["QUEUED"] ?? 0,
        skipped: last7d["SKIPPED"] ?? 0,
      },
    });
  } catch (err) {
    api.logError(err);
    return api.error(500, "카카오 통계 조회 실패", { code: "KAKAO_STATS_FAILED" });
  }
}
