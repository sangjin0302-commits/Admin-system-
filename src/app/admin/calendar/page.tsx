import { Card } from "@/components/ui/card";
import { listEvents } from "@/lib/services/calendar-integration-service";
import { CalendarView } from "./calendar-view";

export const dynamic = "force-dynamic";

export default function CalendarPage() {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const to = new Date(now.getFullYear(), now.getMonth() + 2, 0);
  const events = listEvents(from, to).map((e) => ({
    ...e,
    start: e.start.toISOString(),
    end: e.end.toISOString(),
  }));

  const upcoming = events
    .filter((e) => new Date(e.start) >= now)
    .slice(0, 10);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6">
        <p className="ui-kicker">Schedule</p>
        <h1 className="ui-page-title">Calendar</h1>
        <p className="mt-1 text-sm text-text-muted">
          Office events, deadlines, and case schedules.
        </p>
      </div>

      <Card className="mb-6">
        <CalendarView initialEvents={events} />
      </Card>

      <Card>
        <h2 className="mb-3 text-sm font-semibold">Upcoming Events</h2>
        {upcoming.length === 0 ? (
          <p className="text-sm text-text-muted">No upcoming events.</p>
        ) : (
          <ul className="divide-y">
            {upcoming.map((e) => (
              <li key={e.id} className="py-2 text-sm">
                <div className="font-medium">{e.title}</div>
                <div className="text-xs text-text-muted">
                  {new Date(e.start).toLocaleString()}
                  {e.location ? ` · ${e.location}` : ""}
                </div>
              </li>
            ))}
          </ul>
        )}
        <a
          href="/api/admin/calendar/export"
          className="mt-3 inline-block text-sm text-blue-600 hover:underline"
        >
          Export to .ics
        </a>
      </Card>
    </div>
  );
}
