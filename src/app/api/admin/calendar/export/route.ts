import { exportToICS, listEvents } from "@/lib/services/calendar-integration-service";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const fromStr = url.searchParams.get("from");
  const toStr = url.searchParams.get("to");
  const from = fromStr ? new Date(fromStr) : new Date(Date.now() - 365 * 86400_000);
  const to = toStr ? new Date(toStr) : new Date(Date.now() + 365 * 86400_000);
  const events = listEvents(from, to);
  const ics = exportToICS(events);
  return new Response(ics, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="ethos-calendar.ics"',
    },
  });
}
