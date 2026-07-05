import { NextResponse } from "next/server";
import { getWhitepaper, recordPurchase } from "@/lib/services/whitepaper-service";

export async function POST(req: Request) {
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
