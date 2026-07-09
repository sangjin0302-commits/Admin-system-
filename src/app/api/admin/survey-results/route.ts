/**
 * JJJ3: 설문 결과 집계 API.
 * GET /api/admin/survey-results → { total, completed, avgScore, nps, latest[] }
 * Feature flag: `survey_results_dashboard`
 */

import { createAdminRequestContext } from "@/lib/http/admin-api";
import { prisma } from "@/lib/prisma/client";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";

export async function GET() {
  const api = createAdminRequestContext("admin.survey-results.get");
  if (!(await isFeatureEnabled("survey_results_dashboard").catch(() => true))) {
    return api.error(403, "설문 대시보드가 비활성화되어 있습니다", {
      code: "FEATURE_DISABLED",
    });
  }
  try {
    const [total, completed, latest] = await Promise.all([
      prisma.satisfactionSurvey.count(),
      prisma.satisfactionSurvey.findMany({
        where: { status: "COMPLETED" },
        select: { score: true },
      }),
      prisma.satisfactionSurvey.findMany({
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true,
          clientName: true,
          score: true,
          feedback: true,
          category: true,
          status: true,
          createdAt: true,
          completedAt: true,
        },
      }),
    ]);

    const completedCount = completed.length;
    const avgScore =
      completedCount > 0 ? completed.reduce((s, r) => s + r.score, 0) / completedCount : 0;
    const promoters = completed.filter((r) => r.score >= 9).length;
    const detractors = completed.filter((r) => r.score <= 6).length;
    const nps = completedCount > 0 ? ((promoters - detractors) / completedCount) * 100 : 0;

    return api.ok({
      total,
      completed: completedCount,
      avgScore: Number(avgScore.toFixed(2)),
      nps: Number(nps.toFixed(1)),
      latest,
    });
  } catch (error) {
    api.logError(error);
    return api.error(500, "설문 집계 실패", { code: "SURVEY_STATS_FAILED" });
  }
}
