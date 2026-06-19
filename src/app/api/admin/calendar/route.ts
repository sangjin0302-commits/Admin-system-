import { NextResponse } from "next/server";
import { createEvent, listEvents } from "@/lib/services/calendar-integration-service";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const fromStr = url.searchParams.get("from");
  const toStr = url.searchParams.get("to");
  const from = fromStr ? new Date(fromStr) : new Date(Date.now() - 30 * 86400_000);
  const to = toStr ? new Date(toStr) : new Date(Date.now() + 90 * 86400_000);
  const events = listEvents(from, to).map((e) => ({
    ...e,
    start: e.start.toISOString(),
    end: e.end.toISOString(),
  }));
  return NextResponse.json({ events });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, start, end, description, location, caseId, reminderMinutes } = body ?? {};
    if (!title || !start || !end) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }
    const event = createEvent({
      title,
      start: new Date(start),
      end: new Date(end),
      description,
      location,
      caseId,
      reminderMinutes,
    });
    return NextResponse.json(
      {
        event: { ...event, start: event.start.toISOString(), end: event.end.toISOString() },
      },
      { status: 201 }
    );
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error" },
      { status: 500 }
    );
  }
}
