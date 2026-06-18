"use client";

import CaseKanban, { type KanbanItem } from "@/components/admin/case-kanban";

export default function KanbanShell({ items }: { items: KanbanItem[] }) {
  return (
    <CaseKanban
      items={items}
      onStatusChange={(caseId, newStatus) => {
        console.log(`[Kanban] status change: ${caseId} → ${newStatus}`);
      }}
    />
  );
}
