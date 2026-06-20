import { NextResponse } from "next/server";
import { sendMessage } from "@/lib/services/naver-talktalk-service";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const ok = await sendMessage({
      userId: body.userId,
      message: body.message ?? "",
      quickReplies: body.quickReplies,
    });
    return NextResponse.json({ ok });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: String(err) },
      { status: 500 }
    );
  }
}
