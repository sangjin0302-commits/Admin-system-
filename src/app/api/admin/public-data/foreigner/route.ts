import { NextResponse } from "next/server";
import { lookupForeignerStatus } from "@/lib/services/public-data-service";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { passportNo } = await req.json();
    const result = await lookupForeignerStatus(String(passportNo ?? ""));
    return NextResponse.json({ ok: true, result });
  } catch (err) {
    console.error("[admin/public-data/foreigner] failed", err);
    return NextResponse.json(
      { ok: false, error: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
