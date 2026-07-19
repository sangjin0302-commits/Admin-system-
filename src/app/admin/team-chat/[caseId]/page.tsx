import { Card } from "@/components/ui/card";
import { getMessages } from "@/lib/services/team-chat-service";
import { ChatPanel } from "./chat-panel";

export const dynamic = "force-dynamic";

export default async function CaseChatPage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;
  const initial = getMessages(caseId).map((m) => ({
    ...m,
    createdAt: m.createdAt.toISOString(),
  }));

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6">
        <p className="ui-kicker">팀</p>
        <h1 className="ui-page-title">사건 {caseId} 논의</h1>
      </div>
      <Card>
        <ChatPanel caseId={caseId} initialMessages={initial} />
      </Card>
    </div>
  );
}
