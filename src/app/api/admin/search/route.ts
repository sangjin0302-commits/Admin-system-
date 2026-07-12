import { NextRequest, NextResponse } from "next/server";
import { searchInquiries } from "@/lib/services/admin-search-service";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") || "";
  const results = await searchInquiries(q);
  return NextResponse.json({ results });
}
