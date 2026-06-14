import { NextResponse } from "next/server";

import { auth } from "@/lib/auth/auth";
import { markPortalNotificationRead } from "@/lib/services/portal-notifications";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) {
    return NextResponse.json({ ok: false, error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { id } = await context.params;
  if (!id) return NextResponse.json({ ok: false, error: "INVALID_ID" }, { status: 400 });

  const result = await markPortalNotificationRead(id, userId);
  return NextResponse.json({ ok: true, marked: result.count });
}
