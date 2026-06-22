import { NextResponse } from "next/server";
import { z } from "zod";
import { cancelPayment } from "@/lib/services/payment-service";
import { createAdminRequestContext } from "@/lib/http/admin-api";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const cancelSchema = z.object({
  paymentKey: z.string().min(1).max(200),
  reason: z.string().min(1).max(200),
  cancelAmount: z.number().int().positive().max(100_000_000).optional(),
});

export async function POST(req: Request) {
  const api = createAdminRequestContext("admin.payments.cancel");
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
