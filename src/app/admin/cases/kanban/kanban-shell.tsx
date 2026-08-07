"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import toast from "react-hot-toast";

import CaseKanban, { type KanbanItem } from "@/components/admin/case-kanban";
import { parseClientApiError } from "@/lib/http/client-api";
import { logger } from "@/lib/utils/logger";

export default function KanbanShell({ items }: { items: KanbanItem[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  function onStatusChange(caseId: string, newStatus: string, expectedUpdatedAt?: string) {
    startTransition(async () => {
      try {
        const response = await fetch(`/api/admin/case-matters/${caseId}/status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: newStatus,
            expectedUpdatedAt
          })
        });

        if (!response.ok) {
          const message = await parseClientApiError(
            response,
            "사건 상태를 변경하지 못했습니다."
          );
          toast.error(message);
          // No local optimistic state is held here — the board is derived
          // straight from `items` (server data), so re-fetching resets the
          // dropped card back to its true column.
          router.refresh();
          return;
        }

        toast.success("사건 상태가 변경되었습니다.");
        router.refresh();
      } catch (error) {
        logger.error("[Kanban] status change request failed", error);
        toast.error("사건 상태를 변경하지 못했습니다. 네트워크를 확인해주세요.");
        router.refresh();
      }
    });
  }

  return <CaseKanban items={items} onStatusChange={onStatusChange} />;
}
