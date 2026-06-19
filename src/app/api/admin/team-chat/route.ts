import { NextResponse } from "next/server";
import { getMessages, postMessage } from "@/lib/services/team-chat-service";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const caseId = url.searchParams.get("caseId");
  if (!caseId) {
    return NextResponse.json({ error: "caseId required" }, { status: 400 });
  }
  const messages = getMessages(caseId).map((m) => ({
    ...m,
    createdAt: m.createdAt.toISOString(),
  }));
  return NextResponse.json({ messages });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { caseId, message, authorEmail, authorName } = body ?? {};
    if (!caseId || !message || !authorEmail || !authorName) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }
    const msg = postMessage(caseId, authorEmail, authorName, message);
    return NextResponse.json({
      message: { ...msg, createdAt: msg.createdAt.toISOString() },
    }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error" },
      { status: 500 }
    );
  }
}
