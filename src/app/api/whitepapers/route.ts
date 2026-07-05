import { NextResponse } from "next/server";
import { listWhitepapers, type WhitepaperCategory } from "@/lib/services/whitepaper-service";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const category = url.searchParams.get("category") as WhitepaperCategory | null;
  const items = await listWhitepapers({
    publishedOnly: true,
    category: category ?? undefined,
  });
  return NextResponse.json({ ok: true, items });
}
