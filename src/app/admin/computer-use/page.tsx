import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Card } from "@/components/ui/card";
import { getTasks } from "@/lib/services/computer-use-service";
import { TaskForm } from "./task-form";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  pending: "대기",
  running: "실행 중",
  completed: "완료",
  failed: "실패",
};

export default function ComputerUsePage() {
  const tasks = getTasks();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        kicker="AI Agent"
        title="Computer Use"
        description="Claude 에이전트가 브라우저 작업을 자율 수행합니다. 지시사항을 작성하면 단계별 로그가 기록됩니다."
      />

      <Card className="p-6">
        <h3 className="mb-4 text-sm font-semibold text-text-strong">새 작업</h3>
        <TaskForm />
      </Card>

      <Card className="p-6">
        <h3 className="mb-4 text-sm font-semibold text-text-strong">
          작업 목록 ({tasks.length})
        </h3>
        {tasks.length === 0 ? (
          <p className="text-sm text-text-muted">아직 생성된 작업이 없습니다.</p>
        ) : (
          <ul className="space-y-2">
            {tasks.map((task) => (
              <li
                key={task.id}
                className="flex items-center justify-between rounded border border-line p-3"
              >
                <div className="min-w-0">
                  <Link
                    href={`/admin/computer-use/${task.id}`}
                    className="text-sm font-medium text-text-strong hover:underline"
                  >
                    {task.title}
                  </Link>
                  <p className="truncate text-xs text-text-muted">
                    {task.instruction}
                  </p>
                </div>
                <span className="ml-3 shrink-0 rounded bg-surface-muted px-2 py-1 text-xs text-text-muted">
                  {STATUS_LABEL[task.status]}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
