import { listCaseMatters } from "@/lib/services/case-matter-service";
import { formatCaseMatterTypeLabel } from "@/lib/immigration";
import type { KanbanItem } from "@/components/admin/case-kanban";
import KanbanShell from "./kanban-shell";

export const dynamic = "force-dynamic";

export default async function CasesKanbanPage() {
  const caseMatters = await listCaseMatters();

  const items: KanbanItem[] = caseMatters.map((cm) => ({
    id: cm.id,
    title: cm.title,
    caseNo: cm.caseNo,
    status: cm.status,
    matterTypeLabel: formatCaseMatterTypeLabel(cm.matterType),
  }));

  return (
    <div className="space-y-6">
      <h1 className="ui-page-title">사건 칸반 보드</h1>
      <KanbanShell items={items} />
    </div>
  );
}
