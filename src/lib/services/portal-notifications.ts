/**
 * 포털 알림 inbox 헬퍼.
 *
 * 의뢰인 포털 안에서 "알림센터" 역할.
 * 상태변경/자료요청/종결 등 이벤트 발생 시 createPortalNotification() 호출하면
 * 의뢰인이 /portal/notifications 페이지에서 확인.
 */

import { prisma } from "@/lib/prisma/client";

export type PortalNotificationInput = {
  clientId: string;
  caseId?: string | null;
  inquiryId?: string | null;
  event: string;
  title: string;
  body: string;
  link?: string | null;
};

export async function createPortalNotification(input: PortalNotificationInput) {
  return prisma.portalNotification.create({
    data: {
      clientId: input.clientId,
      caseId: input.caseId ?? null,
      inquiryId: input.inquiryId ?? null,
      event: input.event,
      title: input.title,
      body: input.body,
      link: input.link ?? null
    }
  });
}

export async function listPortalNotifications(clientId: string, opts: { limit?: number } = {}) {
  return prisma.portalNotification.findMany({
    where: { clientId },
    orderBy: { createdAt: "desc" },
    take: opts.limit ?? 50
  });
}

export async function countUnreadPortalNotifications(clientId: string): Promise<number> {
  return prisma.portalNotification.count({
    where: { clientId, readAt: null }
  });
}

export async function markPortalNotificationRead(id: string, clientId: string) {
  // 본인 알림만 처리되도록 clientId 함께 조건
  return prisma.portalNotification.updateMany({
    where: { id, clientId, readAt: null },
    data: { readAt: new Date() }
  });
}

export async function markAllPortalNotificationsRead(clientId: string) {
  return prisma.portalNotification.updateMany({
    where: { clientId, readAt: null },
    data: { readAt: new Date() }
  });
}
