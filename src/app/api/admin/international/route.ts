import { NextResponse } from "next/server";
import {
  listShippingRequests,
  updateShippingRequest,
  type ShippingStatus,
  type ShippingCarrier,
} from "@/lib/services/document-shipping-service";
import {
  listRequests as listNotary,
  updateNotaryRequest,
  type NotaryStatus,
} from "@/lib/services/notary-integration-service";

export async function GET() {
  const [shipping, notary] = await Promise.all([listShippingRequests(), listNotary()]);
  return NextResponse.json({ ok: true, shipping, notary });
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as
    | { kind?: "shipping" | "notary"; id?: string; status?: string; trackingNumber?: string; carrier?: ShippingCarrier; notes?: string }
    | null;
  if (!body?.kind || !body.id || !body.status) {
    return NextResponse.json({ ok: false, error: "INVALID" }, { status: 400 });
  }
  if (body.kind === "shipping") {
    await updateShippingRequest(body.id, {
      status: body.status as ShippingStatus,
      trackingNumber: body.trackingNumber,
      carrier: body.carrier,
      notes: body.notes,
    });
    const shipping = await listShippingRequests();
    return NextResponse.json({ ok: true, shipping });
  }
  await updateNotaryRequest(body.id, { status: body.status as NotaryStatus, notes: body.notes });
  const notary = await listNotary();
  return NextResponse.json({ ok: true, notary });
}
