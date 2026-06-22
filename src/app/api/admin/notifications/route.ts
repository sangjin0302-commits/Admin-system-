import { prisma } from "@/lib/prisma/client";
import { createAdminRequestContext } from "@/lib/http/admin-api";
import { isAlimtalkConnected } from "@/lib/services/kakao-notification-service";

export const dynamic = "force-dynamic";

const VALID_CHANNELS = ["ALIMTALK", "SMS", "EMAIL", "PUSH"] as const;
const VALID_STATUSES = ["QUEUED", "SENT", "FAILED", "SKIPPED"] as const;

type Channel = (typeof VALID_CHANNELS)[number];
type Status = (typeof VALID_STATUSES)[number];

export async function GET(req: Request) {
  const api = createAdminRequestContext("admin.notifications.list");
  const url = new URL(req.url);
  const channel = url.searchParams.get("channel") as Channel | null;
  const status = url.searchParams.get("status") as Status | null;
  const caseId = url.searchParams.get("caseId");
  const take = Math.min(Number(url.searchParams.get("limit") ?? 100), 500);

  try {
    const where: Record<string, unknown> = {};
    if (channel && (VALID_CHANNELS as readonly string[]).includes(channel)) {
      where.channel = channel;
    }
    if (status && (VALID_STATUSES as readonly string[]).includes(status)) {
      where.status = status;
    }
    if (caseId) where.caseId = caseId;

    const [items, stats] = await Promise.all([
      prisma.notificationLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take,
      }),
      prisma.notificationLog.groupBy({
        by: ["status"],
        _count: true,
      }),
    ]);

    return api.ok({
      ok: true,
      alimtalkConnected: isAlimtalkConnected(),
      stats: Object.fromEntries(stats.map((s) => [s.status, s._count])),
      items: items.map((it) => ({
        ...it,
        createdAt: it.createdAt.toISOString(),
        sentAt: it.sentAt?.toISOString() ?? null,
      })),
    });
  } catch (err) {
    api.logError(err);
    return api.error(500, "알림 이력을 조회하지 못했습니다.", {
      code: "NOTIFICATIONS_LIST_FAILED",
    });
  }
}
