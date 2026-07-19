import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createPaymentSession } from "@/lib/services/payment-service";
import { logger } from "@/lib/utils/logger";
import { requirePortalUser } from "@/lib/security/portal-auth";

export async function POST(req: Request) {
  // 인증 필수. 예전에는 누구나 임의 금액의 결제 주문을 만들 수 있었다.
  const authed = await requirePortalUser();
  if (authed instanceof NextResponse) return authed;

  try {
    const { amount, orderName, caseId } = await req.json();
    if (!amount || !orderName) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }
    if (!Number.isInteger(amount) || amount <= 0 || amount > 100_000_000) {
      return NextResponse.json({ error: "금액이 올바르지 않습니다." }, { status: 400 });
    }

    const orderId = caseId
      ? `CASE-${caseId}-${Date.now().toString(36)}`
      : `CONSULT-${Date.now().toString(36)}-${randomUUID().slice(0, 6)}`;

    const session = await createPaymentSession({
      orderId,
      amount,
      orderName,
      // 주문 소유자를 세션 기준으로 기록한다. 예전에는 자리표시자 이메일이
      // 들어가 confirm 단계에서 소유권을 확인할 방법이 아예 없었다.
      customerName: authed.email,
      customerEmail: authed.email,
      caseId,
    });

    return NextResponse.json({ orderId });
  } catch (err) {
    logger.warn("[payment-session] error", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
