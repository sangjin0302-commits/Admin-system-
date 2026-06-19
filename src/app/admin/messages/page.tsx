import { Card } from "@/components/ui/card";
import { prisma } from "@/lib/prisma/client";

export const dynamic = "force-dynamic";

export default async function AdminMessagesPage() {
  let messages: Array<{
    id: string;
    clientId: string;
    caseId: string | null;
    title: string;
    body: string;
    createdAt: Date;
    readAt: Date | null;
  }> = [];

  try {
    messages = await prisma.portalNotification.findMany({
      where: { event: "message" },
      orderBy: { createdAt: "desc" },
      take: 200,
      select: {
        id: true,
        clientId: true,
        caseId: true,
        title: true,
        body: true,
        createdAt: true,
        readAt: true,
      },
    });
  } catch (error) {
    console.error("[admin-messages] failed to load", error);
  }

  const clientIds = Array.from(new Set(messages.map((m) => m.clientId)));
  const clients = clientIds.length
    ? await prisma.portalClient
        .findMany({
          where: { id: { in: clientIds } },
          select: { id: true, name: true, email: true },
        })
        .catch(() => [])
    : [];
  const clientMap = new Map(clients.map((c) => [c.id, c]));

  return (
    <div className="space-y-6">
      <div>
        <p className="ui-kicker">Client Communication</p>
        <h1 className="ui-page-title">의뢰인 메시지</h1>
      </div>

      {messages.length === 0 ? (
        <Card>
          <p className="p-6 text-sm text-text-muted">아직 메시지가 없습니다.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {messages.map((m) => {
            const client = clientMap.get(m.clientId);
            return (
              <Card key={m.id}>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-serif text-sm font-bold text-primary">
                        {client?.name ?? "(알 수 없는 의뢰인)"}{" "}
                        <span className="text-xs font-normal text-text-muted">
                          {client?.email}
                        </span>
                      </p>
                      <p className="mt-0.5 text-xs text-text-muted">{m.title}</p>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <p className="text-xs text-text-muted">
                        {new Date(m.createdAt).toLocaleString("ko-KR")}
                      </p>
                      {!m.readAt && (
                        <span className="mt-1 inline-block rounded-full bg-gold-soft/60 px-2 py-0.5 text-[10px] font-bold text-gold-deep">
                          미확인
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-text-strong">
                    {m.body}
                  </p>
                  {m.caseId && (
                    <p className="mt-2 text-xs text-text-muted">
                      사건 ID: <span className="font-mono">{m.caseId}</span>
                    </p>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
