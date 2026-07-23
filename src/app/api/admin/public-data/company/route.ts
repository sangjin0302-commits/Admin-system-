import { NextResponse } from "next/server";
import { getCompanyInfo } from "@/lib/services/public-data-service";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { bizNo } = await req.json();
    const result = await getCompanyInfo(String(bizNo ?? ""));
    return NextResponse.json({ ok: true, result });
  } catch (err) {
    console.error("[admin/public-data/company] failed", err);
    return NextResponse.json(
      { ok: false, error: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
