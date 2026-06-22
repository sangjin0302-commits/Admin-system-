import { prisma } from "@/lib/prisma/client";
import { createAdminRequestContext } from "@/lib/http/admin-api";
import {
  isTossConnected,
  listPayments,
  getPaymentStats,
} from "@/lib/services/payment-service";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/payments
 *  - Payment 테이블 (Round W 신규) + CaseAccountingMemo (legacy) 병합
 *  - tossConnected, stats 포함
 */
export async function GET() {
  const api = createAdminRequestContext("admin.payments.list");
  try {
    const [payments, stats, memos] = await Promise.all([
      listPayments(100),
      getPaymentStats(),
      prisma.caseAccountingMemo.findMany({
        orderBy: [{ paidAt: "desc" }, { updatedAt: "desc" }],
        take: 50,
        include: {
          caseMatter: { select: { caseNo: true, title: true } },
        },
      }),
    ]);

    return api.ok({
      ok: true,
      tossConnected: isTossConnected(),
      stats,
      payments: payments.map((p) => ({
        ...p,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
        approvedAt: p.approvedAt?.toISOString() ?? null,
        canceledAt: p.canceledAt?.toISOString() ?? null,
      })),
      accountingMemos: memos.map((m) => ({
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
      })),
    });
  } catch (err) {
    api.logError(err);
    return api.error(500, "결제 내역을 조회하지 못했습니다.", {
      code: "PAYMENTS_LIST_FAILED",
    });
  }
}
