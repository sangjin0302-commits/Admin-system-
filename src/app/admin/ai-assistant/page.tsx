import { AiAssistantConsole } from "@/components/admin/ai-assistant-console";

export const dynamic = "force-dynamic";

export default function AdminAiAssistantPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-strong">AI 어시스턴트</h1>
        <p className="mt-1 text-sm text-text-muted">
          lawbot 기반 자유 질의 콘솔 — 사안 내용을 입력하면 실무 가이드·판례·리스크를 즉시 확인할 수 있습니다.
        </p>
      </div>
      <AiAssistantConsole />
    </div>
  );
}
