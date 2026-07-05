import { Card } from "@/components/ui/card";
import { listPendingForCase } from "@/lib/services/modusign-integration";

export async function ModusignPendingCard({ caseId }: { caseId: string }) {
  const pending = await listPendingForCase(caseId);
  if (pending.length === 0) return null;
  return (
    <Card className="p-7">
      <h2 className="font-serif text-lg font-bold text-primary">서명 대기</h2>
      <p className="mt-2 text-sm text-text-muted">모두싸인 전자계약 요청이 도착했습니다.</p>
      <ul className="mt-3 space-y-2">
        {pending.map((r) => (
          <li key={r.id} className="flex items-center justify-between rounded-lg border border-gold/20 px-3 py-2 text-sm">
            <span>{r.templateName ?? r.templateId}</span>
            {r.docUrl ? (
              <a
                href={r.docUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-8 items-center rounded-md bg-primary px-3 text-xs font-bold text-white hover:bg-text-strong"
              >
                서명하기
              </a>
            ) : (
              <span className="text-xs text-text-muted">준비 중</span>
            )}
          </li>
        ))}
      </ul>
    </Card>
  );
}
