import { NextResponse } from "next/server";

import { resolveError } from "@/lib/services/error-monitor-service";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { id?: string };
    if (!body?.id) {
      return NextResponse.json({ success: false }, { status: 400 });
    }
    const success = resolveError(body.id);
    return NextResponse.json({ success });
  } catch {
    return NextResponse.json({ success: false }, { status: 400 });
  }
}
