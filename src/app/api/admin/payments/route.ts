import { prisma } from "@/lib/prisma/client";
import { createAdminRequestContext } from "@/lib/http/admin-api";
import { isTossConnected } from "@/lib/services/payment-service";

export const dynamic = "force-dynamic";

export async function GET() {
  const api = createAdminRequestContext("admin.payments.list");
  try {
    const memos = await prisma.caseAccountingMemo.findMany({
      orderBy: [{ paidAt: "desc" }, { updatedAt: "desc" }],
      take: 200,
      include: {
        caseMatter: {
          select: {
            id: true,
            caseNo: true,
            title: true,
          },
        },
      },
    });

    const items = memos.map((m) => ({
      id: m.id,
      caseId: m.caseId,
      caseNo: m.caseMatter?.caseNo ?? null,
      caseTitle: m.caseMatter?.title ?? null,
      feeAmount: m.feeAmount,
      feeStatus: m.feeStatus,
      paymentStatus: m.paymentStatus,
      paidAmount: m.paidAmount,
      paidAt: m.paidAt?.toISOString() ?? null,
      paymentMemo: m.paymentMemo,
    }));

    return api.ok({
      ok: true,
      tossConnected: isTossConnected(),
      items,
    });
  } catch (err) {
    api.logError(err);
    return api.error(500, "결제 내역을 조회하지 못했습니다.", {
      code: "PAYMENTS_LIST_FAILED",
    });
  }
}
