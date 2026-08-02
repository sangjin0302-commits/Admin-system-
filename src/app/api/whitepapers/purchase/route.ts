import { NextResponse } from "next/server";
import { getWhitepaper, recordPurchase } from "@/lib/services/whitepaper-service";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";

export async function POST(req: Request) {
  // 기능 잠금 시 결제 API 직접 호출도 차단.
  if (!(await isFeatureEnabled("whitepapers_enabled"))) {
    return NextResponse.json({ ok: false, error: "DISABLED" }, { status: 403 });
  }
  const body = (await req.json().catch(() => null)) as
    | { whitepaperId?: string; buyerEmail?: string; tossPaymentKey?: string }
    | null;
  if (!body?.whitepaperId || !body.buyerEmail) {
    return NextResponse.json({ ok: false, error: "INVALID" }, { status: 400 });
  }
  const wp = await getWhitepaper(body.whitepaperId);
  if (!wp || !wp.published) return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
  const { purchase, downloadUrl } = await recordPurchase({
    whitepaperId: wp.id,
    buyerEmail: body.buyerEmail,
    amountKrw: wp.price,
    tossPaymentKey: body.tossPaymentKey,
  });
  return NextResponse.json({ ok: true, purchase, downloadUrl });
}
