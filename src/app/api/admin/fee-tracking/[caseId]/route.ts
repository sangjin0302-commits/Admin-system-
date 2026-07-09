import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { logger } from "@/lib/utils/logger";

export async function POST(request: Request, { params }: { params: Promise<{ caseId: string }> }) {
  try {
    const { caseId } = await params;
    const body = await request.json();
    const { amount, note, totalFee } = body as { amount?: number; note?: string; totalFee?: number };

    const existing = await prisma.siteSetting.findUnique({ where: { key: "fee_tracking_data" } });
    const feeData: Record<string, { totalFee: number; payments: { amount: number; date: string; note: string }[] }> = existing?.value ? JSON.parse(existing.value) : {};

    if (!feeData[caseId]) {
      feeData[caseId] = { totalFee: 0, payments: [] };
    }

    if (totalFee !== undefined) {
      feeData[caseId].totalFee = totalFee;
    }

    if (amount && amount > 0) {
      feeData[caseId].payments.push({
        amount,
        date: new Date().toISOString(),
        note: note || "",
      });
    }

    await prisma.siteSetting.upsert({
      where: { key: "fee_tracking_data" },
      update: { value: JSON.stringify(feeData) },
      create: { key: "fee_tracking_data", value: JSON.stringify(feeData) },
    });

    return NextResponse.json({ ok: true, data: feeData[caseId] });
  } catch (err) {
    logger.error("Fee tracking POST error:", err);
    return NextResponse.json({ error: "저장 실패" }, { status: 500 });
  }
}
