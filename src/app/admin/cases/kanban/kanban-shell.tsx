"use client";

import CaseKanban, { type KanbanItem } from "@/components/admin/case-kanban";
import { logger } from "@/lib/utils/logger";

export default function KanbanShell({ items }: { items: KanbanItem[] }) {
  return (
    <CaseKanban
      items={items}
      onStatusChange={(caseId, newStatus) => {
        logger.debug(`[Kanban] status change: ${caseId} → ${newStatus}`);
      }}
    />
  );
}
