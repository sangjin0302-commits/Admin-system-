import { NextResponse } from "next/server";
import { createEvent, listEvents } from "@/lib/services/calendar-integration-service";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const fromStr = url.searchParams.get("from");
  const toStr = url.searchParams.get("to");
  const parsedFrom = fromStr ? new Date(fromStr) : null;
  const parsedTo = toStr ? new Date(toStr) : null;
  // 잘못된 날짜 문자열은 기본 범위로 폴백 (Invalid Date 전파 방지).
  const from = parsedFrom && !isNaN(parsedFrom.getTime()) ? parsedFrom : new Date(Date.now() - 30 * 86400_000);
  const to = parsedTo && !isNaN(parsedTo.getTime()) ? parsedTo : new Date(Date.now() + 90 * 86400_000);
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
    const startDate = new Date(start);
    const endDate = new Date(end);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json({ error: "Invalid date" }, { status: 400 });
    }
    const event = createEvent({
      title,
      start: startDate,
      end: endDate,
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
    console.error("[admin/calendar] POST failed", err);
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  }
}
