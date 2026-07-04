import { NextResponse } from "next/server";
import { lawbotCache } from "@/lib/services/lawbot-cache";

export async function GET() {
  const stats = lawbotCache.getStats();
  return NextResponse.json(stats);
}

export async function DELETE(request: Request) {
  // Simple auth check via service key header
  const authHeader = request.headers.get("x-admin-key");
  const expectedKey = process.env.ADMIN_API_KEY;

  if (!expectedKey || authHeader !== expectedKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  lawbotCache.clear();
  return NextResponse.json({ success: true, message: "Lawbot cache cleared" });
}
