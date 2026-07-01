import { NextRequest, NextResponse } from "next/server";

// In-memory store (Vercel serverless — resets on cold start)
const subscriptions = new Map<string, PushSubscription>();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.endpoint) {
      return NextResponse.json({ error: "Missing endpoint" }, { status: 400 });
    }
    subscriptions.set(body.endpoint, body);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    if (body.endpoint) {
      subscriptions.delete(body.endpoint);
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
}
