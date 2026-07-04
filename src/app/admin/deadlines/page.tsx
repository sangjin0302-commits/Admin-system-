import { prisma } from "@/lib/prisma/client";
import { isCalendarSyncConfigured } from "@/lib/services/calendar-sync-service";
import DeadlinesClient from "./deadlines-client";

export const dynamic = "force-dynamic";

interface DeadlineRow {
  id: string;
  caseNo: string | null;
  title: string;
  dueDate: string;
  daysLeft: number;
  synced: boolean;
  googleEventId: string | null;
}

async function loadDeadlines(): Promise<DeadlineRow[]> {
  const now = new Date();
  const horizon = new Date(now.getTime() + 60 * 86400_000);
  const cases = await prisma.caseMatter
    .findMany({
      where: { dueDate: { gte: now, lte: horizon } },
      select: { id: true, caseNo: true, title: true, dueDate: true },
      orderBy: { dueDate: "asc" },
      take: 200,
    })
    .catch(() => []);
  if (cases.length === 0) return [];
  const ids = cases.map((c) => c.id);
  const syncMaps = await prisma.googleCalendarSyncMap
    .findMany({
      where: { internalKind: "case_due", internalId: { in: ids } },
      select: { internalId: true, googleEventId: true },
    })
    .catch(() => []);
  const syncByCase = new Map(syncMaps.map((m) => [m.internalId, m.googleEventId] as const));
  return cases
    .filter((c) => c.dueDate !== null)
    .map((c) => {
      const dueDate = c.dueDate as Date;
      const diffMs = dueDate.getTime() - now.getTime();
      return {
        id: c.id,
        caseNo: c.caseNo,
        title: c.title,
        dueDate: dueDate.toISOString(),
        daysLeft: Math.max(0, Math.ceil(diffMs / 86400_000)),
        synced: syncByCase.has(c.id),
        googleEventId: syncByCase.get(c.id) ?? null,
      };
    });
}

export default async function DeadlinesPage() {
  const rows = await loadDeadlines();
  const configured = isCalendarSyncConfigured();
  return <DeadlinesClient initialRows={rows} configured={configured} />;
}
