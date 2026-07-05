import { NextResponse } from "next/server";
import { updateFranchiseStatus, type FranchiseStatus } from "@/lib/services/franchise-service";

const ALLOWED: FranchiseStatus[] = ["pending", "active", "suspended", "cancelled"];

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  const status = body?.status as string | undefined;
  if (!status || !ALLOWED.includes(status as FranchiseStatus)) {
    return NextResponse.json({ ok: false, error: "INVALID_STATUS" }, { status: 400 });
  }
  const result = await updateFranchiseStatus(id, status as FranchiseStatus);
  if (!result) return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
  return NextResponse.json({ ok: true, franchise: result });
}
