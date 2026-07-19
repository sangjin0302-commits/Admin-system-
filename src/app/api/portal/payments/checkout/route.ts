import { NextResponse } from "next/server";
import { z } from "zod";
import { createPaymentSession } from "@/lib/services/payment-service";
import { captureError } from "@/lib/services/error-monitor-service";
import { requirePortalUser } from "@/lib/security/portal-auth";

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
  // 인증 필수. 예전에는 누구나 임의의 caseId·금액으로 결제 주문을 만들 수 있었고,
  // 그 금액이 그대로 승인 기준이 되어 스스로 1원짜리 청구서를 만들 수 있었다.
  const authed = await requirePortalUser();
  if (authed instanceof NextResponse) return authed;

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

  const { caseId, amount, orderName, customerName } = parsed.data;
  const orderId = `CASE-${caseId}-${Date.now().toString(36)}`;

  try {
    const session = await createPaymentSession({
      orderId,
      amount,
      orderName,
      customerName,
      // 본문의 customerEmail 은 무시한다 — 주문 소유자는 언제나 로그인한 본인이고,
      // confirm 단계의 소유권 검증이 이 값을 기준으로 이뤄진다.
      customerEmail: authed.email,
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
