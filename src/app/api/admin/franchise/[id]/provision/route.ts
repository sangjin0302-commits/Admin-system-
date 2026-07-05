import { NextResponse } from "next/server";
import { provisionFranchise } from "@/lib/services/franchise-service";

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const result = await provisionFranchise(id, {});
  if (!result) return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
  return NextResponse.json({ ok: true, franchise: result });
}
