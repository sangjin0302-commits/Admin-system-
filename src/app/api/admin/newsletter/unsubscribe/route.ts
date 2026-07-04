import { NextResponse } from "next/server";

import { unsubscribe } from "@/lib/services/newsletter-service";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = body && typeof body.email === "string" ? body.email : "";
  if (!email) return NextResponse.json({ ok: false, error: "email required" }, { status: 400 });
  const result = await unsubscribe(email);
  return NextResponse.json(result);
}
