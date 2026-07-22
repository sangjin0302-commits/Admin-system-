import { NextResponse } from "next/server";

import { detectPII, maskPII } from "@/lib/services/pii-masking-service";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const text: string = typeof body?.text === "string" ? body.text : "";
  const action: string = body?.action === "mask" ? "mask" : "detect";

  try {
    if (action === "mask") {
      return NextResponse.json({ masked: maskPII(text) });
    }
    return NextResponse.json({ detected: detectPII(text) });
  } catch (error) {
    console.error("admin/pii-mask POST failed", error);
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  }
}
