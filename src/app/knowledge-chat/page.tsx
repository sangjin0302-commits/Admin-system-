import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { RagChatWidget } from "@/components/public/rag-chat-widget";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "지식 챗봇 — 에토스 행정사사무소(ETHOS)",
  description: "블로그·판례·사례·FAQ 기반 실시간 AI 답변",
};

export default async function KnowledgeChatPage() {
  const enabled = await isFeatureEnabled("rag_chatbot");
  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <p className="text-xs uppercase tracking-wider text-text-muted">Knowledge Chat</p>
      <h1 className="mt-2 text-2xl font-bold text-text-strong">사무소 지식 챗봇</h1>
      <p className="mt-2 text-sm text-text-muted">
        블로그, 판례, 사례, 자주 묻는 질문을 근거로 답변합니다. 답변에는 출처가 표시됩니다.
      </p>
      {!enabled ? (
        <p className="mt-8 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          현재 지식 챗봇 서비스는 일시 중단되어 있습니다. 문의는 상담 예약을 이용해 주세요.
        </p>
      ) : (
        <div className="mt-6">
          <RagChatWidget />
        </div>
      )}
    </main>
  );
}
