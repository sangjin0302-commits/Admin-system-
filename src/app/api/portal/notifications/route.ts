import { NextResponse } from "next/server";

import { auth } from "@/lib/auth/auth";
import {
  countUnreadPortalNotifications,
  listPortalNotifications,
  markAllPortalNotificationsRead
} from "@/lib/services/portal-notifications";

export async function GET() {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) {
    return NextResponse.json({ ok: false, error: "로그인이 필요합니다." }, { status: 401 });
  }

  const [items, unread] = await Promise.all([
    listPortalNotifications(userId, { limit: 100 }),
    countUnreadPortalNotifications(userId)
  ]);

  return NextResponse.json({ ok: true, items, unread });
}

export async function POST() {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) {
    return NextResponse.json({ ok: false, error: "로그인이 필요합니다." }, { status: 401 });
  }

  // 전체 읽음 처리
  const result = await markAllPortalNotificationsRead(userId);
  return NextResponse.json({ ok: true, marked: result.count });
}
