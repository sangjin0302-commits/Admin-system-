import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { logger } from "@/lib/utils/logger";

export async function GET() {
  try {
    const cases = await prisma.caseMatter.findMany({
      select: { id: true, caseNo: true, title: true, matterType: true, status: true },
      orderBy: { createdAt: "desc" },
    });

    const feeSetting = await prisma.siteSetting.findUnique({
      where: { key: "fee_tracking_data" },
    });
    const feeData: Record<string, { totalFee: number; payments: { amount: number; date: string; note: string }[] }> = feeSetting?.value ? JSON.parse(feeSetting.value) : {};

    let totalFees = 0;
    let totalCollected = 0;
    const rows = cases.map((c) => {
      const info = feeData[c.id] || { totalFee: 0, payments: [] };
      const paid = info.payments.reduce((sum: number, p: { amount: number }) => sum + p.amount, 0);
      totalFees += info.totalFee;
      totalCollected += paid;
      return { id: c.id, caseNo: c.caseNo, title: c.title, totalFee: info.totalFee, paid, balance: info.totalFee - paid };
    });

    return NextResponse.json({
      kpi: { totalFees, totalCollected, outstanding: totalFees - totalCollected, collectionRate: totalFees > 0 ? Math.round((totalCollected / totalFees) * 100) : 0 },
      rows,
    });
  } catch (err) {
    logger.error("Fee tracking GET error:", err);
    return NextResponse.json({ error: "조회 실패" }, { status: 500 });
  }
}
