import { prisma } from "@/lib/prisma/client";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { CaseMatterStatus } from "@generated/prisma-client/client";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ETHOS 행정사사무소 — 운영 현황",
};

export const revalidate = 300;

export default async function StatusPage() {
  const enabled = await isFeatureEnabled("public_trust_dashboard");
  if (!enabled) return notFound();

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86_400_000);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [activeCases, respondedInquiries, closedThisMonth] = await Promise.all([
    // 현재 진행 중인 사건
    prisma.caseMatter.count({
      where: {
        status: { notIn: [CaseMatterStatus.CLOSED, CaseMatterStatus.CANCELLED] },
      },
    }),
    // 평균 첫 응답 시간 (최근 30일)
    prisma.inquiry.findMany({
      where: {
        firstResponseAt: { not: null },
        createdAt: { gte: thirtyDaysAgo },
      },
      select: { createdAt: true, firstResponseAt: true },
    }),
    // 이번 달 완료 사건
    prisma.caseMatter.count({
      where: {
        status: CaseMatterStatus.CLOSED,
        closedAt: { gte: monthStart },
      },
    }),
  ]);

  // 평균 첫 응답 시간 (시간 단위)
  let avgResponseHours = 0;
  if (respondedInquiries.length > 0) {
    const totalMs = respondedInquiries.reduce((sum, inq) => {
      return sum + (inq.firstResponseAt!.getTime() - inq.createdAt.getTime());
    }, 0);
    avgResponseHours = Math.round(totalMs / respondedInquiries.length / 3_600_000 * 10) / 10;
  }

  return (
    <div className="min-h-screen bg-[#0a1628] text-white flex items-center justify-center p-6">
      <div className="w-full max-w-2xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: "#c8a44e" }}>
            ETHOS 행정사사무소
          </h1>
          <p className="text-sm text-gray-400">운영 현황</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-gray-700 bg-[#111d33] p-6 text-center">
            <p className="text-sm text-gray-400">현재 진행 중인 사건</p>
            <p className="mt-2 text-4xl font-bold" style={{ color: "#c8a44e" }}>
              {activeCases}
            </p>
          </div>
          <div className="rounded-xl border border-gray-700 bg-[#111d33] p-6 text-center">
            <p className="text-sm text-gray-400">평균 첫 응답 시간</p>
            <p className="mt-2 text-4xl font-bold" style={{ color: "#c8a44e" }}>
              {avgResponseHours}
              <span className="ml-1 text-lg font-normal text-gray-400">시간</span>
            </p>
          </div>
          <div className="rounded-xl border border-gray-700 bg-[#111d33] p-6 text-center">
            <p className="text-sm text-gray-400">이번 달 완료 사건</p>
            <p className="mt-2 text-4xl font-bold" style={{ color: "#c8a44e" }}>
              {closedThisMonth}
            </p>
          </div>
        </div>

        {/* Disclaimer */}
        <p className="text-center text-xs text-gray-500">
          실시간 운영 데이터입니다. 결과를 보장하지 않습니다.
        </p>
      </div>
    </div>
  );
}
