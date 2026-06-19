import Link from "next/link";
import { redirect } from "next/navigation";

import { PortalHeader } from "@/components/layout/portal-header";
import { Card } from "@/components/ui/card";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma/client";

export const dynamic = "force-dynamic";

export default async function PortalMessagesPage() {
  const session = await auth();
  if (!session?.user) redirect("/portal/signin");

  const userId = (session.user as { id?: string }).id;
  const client = userId
    ? await prisma.portalClient.findUnique({ where: { id: userId } })
    : null;

  const messages = userId
    ? await prisma.portalNotification.findMany({
        where: { clientId: userId, event: "message" },
        orderBy: { createdAt: "desc" },
        take: 100,
      })
    : [];

  return (
    <div className="min-h-screen bg-canvas">
      <PortalHeader clientName={client?.name} />
      <main className="mx-auto max-w-4xl space-y-6 px-4 py-10 sm:px-6">
        <div>
          <p className="ui-kicker">Messages</p>
          <h1 className="ui-page-title">메시지함</h1>
        </div>

        {messages.length === 0 ? (
          <Card>
            <p className="p-6 text-sm text-text-muted">아직 받은 메시지가 없습니다.</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {messages.map((m) => (
              <Link key={m.id} href={`/portal/messages/${m.id}`} className="block">
                <Card className="transition hover:bg-gold-soft/10">
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-serif text-sm font-bold text-primary">
                          {m.title}
                        </p>
                        <p className="mt-1 truncate text-xs text-text-muted">
                          {m.body.slice(0, 120)}
                        </p>
                      </div>
                      <span className="flex-shrink-0 text-xs text-text-muted">
                        {new Date(m.createdAt).toLocaleString("ko-KR")}
                      </span>
                    </div>
                    {!m.readAt && (
                      <span className="mt-2 inline-block rounded-full bg-gold-soft/60 px-2 py-0.5 text-[10px] font-bold text-gold-deep">
                        새 메시지
                      </span>
                    )}
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
