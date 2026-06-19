import Link from "next/link";
import { Card } from "@/components/ui/card";
import { listActiveCases } from "@/lib/services/team-chat-service";

export const dynamic = "force-dynamic";

export default function TeamChatPage() {
  const cases = listActiveCases();

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6">
        <p className="ui-kicker">Team</p>
        <h1 className="ui-page-title">Team Chat</h1>
        <p className="mt-1 text-sm text-text-muted">
          Discuss cases with your colleagues. Use @mentions to notify teammates.
        </p>
      </div>

      <Card>
        {cases.length === 0 ? (
          <p className="text-sm text-text-muted">
            No active chat threads yet. Open a case to start a discussion.
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
                    <span className="font-medium">Case {c.caseId}</span>
                    <span className="text-xs text-text-muted">
                      {c.total} message{c.total === 1 ? "" : "s"}
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
