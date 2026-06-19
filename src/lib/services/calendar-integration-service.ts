export type CalendarEvent = {
  id: string;
  title: string;
  start: Date;
  end: Date;
  description?: string;
  location?: string;
  caseId?: string;
  reminderMinutes?: number;
};

const eventStore = new Map<string, CalendarEvent>();

function generateId(): string {
  return `evt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function createEvent(event: Omit<CalendarEvent, "id">): CalendarEvent {
  const e: CalendarEvent = { ...event, id: generateId() };
  eventStore.set(e.id, e);
  return e;
}

export function listEvents(from: Date, to: Date): CalendarEvent[] {
  const out: CalendarEvent[] = [];
  for (const e of eventStore.values()) {
    if (e.end >= from && e.start <= to) out.push(e);
  }
  return out.sort((a, b) => a.start.getTime() - b.start.getTime());
}

export function getEventsByCase(caseId: string): CalendarEvent[] {
  return Array.from(eventStore.values())
    .filter((e) => e.caseId === caseId)
    .sort((a, b) => a.start.getTime() - b.start.getTime());
}

function formatICSDate(d: Date): string {
  return (
    d.getUTCFullYear().toString().padStart(4, "0") +
    (d.getUTCMonth() + 1).toString().padStart(2, "0") +
    d.getUTCDate().toString().padStart(2, "0") +
    "T" +
    d.getUTCHours().toString().padStart(2, "0") +
    d.getUTCMinutes().toString().padStart(2, "0") +
    d.getUTCSeconds().toString().padStart(2, "0") +
    "Z"
  );
}

function escapeICS(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

export function exportToICS(events: CalendarEvent[]): string {
  const lines: string[] = [];
  lines.push("BEGIN:VCALENDAR");
  lines.push("VERSION:2.0");
  lines.push("PRODID:-//ETHOS//Admin Calendar//EN");
  lines.push("CALSCALE:GREGORIAN");
  for (const e of events) {
    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${e.id}@ethos.local`);
    lines.push(`DTSTAMP:${formatICSDate(new Date())}`);
    lines.push(`DTSTART:${formatICSDate(e.start)}`);
    lines.push(`DTEND:${formatICSDate(e.end)}`);
    lines.push(`SUMMARY:${escapeICS(e.title)}`);
    if (e.description) lines.push(`DESCRIPTION:${escapeICS(e.description)}`);
    if (e.location) lines.push(`LOCATION:${escapeICS(e.location)}`);
    if (e.reminderMinutes && e.reminderMinutes > 0) {
      lines.push("BEGIN:VALARM");
      lines.push("ACTION:DISPLAY");
      lines.push(`DESCRIPTION:${escapeICS(e.title)}`);
      lines.push(`TRIGGER:-PT${e.reminderMinutes}M`);
      lines.push("END:VALARM");
    }
    lines.push("END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

export async function syncWithGoogleCalendar(
  accessToken: string,
  events: CalendarEvent[]
): Promise<number> {
  const token = process.env.GOOGLE_CALENDAR_TOKEN ?? accessToken;
  if (!token) {
    // mock
    return events.length;
  }
  let synced = 0;
  for (const e of events) {
    try {
      const res = await fetch(
        "https://www.googleapis.com/calendar/v3/calendars/primary/events",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            summary: e.title,
            description: e.description,
            location: e.location,
            start: { dateTime: e.start.toISOString() },
            end: { dateTime: e.end.toISOString() },
          }),
        }
      );
      if (res.ok) synced++;
    } catch {
      // ignore
    }
  }
  return synced;
}

export function createCaseDeadlineEvent(
  caseId: string,
  caseTitle: string,
  deadline: Date
): CalendarEvent {
  const end = new Date(deadline.getTime() + 60 * 60 * 1000);
  return createEvent({
    title: `[Deadline] ${caseTitle}`,
    start: deadline,
    end,
    description: `Deadline for case ${caseId}: ${caseTitle}`,
    caseId,
    reminderMinutes: 60,
  });
}
