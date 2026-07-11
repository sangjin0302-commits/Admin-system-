import { prisma } from "@/lib/prisma/client";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { CaseMatterStatus } from "@generated/prisma-client/client";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ETHOS 행정사사무소 — 운영 현황",
  description: "ETHOS 행정사사무소의 실시간 운영 현황을 확인하세요.",
};

export const revalidate = 300;

export default async function StatusPage() {
  const enabled = await isFeatureEnabled("public_trust_dashboard");
  if (!enabled) return notFound();

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86_400_000);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 86_400_000);

  const [activeCases, respondedInquiries, closedThisMonth, closedLast7Days] =
    await Promise.all([
      prisma.caseMatter.count({
        where: {
          status: {
            notIn: [CaseMatterStatus.CLOSED, CaseMatterStatus.CANCELLED],
          },
        },
      }),
      prisma.inquiry.findMany({
        where: {
          firstResponseAt: { not: null },
          createdAt: { gte: thirtyDaysAgo },
        },
        select: { createdAt: true, firstResponseAt: true },
      }),
      prisma.caseMatter.count({
        where: {
          status: CaseMatterStatus.CLOSED,
          closedAt: { gte: monthStart },
        },
      }),
      prisma.caseMatter.findMany({
        where: {
          status: CaseMatterStatus.CLOSED,
          closedAt: { gte: sevenDaysAgo },
        },
        select: { closedAt: true },
      }),
    ]);

  // 평균 첫 응답 시간 (시간 단위)
  let avgResponseHours = 0;
  if (respondedInquiries.length > 0) {
    const totalMs = respondedInquiries.reduce((sum, inq) => {
      return sum + (inq.firstResponseAt!.getTime() - inq.createdAt.getTime());
    }, 0);
    avgResponseHours =
      Math.round((totalMs / respondedInquiries.length / 3_600_000) * 10) / 10;
  }

  // 최근 7일 일별 종결 건수
  const dailyClosed: { label: string; count: number }[] = [];
  let maxDailyCount = 0;
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86_400_000);
    const dateStr = `${d.getMonth() + 1}/${d.getDate()}`;
    const count = closedLast7Days.filter((c) => {
      if (!c.closedAt) return false;
      return (
        c.closedAt.getFullYear() === d.getFullYear() &&
        c.closedAt.getMonth() === d.getMonth() &&
        c.closedAt.getDate() === d.getDate()
      );
    }).length;
    dailyClosed.push({ label: dateStr, count });
    if (count > maxDailyCount) maxDailyCount = count;
  }

  // 응답 시간 목표: 24시간 기준 진행률
  const TARGET_HOURS = 24;
  const responsePercent = Math.min(
    100,
    Math.round(((TARGET_HOURS - avgResponseHours) / TARGET_HOURS) * 100)
  );
  const responsePercentClamped = Math.max(0, responsePercent);

  // SVG bar chart dimensions
  const chartW = 560;
  const chartH = 160;
  const barGap = 12;
  const barW = (chartW - barGap * 8) / 7;

  return (
    <div
      className="min-h-screen p-4 sm:p-6"
      style={{ backgroundColor: "#f0e8d7", fontFamily: "'Georgia', 'Noto Serif KR', serif" }}
    >
      <div className="mx-auto w-full max-w-3xl space-y-8">
        {/* Header */}
        <header
          className="rounded-2xl px-6 py-8 text-center sm:px-10 sm:py-10"
          style={{ backgroundColor: "#1a3c5f" }}
        >
          {/* Logo placeholder */}
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border-2"
            style={{ borderColor: "#c9a961" }}
          >
            <span className="text-2xl font-bold" style={{ color: "#c9a961" }}>
              E
            </span>
          </div>
          <h1
            className="text-2xl font-bold tracking-tight sm:text-3xl"
            style={{ color: "#c9a961", fontFamily: "'Georgia', 'Noto Serif KR', serif" }}
          >
            ETHOS 행정사사무소
          </h1>
          <p className="mt-2 text-sm" style={{ color: "rgba(255,255,255,0.7)" }}>
            운영 현황 대시보드
          </p>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* 현재 진행 중인 사건 */}
          <div
            className="rounded-xl p-6 text-center shadow-sm"
            style={{ backgroundColor: "#fff", border: "1px solid #e0d5c0" }}
          >
            <p className="text-xs font-medium uppercase tracking-wider" style={{ color: "#1a3c5f" }}>
              현재 진행 중인 사건
            </p>
            <p className="mt-3 text-4xl font-bold" style={{ color: "#1a3c5f" }}>
              {activeCases}
            </p>
            <p className="mt-1 text-xs" style={{ color: "#999" }}>건</p>
          </div>

          {/* 평균 첫 응답 시간 + 진행 링 */}
          <div
            className="rounded-xl p-6 text-center shadow-sm"
            style={{ backgroundColor: "#fff", border: "1px solid #e0d5c0" }}
          >
            <p className="text-xs font-medium uppercase tracking-wider" style={{ color: "#1a3c5f" }}>
              평균 첫 응답 시간
            </p>
            <div className="relative mx-auto mt-3 h-24 w-24">
              <svg viewBox="0 0 100 100" className="h-full w-full">
                {/* Background ring */}
                <circle
                  cx="50" cy="50" r="42"
                  fill="none" stroke="#e0d5c0" strokeWidth="8"
                />
                {/* Progress ring */}
                <circle
                  cx="50" cy="50" r="42"
                  fill="none"
                  stroke="#c9a961"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${responsePercentClamped * 2.64} 264`}
                  transform="rotate(-90 50 50)"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-bold" style={{ color: "#1a3c5f" }}>
                  {avgResponseHours}
                </span>
                <span className="text-[10px]" style={{ color: "#999" }}>시간</span>
              </div>
            </div>
            <p className="mt-1 text-[10px]" style={{ color: "#999" }}>
              목표 {TARGET_HOURS}시간 이내
            </p>
          </div>

          {/* 이번 달 완료 사건 */}
          <div
            className="rounded-xl p-6 text-center shadow-sm"
            style={{ backgroundColor: "#fff", border: "1px solid #e0d5c0" }}
          >
            <p className="text-xs font-medium uppercase tracking-wider" style={{ color: "#1a3c5f" }}>
              이번 달 완료 사건
            </p>
            <p className="mt-3 text-4xl font-bold" style={{ color: "#1a3c5f" }}>
              {closedThisMonth}
            </p>
            <p className="mt-1 text-xs" style={{ color: "#999" }}>건</p>
          </div>
        </div>

        {/* Weekly Chart */}
        <div
          className="rounded-xl p-6 shadow-sm sm:p-8"
          style={{ backgroundColor: "#fff", border: "1px solid #e0d5c0" }}
        >
          <h2
            className="mb-6 text-sm font-bold uppercase tracking-wider"
            style={{ color: "#1a3c5f", fontFamily: "'Georgia', 'Noto Serif KR', serif" }}
          >
            최근 7일 종결 사건
          </h2>
          <div className="overflow-x-auto">
            <svg
              viewBox={`0 0 ${chartW} ${chartH + 30}`}
              className="mx-auto w-full max-w-[560px]"
              role="img"
              aria-label="최근 7일 종결 사건 바 차트"
            >
              {dailyClosed.map((d, i) => {
                const x = barGap + i * (barW + barGap);
                const barMaxH = chartH - 20;
                const h =
                  maxDailyCount > 0
                    ? Math.max(4, (d.count / maxDailyCount) * barMaxH)
                    : 4;
                const y = chartH - h;
                return (
                  <g key={i}>
                    <rect
                      x={x}
                      y={y}
                      width={barW}
                      height={h}
                      rx={4}
                      fill="#1a3c5f"
                    />
                    {/* count label */}
                    <text
                      x={x + barW / 2}
                      y={y - 6}
                      textAnchor="middle"
                      fill="#1a3c5f"
                      fontSize="12"
                      fontWeight="bold"
                    >
                      {d.count}
                    </text>
                    {/* date label */}
                    <text
                      x={x + barW / 2}
                      y={chartH + 18}
                      textAnchor="middle"
                      fill="#999"
                      fontSize="11"
                    >
                      {d.label}
                    </text>
                  </g>
                );
              })}
              {/* baseline */}
              <line
                x1={barGap}
                y1={chartH}
                x2={chartW - barGap}
                y2={chartH}
                stroke="#e0d5c0"
                strokeWidth="1"
              />
            </svg>
          </div>
        </div>

        {/* Disclaimer */}
        <footer
          className="rounded-xl px-6 py-5 text-center"
          style={{ backgroundColor: "rgba(26, 60, 95, 0.06)", border: "1px solid #e0d5c0" }}
        >
          <p className="text-xs leading-5" style={{ color: "#666" }}>
            본 페이지의 수치는 실시간 운영 데이터에 기반하며, 특정 결과를 보장하지 않습니다.
            <br />
            행정사는 다른 사람의 위임에 의하여 관공서에 제출하는 서류의 작성, 권리의무나
            사실증명에 관한 서류의 작성, 행정관련 업무의 대리 등을 수행하는 전문직입니다.
          </p>
          <p className="mt-3 text-[10px]" style={{ color: "#999" }}>
            &copy; ETHOS 행정사사무소 &middot; 대표 행정사 진상진
          </p>
        </footer>
      </div>
    </div>
  );
}
