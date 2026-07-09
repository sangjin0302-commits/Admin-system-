/**
 * JJJ3 — 포털 설문 결과 대시보드.
 * SatisfactionSurvey 응답 집계: 총 응답 / 평균 평점 / 평균 NPS / 최근 20건.
 * Feature flag: `survey_results_dashboard`
 */

import Link from "next/link";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Card } from "@/components/ui/card";
import { prisma } from "@/lib/prisma/client";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";

export const dynamic = "force-dynamic";

function formatDate(d: Date | null): string {
  if (!d) return "-";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function npsLabel(score: number): string {
  if (score >= 9) return "추천";
  if (score >= 7) return "중립";
  return "비추천";
}

export default async function SurveyResultsPage() {
  const enabled = await isFeatureEnabled("survey_results_dashboard").catch(() => true);
  if (!enabled) {
    return (
      <Card className="p-6">
        <p className="text-sm text-text-muted">설문 대시보드가 비활성화되어 있습니다.</p>
      </Card>
    );
  }

  const [total, completed, latest] = await Promise.all([
    prisma.satisfactionSurvey.count().catch(() => 0),
    prisma.satisfactionSurvey.findMany({
      where: { status: "COMPLETED" },
      select: { score: true, category: true },
    }).catch(() => [] as Array<{ score: number; category: string | null }>),
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
    }).catch(() => [] as Array<{
      id: string;
      clientName: string | null;
      score: number;
      feedback: string | null;
      category: string | null;
      status: string;
      createdAt: Date;
      completedAt: Date | null;
    }>),
  ]);

  const completedCount = completed.length;
  const avgScore =
    completedCount > 0
      ? completed.reduce((s, r) => s + r.score, 0) / completedCount
      : 0;
  const promoters = completed.filter((r) => r.score >= 9).length;
  const detractors = completed.filter((r) => r.score <= 6).length;
  const nps = completedCount > 0 ? ((promoters - detractors) / completedCount) * 100 : 0;

  const kpis = [
    { label: "총 응답", value: String(total) },
    { label: "완료 응답", value: String(completedCount) },
    { label: "평균 평점 (0-10)", value: avgScore.toFixed(2) },
    { label: "평균 NPS", value: `${nps.toFixed(1)}` },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        kicker="Operations"
        title="포털 설문 결과"
        description="고객 만족도 설문 응답 집계 및 최근 응답 현황"
        action={
          <Link href="/admin" className="text-sm text-text-muted underline">
            ← 대시보드
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {kpis.map((k) => (
          <Card key={k.label} className="p-4">
            <p className="text-xs text-text-muted">{k.label}</p>
            <p className="mt-1 text-2xl font-semibold text-text-strong">{k.value}</p>
          </Card>
        ))}
      </div>

      <Card className="p-5">
        <h3 className="text-sm font-semibold text-text-strong">최근 응답 20건</h3>
        {latest.length === 0 ? (
          <p className="mt-3 text-sm text-text-muted">응답이 아직 없습니다.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs text-text-muted">
                  <th className="py-2 pr-3">일시</th>
                  <th className="py-2 pr-3">응답자</th>
                  <th className="py-2 pr-3">점수</th>
                  <th className="py-2 pr-3">NPS</th>
                  <th className="py-2 pr-3">카테고리</th>
                  <th className="py-2 pr-3">상태</th>
                  <th className="py-2 pr-3">피드백</th>
                </tr>
              </thead>
              <tbody>
                {latest.map((r) => (
                  <tr key={r.id} className="border-b border-line/60">
                    <td className="py-2 pr-3 text-text-muted">{formatDate(r.completedAt ?? r.createdAt)}</td>
                    <td className="py-2 pr-3 text-text-strong">{r.clientName ?? "익명"}</td>
                    <td className="py-2 pr-3 font-medium text-text-strong">{r.score}</td>
                    <td className="py-2 pr-3 text-xs text-text-muted">{npsLabel(r.score)}</td>
                    <td className="py-2 pr-3 text-xs text-text-muted">{r.category ?? "-"}</td>
                    <td className="py-2 pr-3 text-xs text-text-muted">{r.status}</td>
                    <td className="py-2 pr-3 max-w-md truncate text-text-muted">{r.feedback ?? "-"}</td>
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
