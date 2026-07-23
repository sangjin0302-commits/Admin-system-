import { NextResponse } from "next/server";
import { handleIncomingMessage } from "@/lib/services/naver-talktalk-service";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const result = await handleIncomingMessage(payload);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("[webhooks/naver-talktalk] failed", err);
    return NextResponse.json(
      { ok: false, error: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
