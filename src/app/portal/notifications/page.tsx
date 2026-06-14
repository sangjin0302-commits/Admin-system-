import Link from "next/link";
import { redirect } from "next/navigation";

import { PortalHeader } from "@/components/layout/portal-header";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma/client";
import { listPortalNotifications } from "@/lib/services/portal-notifications";

import { PortalNotificationsClient } from "./client";

export const dynamic = "force-dynamic";

const EVENT_LABELS: Record<string, string> = {
  case_status_changed: "사건 상태 변경",
  document_requested: "자료 요청",
  case_closed: "사건 종결",
  inquiry_received: "문의 접수",
  message: "메시지"
};

export default async function PortalNotificationsPage() {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) redirect("/portal/signin?callbackUrl=/portal/notifications");

  const client = await prisma.portalClient.findUnique({
    where: { id: userId },
    select: { name: true, email: true }
  });

  const items = await listPortalNotifications(userId, { limit: 100 });
  const unread = items.filter((i) => !i.readAt).length;

  return (
    <div className="min-h-screen bg-surface-muted/30">
      <PortalHeader clientName={client?.name ?? ""} />

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="ethos-eyebrow">Inbox</p>
            <h1 className="ethos-display mt-2 text-3xl">알림센터</h1>
            <p className="mt-2 text-sm text-text-muted">
              {items.length === 0
                ? "받은 알림이 없습니다."
                : `${items.length}건 · 읽지 않음 ${unread}건`}
            </p>
          </div>
          <Link
            href="/portal"
            className="inline-flex h-10 items-center rounded-lg border border-gold/40 bg-surface px-4 text-sm font-semibold text-primary transition hover:bg-gold-soft/30"
          >
            대시보드로
          </Link>
        </div>

        <PortalNotificationsClient
          initialItems={items.map((i) => ({
            id: i.id,
            event: i.event,
            eventLabel: EVENT_LABELS[i.event] ?? i.event,
            title: i.title,
            body: i.body,
            link: i.link,
            readAt: i.readAt ? i.readAt.toISOString() : null,
            createdAt: i.createdAt.toISOString()
          }))}
        />
      </main>
    </div>
  );
}
