/**
 * 통역 세션 SSE 엔드포인트.
 * GET  ?sessionId=... → SSE 스트림 (연결 유지 + 새 턴 알림)
 * POST { action: "create"|"turn"|"end", ... }
 */

import { NextResponse } from "next/server";
import {
  addTurn,
  createSession,
  endSession,
  getSession,
  SUPPORTED_LANGS,
  type Lang,
} from "@/lib/services/realtime-interpreter-service";

export const dynamic = "force-dynamic";

function isLang(v: unknown): v is Lang {
  return typeof v === "string" && (SUPPORTED_LANGS as string[]).includes(v);
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const sessionId = url.searchParams.get("sessionId");
  if (!sessionId) return NextResponse.json({ ok: false, error: "MISSING_SESSION" }, { status: 400 });
  const session = getSession(sessionId);
  if (!session) return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });

  const encoder = new TextEncoder();
  let lastCount = session.turns.length;

  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue(encoder.encode(`event: init\ndata: ${JSON.stringify(session)}\n\n`));
      const timer = setInterval(() => {
        const s = getSession(sessionId);
        if (!s) {
          clearInterval(timer);
          controller.enqueue(encoder.encode(`event: end\ndata: {}\n\n`));
          controller.close();
          return;
        }
        if (s.turns.length > lastCount) {
          const newTurns = s.turns.slice(lastCount);
          lastCount = s.turns.length;
          for (const t of newTurns) {
            controller.enqueue(encoder.encode(`event: turn\ndata: ${JSON.stringify(t)}\n\n`));
          }
        } else {
          controller.enqueue(encoder.encode(`: ping\n\n`));
        }
      }, 2000);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

interface Body {
  action: "create" | "turn" | "end";
  adminLang?: Lang;
  clientLang?: Lang;
  caseId?: string;
  sessionId?: string;
  speaker?: "admin" | "client";
  text?: string;
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as Body | null;
  if (!body) return NextResponse.json({ ok: false }, { status: 400 });
  if (body.action === "create" && isLang(body.adminLang) && isLang(body.clientLang)) {
    const s = createSession({
      adminLang: body.adminLang,
      clientLang: body.clientLang,
      caseId: body.caseId,
    });
    return NextResponse.json({ ok: true, session: s });
  }
  if (body.action === "turn" && body.sessionId && body.speaker && body.text) {
    const turn = await addTurn(body.sessionId, body.speaker, body.text);
    return NextResponse.json({ ok: !!turn, turn });
  }
  if (body.action === "end" && body.sessionId) {
    const s = endSession(body.sessionId);
    return NextResponse.json({ ok: true, session: s });
  }
  return NextResponse.json({ ok: false, error: "UNKNOWN_ACTION" }, { status: 400 });
}
