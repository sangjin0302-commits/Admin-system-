import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Card } from "@/components/ui/card";
import { getTaskById } from "@/lib/services/computer-use-service";
import { RunButton } from "./run-button";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  pending: "대기",
  running: "실행 중",
  completed: "완료",
  failed: "실패",
};

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const task = getTaskById(id);
  if (!task) notFound();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        kicker="Computer Use"
        title={task.title}
        description={`상태: ${STATUS_LABEL[task.status]} · 생성: ${task.createdAt.toLocaleString("ko-KR")}`}
        action={
          <Link
            href="/admin/computer-use"
            className="text-sm text-text-muted hover:underline"
          >
            ← 목록
          </Link>
        }
      />

      <Card className="p-6">
        <h3 className="mb-2 text-sm font-semibold text-text-strong">지시사항</h3>
        <p className="whitespace-pre-wrap text-sm text-text-muted">
          {task.instruction}
        </p>
        <div className="mt-4">
          <RunButton taskId={task.id} disabled={task.status === "running"} />
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="mb-4 text-sm font-semibold text-text-strong">
          실행 단계 ({task.steps.length})
        </h3>
        {task.steps.length === 0 ? (
          <p className="text-sm text-text-muted">아직 실행되지 않았습니다.</p>
        ) : (
          <ol className="space-y-2 text-sm">
            {task.steps.map((step, idx) => (
              <li
                key={idx}
                className="rounded border border-line bg-surface-muted p-2 font-mono text-xs"
              >
                <span className="mr-2 text-text-muted">#{idx + 1}</span>
                {step.action}
              </li>
            ))}
          </ol>
        )}
      </Card>

      {task.result && (
        <Card className="p-6">
          <h3 className="mb-2 text-sm font-semibold text-text-strong">결과</h3>
          <pre className="whitespace-pre-wrap rounded bg-surface-muted p-3 text-xs">
            {task.result}
          </pre>
        </Card>
      )}
    </div>
  );
}
