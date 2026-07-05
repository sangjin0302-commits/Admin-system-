import { NextResponse } from "next/server";
import {
  verifyKakaoSignature,
  parseCommand,
  executeCommand,
  logInteraction,
  sendResponse,
} from "@/lib/services/kakao-workspace-bot";
import { logger } from "@/lib/utils/logger";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  const raw = await req.text();
  const sig = req.headers.get("x-kakao-signature");
  if (!verifyKakaoSignature(raw, sig)) {
    return NextResponse.json({ ok: false, error: "invalid signature" }, { status: 401 });
  }
  let payload: { text?: string; user?: { id?: string; name?: string }; channelId?: string };
  try {
    payload = JSON.parse(raw);
  } catch {
    return NextResponse.json({ ok: false, error: "invalid json" }, { status: 400 });
  }

  const text = (payload.text ?? "").trim();
  if (!text) return NextResponse.json({ ok: true, ignored: true });

  const cmd = parseCommand(text);
  const response = await executeCommand(cmd);
  await logInteraction({
    sender: payload.user?.name ?? payload.user?.id ?? "unknown",
    inputText: text,
    command: cmd.type,
    response,
    ok: true,
  });
  const send = await sendResponse(payload.channelId ?? "", response);
  logger.info(`[kakao-workspace-webhook] cmd=${cmd.type} sent=${send.sent} dryRun=${send.dryRun}`);
  return NextResponse.json({ ok: true, response });
}
