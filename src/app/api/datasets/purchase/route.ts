import { NextResponse } from "next/server";
import { createOrder, getDataset } from "@/lib/services/dataset-marketplace-service";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";

export async function POST(req: Request) {
  if (!(await isFeatureEnabled("dataset_marketplace"))) {
    return NextResponse.json({ ok: false, error: "FEATURE_DISABLED" }, { status: 404 });
  }
  const body = await req.json().catch(() => null);
  if (!body?.datasetId || !body?.buyerEmail) {
    return NextResponse.json({ ok: false, error: "INVALID_BODY" }, { status: 400 });
  }
  const ds = await getDataset(body.datasetId);
  if (!ds || !ds.published) return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
  const orderId = `dso_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const order = await createOrder({
    datasetId: ds.id,
    buyerEmail: String(body.buyerEmail),
    buyerOrg: body.buyerOrg ? String(body.buyerOrg) : undefined,
    orderId,
    amount: ds.price,
  });
  return NextResponse.json({ ok: true, orderId: order.orderId });
}
