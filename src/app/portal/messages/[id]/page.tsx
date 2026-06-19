import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { PortalHeader } from "@/components/layout/portal-header";
import { Card } from "@/components/ui/card";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma/client";

import { ReplyForm } from "./reply-form";

export const dynamic = "force-dynamic";

export default async function PortalMessageDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect("/portal/signin");

  const userId = (session.user as { id?: string }).id;
  const client = userId
    ? await prisma.portalClient.findUnique({ where: { id: userId } })
    : null;

  const message = await prisma.portalNotification.findUnique({ where: { id } });
  if (!message || message.clientId !== userId) notFound();

  // mark as read
  if (!message.readAt) {
    await prisma.portalNotification
      .update({ where: { id }, data: { readAt: new Date() } })
      .catch(() => null);
  }

  // pull thread context (other messages on same case)
  const thread = message.caseId
    ? await prisma.portalNotification.findMany({
        where: { clientId: userId, event: "message", caseId: message.caseId },
        orderBy: { createdAt: "asc" },
      })
    : [message];

  return (
    <div className="min-h-screen bg-canvas">
      <PortalHeader clientName={client?.name} />
      <main className="mx-auto max-w-3xl space-y-6 px-4 py-10 sm:px-6">
        <Link href="/portal/messages" className="text-sm text-text-muted hover:text-primary">
          ← 메시지함
        </Link>

        <div>
          <p className="ui-kicker">Conversation</p>
          <h1 className="ui-page-title">{message.title}</h1>
        </div>

        <div className="space-y-3">
          {thread.map((m) => (
            <Card key={m.id}>
              <div className="p-5">
                <div className="flex items-center justify-between text-xs text-text-muted">
                  <span className="font-semibold text-primary">사무소</span>
                  <span>{new Date(m.createdAt).toLocaleString("ko-KR")}</span>
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-text-strong">
                  {m.body}
                </p>
              </div>
            </Card>
          ))}
        </div>

        <Card>
          <div className="p-5">
            <h2 className="mb-3 font-serif text-sm font-bold text-primary">답장 보내기</h2>
            <ReplyForm caseId={message.caseId ?? undefined} />
          </div>
        </Card>
      </main>
    </div>
  );
}
