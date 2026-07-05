import { NextResponse } from "next/server";

import { handleReply } from "@/lib/services/scheduling-bot-service";
import { logger } from "@/lib/utils/logger";

export const maxDuration = 30;

/**
 * 이메일 회신 웹훅. 지원 포맷:
 *  - JSON: { "text": "..." }
 *  - SendGrid Inbound Parse (multipart): field "text" 또는 "email"
 *  - Resend Inbound (JSON): { "text": "..." } / { "email": { "text": "..." } }
 */
export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") || "";
    let raw = "";

    if (contentType.includes("application/json")) {
      const body = (await request.json().catch(() => ({}))) as {
        text?: string;
        email?: { text?: string };
      };
      raw = body.text ?? body.email?.text ?? "";
    } else if (contentType.includes("multipart/form-data") || contentType.includes("application/x-www-form-urlencoded")) {
      const form = await request.formData();
      raw =
        (form.get("text") as string | null) ??
        (form.get("email") as string | null) ??
        (form.get("body-plain") as string | null) ??
        "";
    } else {
      raw = await request.text();
    }

    if (!raw || raw.length < 3) {
      return NextResponse.json({ ok: false, message: "본문이 비어 있습니다." }, { status: 400 });
    }

    const result = await handleReply(raw);
    if (!result.ok) {
      return NextResponse.json({ ok: false, message: result.message ?? "회신 처리 실패" }, { status: 200 });
    }
    return NextResponse.json({ ok: true, sessionStatus: result.session?.status ?? null });
  } catch (error) {
    logger.error("[webhooks/scheduling-reply] failed", error);
    return NextResponse.json({ ok: false, message: "처리 실패" }, { status: 500 });
  }
}
