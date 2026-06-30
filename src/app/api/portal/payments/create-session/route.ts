import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createPaymentSession } from "@/lib/services/payment-service";
import { logger } from "@/lib/utils/logger";

export async function POST(req: Request) {
  try {
    const { amount, orderName, caseId } = await req.json();
    if (!amount || !orderName) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const orderId = caseId
      ? `CASE-${caseId}-${Date.now().toString(36)}`
      : `CONSULT-${Date.now().toString(36)}-${randomUUID().slice(0, 6)}`;

    const session = await createPaymentSession({
      orderId,
      amount,
      orderName,
      customerName: "고객",
      customerEmail: "customer@example.com",
      caseId,
    });

    return NextResponse.json({ orderId });
  } catch (err) {
    logger.warn("[payment-session] error", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
