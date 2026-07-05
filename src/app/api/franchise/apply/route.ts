import { NextResponse } from "next/server";
import { applyFranchise, FRANCHISE_PLANS } from "@/lib/services/franchise-service";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";

export async function POST(req: Request) {
  if (!(await isFeatureEnabled("franchise_saas"))) {
    return NextResponse.json({ ok: false, error: "FEATURE_DISABLED" }, { status: 404 });
  }
  const body = await req.json().catch(() => null);
  if (!body || typeof body.orgName !== "string" || typeof body.adminEmail !== "string") {
    return NextResponse.json({ ok: false, error: "INVALID_BODY" }, { status: 400 });
  }
  const plan = body.plan in FRANCHISE_PLANS ? body.plan : "pro";
  const item = await applyFranchise({
    orgName: body.orgName,
    adminEmail: body.adminEmail,
    contactName: typeof body.contactName === "string" ? body.contactName : undefined,
    plan,
    estimatedCases: typeof body.estimatedCases === "number" ? body.estimatedCases : undefined,
    note: typeof body.note === "string" ? body.note : undefined,
  });
  return NextResponse.json({ ok: true, id: item.id });
}
