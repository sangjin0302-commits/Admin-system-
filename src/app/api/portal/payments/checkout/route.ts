import { NextResponse } from "next/server";
import { z } from "zod";
import { createPaymentSession } from "@/lib/services/payment-service";
import { captureError } from "@/lib/services/error-monitor-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const checkoutSchema = z.object({
  caseId: z.string().min(1).max(64),
  amount: z.number().int().positive().max(100_000_000),
  orderName: z.string().min(1).max(100),
  customerName: z.string().min(1).max(50),
  customerEmail: z.string().email().max(120),
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid json" }, { status: 400 });
  }

  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "invalid body" },
      { status: 400 }
    );
  }

  const { caseId, amount, orderName, customerName, customerEmail } = parsed.data;
  const orderId = `CASE-${caseId}-${Date.now().toString(36)}`;

  try {
    const session = await createPaymentSession({
      orderId,
      amount,
      orderName,
      customerName,
      customerEmail,
    });
    return NextResponse.json({ ok: true, orderId, ...session });
  } catch (err) {
    captureError(err instanceof Error ? err : new Error(String(err)), { caseId });
    return NextResponse.json(
      { ok: false, error: "결제 세션 생성에 실패했습니다." },
      { status: 502 }
    );
  }
}
