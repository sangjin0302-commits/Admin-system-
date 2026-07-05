import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { provisionApiKey, listApiKeys, getApiProduct } from "@/lib/services/api-marketplace-service";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";

export async function GET() {
  if (!(await isFeatureEnabled("api_marketplace"))) {
    return NextResponse.json({ ok: false, error: "FEATURE_DISABLED" }, { status: 404 });
  }
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ ok: false, error: "UNAUTHENTICATED" }, { status: 401 });
  const keys = await listApiKeys(session.user.id);
  return NextResponse.json({
    ok: true,
    keys: keys.map((k) => ({ id: k.id, prefix: k.prefix, productId: k.productId, createdAt: k.createdAt, revokedAt: k.revokedAt, totalCallCount: k.totalCallCount })),
  });
}

export async function POST(req: Request) {
  if (!(await isFeatureEnabled("api_marketplace"))) {
    return NextResponse.json({ ok: false, error: "FEATURE_DISABLED" }, { status: 404 });
  }
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ ok: false, error: "UNAUTHENTICATED" }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  const productId = body?.productId;
  if (!productId || !getApiProduct(productId)) {
    return NextResponse.json({ ok: false, error: "INVALID_PRODUCT" }, { status: 400 });
  }
  const { record, secret } = await provisionApiKey(session.user.id, session.user.email, productId);
  return NextResponse.json({ ok: true, secret, keyId: record.id, prefix: record.prefix });
}
