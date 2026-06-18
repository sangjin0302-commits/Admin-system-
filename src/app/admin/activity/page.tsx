import { prisma } from "@/lib/prisma/client";
import { ActivityTimeline, type TimelineEvent } from "@/components/admin/activity-timeline";

export const dynamic = "force-dynamic";

export default async function ActivityPage() {
  let events: TimelineEvent[] = [];

  try {
    const rows = await prisma.caseEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        eventType: true,
        actorName: true,
        message: true,
        createdAt: true,
        caseMatter: { select: { title: true } },
      },
    });

    events = rows.map((r) => ({
      id: r.id,
      eventType: r.eventType,
      actorName: r.actorName,
      message: r.message,
      createdAt: r.createdAt.toISOString(),
      caseTitle: r.caseMatter?.title ?? undefined,
    }));
  } catch {
    events = [];
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6">
        <p className="ui-kicker">Admin Activity</p>
        <h1 className="mt-1 text-2xl font-bold text-text-strong">활동 타임라인</h1>
      </div>
      <ActivityTimeline events={events} />
    </div>
  );
}
