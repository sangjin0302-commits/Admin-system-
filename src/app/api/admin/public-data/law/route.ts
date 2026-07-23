import { NextResponse } from "next/server";
import { searchLaw } from "@/lib/services/public-data-service";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { keyword, limit } = await req.json();
    const result = await searchLaw(String(keyword ?? ""), Number(limit ?? 10));
    return NextResponse.json({ ok: true, result });
  } catch (err) {
    console.error("[admin/public-data/law] failed", err);
    return NextResponse.json(
      { ok: false, error: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
