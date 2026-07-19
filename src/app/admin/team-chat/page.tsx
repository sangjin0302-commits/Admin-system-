import Link from "next/link";
import { Card } from "@/components/ui/card";
import { listActiveCases } from "@/lib/services/team-chat-service";

export const dynamic = "force-dynamic";

export default function TeamChatPage() {
  const cases = listActiveCases();

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6">
        <p className="ui-kicker">팀</p>
        <h1 className="ui-page-title">팀 채팅</h1>
        <p className="mt-1 text-sm text-text-muted">
          동료와 사건에 대해 논의하세요. @멘션으로 팀원에게 알릴 수 있습니다.
        </p>
      </div>

      <Card>
        {cases.length === 0 ? (
          <p className="text-sm text-text-muted">
            진행 중인 대화가 없습니다. 사건을 열어 논의를 시작하세요.
          </p>
        ) : (
          <ul className="divide-y">
            {cases.map((c) => (
              <li key={c.caseId} className="py-3">
                <Link
                  href={`/admin/team-chat/${c.caseId}`}
                  className="block hover:bg-gray-50"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">사건 {c.caseId}</span>
                    <span className="text-xs text-text-muted">
                      메시지 {c.total}건
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-text-muted truncate">
                    {c.lastMessage.authorName}: {c.lastMessage.message}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
