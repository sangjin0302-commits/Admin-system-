import { NextResponse } from "next/server";

import {
  brainstormTurn,
  exportBrainstormSession,
  loadBrainstormSession,
  type BrainstormMode
} from "@/lib/services/case-strategy-brainstorm-service";
import { logger } from "@/lib/utils/logger";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const caseId = url.searchParams.get("caseId");
  const doExport = url.searchParams.get("export") === "1";
  if (!caseId) return NextResponse.json({ error: "caseId 필요" }, { status: 400 });
  try {
    if (doExport) {
      const text = await exportBrainstormSession(caseId);
      return new NextResponse(text, {
        headers: { "Content-Type": "text/plain; charset=utf-8" }
      });
    }
    const messages = await loadBrainstormSession(caseId);
    return NextResponse.json({ messages });
  } catch (err) {
    logger.error("[brainstorm] GET failed", err);
    return NextResponse.json({ error: "조회 실패" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  let body: { caseId?: string; message?: string; mode?: string } = {};
  try {
    body = (await req.json()) as { caseId?: string; message?: string; mode?: string };
  } catch {
    // ignore
  }
  const caseId = (body.caseId ?? "").trim();
  const message = (body.message ?? "").trim();
  const mode = (body.mode ?? "자유") as BrainstormMode;
  if (!caseId || !message) return NextResponse.json({ error: "caseId·message 필요" }, { status: 400 });

  try {
    const result = await brainstormTurn(caseId, message, mode);
    return NextResponse.json(result);
  } catch (err) {
    logger.error("[brainstorm] POST failed", err);
    return NextResponse.json({ error: "brainstorm 실패" }, { status: 500 });
  }
}
