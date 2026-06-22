import { NextResponse } from "next/server";
import { z } from "zod";
import { cancelPayment } from "@/lib/services/payment-service";
import { createAdminRequestContext } from "@/lib/http/admin-api";
import {
  requireRole,
  logAdminAudit,
  ipFromRequest,
} from "@/lib/services/admin-rbac-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const cancelSchema = z.object({
  paymentKey: z.string().min(1).max(200),
  reason: z.string().min(1).max(200),
  cancelAmount: z.number().int().positive().max(100_000_000).optional(),
});

export async function POST(req: Request) {
  const api = createAdminRequestContext("admin.payments.cancel");

  // RBAC: 결제 취소는 SUPER 또는 MANAGER만
  const guard = await requireRole(req, ["SUPER", "MANAGER"]);
  if (!guard.ok) return guard.response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return api.error(400, "invalid json", { code: "INVALID_JSON" });
  }
  const parsed = cancelSchema.safeParse(body);
  if (!parsed.success) {
    return api.error(400, parsed.error.issues[0]?.message ?? "invalid body", {
      code: "INVALID_BODY",
    });
  }

  const result = await cancelPayment(
    parsed.data.paymentKey,
    parsed.data.reason,
    parsed.data.cancelAmount
  );

  await logAdminAudit({
    actorEmail: guard.user.email,
    actorRole: guard.user.role,
    action: "PAYMENT_CANCEL",
    resource: "Payment",
    resourceId: parsed.data.paymentKey,
    details: {
      reason: parsed.data.reason,
      cancelAmount: parsed.data.cancelAmount,
      success: result.success,
      error: result.error,
    },
    ip: ipFromRequest(req),
    userAgent: req.headers.get("user-agent") ?? undefined,
  });

  if (!result.success) {
    return api.error(502, result.error ?? "결제 취소 실패", {
      code: "TOSS_CANCEL_FAILED",
    });
  }

  return NextResponse.json({
    ok: true,
    transactionId: result.transactionId,
  });
}
