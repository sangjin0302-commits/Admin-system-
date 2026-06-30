import { prisma } from "@/lib/prisma/client";

type NotificationInput = {
  clientId: string;
  caseId?: string;
  inquiryId?: string;
  event: string;
  title: string;
  body: string;
  link?: string;
};

export async function createPortalNotification(input: NotificationInput) {
  try {
    return await prisma.portalNotification.create({ data: input });
  } catch (err) {
    console.warn("[portal-notification] create failed", err);
    return null;
  }
}

export async function getUnreadNotifications(clientId: string, limit = 20) {
  return prisma.portalNotification.findMany({
    where: { clientId, readAt: null },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function markNotificationRead(id: string, clientId: string) {
  return prisma.portalNotification.updateMany({
    where: { id, clientId },
    data: { readAt: new Date() },
  });
}

export async function markAllRead(clientId: string) {
  return prisma.portalNotification.updateMany({
    where: { clientId, readAt: null },
    data: { readAt: new Date() },
  });
}

export async function getNotificationCount(clientId: string) {
  return prisma.portalNotification.count({
    where: { clientId, readAt: null },
  });
}
