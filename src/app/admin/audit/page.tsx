import { prisma } from "@/lib/prisma/client";
import { Table, TableContainer } from "@/components/ui/table";

export const dynamic = "force-dynamic";

export default async function AuditPage() {
  let events: Array<{
    id: string;
    createdAt: string;
    actorName: string | null;
    eventType: string;
    message: string;
    payloadJson: string | null;
  }> = [];

  try {
    const rows = await prisma.caseEvent.findMany({
      where: { eventType: { startsWith: "admin." } },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        createdAt: true,
        actorName: true,
        eventType: true,
        message: true,
        payloadJson: true,
      },
    });

    events = rows.map((r) => ({
      id: r.id,
      createdAt: r.createdAt.toISOString(),
      actorName: r.actorName,
      eventType: r.eventType,
      message: r.message,
      payloadJson: r.payloadJson,
    }));
  } catch (error) {
    console.error("[audit-page] failed to load events", error);
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="ui-kicker">Security</p>
        <h1 className="ui-page-title">Admin Audit Log</h1>
      </div>

      {events.length === 0 ? (
        <p className="text-muted text-sm">No admin audit events recorded yet.</p>
      ) : (
        <TableContainer>
          <Table>
            <thead>
              <tr>
                <th className="text-left px-4 py-2">Timestamp</th>
                <th className="text-left px-4 py-2">Actor</th>
                <th className="text-left px-4 py-2">Action</th>
                <th className="text-left px-4 py-2">Resource</th>
                <th className="text-left px-4 py-2">Details</th>
              </tr>
            </thead>
            <tbody>
              {events.map((e) => {
                let resource = "";
                let details = "";
                try {
                  const payload = e.payloadJson ? JSON.parse(e.payloadJson) : null;
                  resource = payload?.resource ?? "";
                  details = payload?.details ?? e.message;
                } catch {
                  details = e.message;
                }

                return (
                  <tr key={e.id}>
                    <td className="px-4 py-2 text-sm whitespace-nowrap">
                      {new Date(e.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-2 text-sm">{e.actorName ?? "—"}</td>
                    <td className="px-4 py-2 font-mono text-xs">{e.eventType}</td>
                    <td className="px-4 py-2 text-sm">{resource}</td>
                    <td className="px-4 py-2 text-sm text-muted">{details}</td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </TableContainer>
      )}
    </div>
  );
}
