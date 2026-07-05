import { NextResponse } from "next/server";
import {
  addMeeting,
  deleteMeeting,
  listMeetings,
  listMeetingsByDate,
  optimizeDailyRoute,
  updateMeetingStatus,
  type OnsiteMeetingStatus,
} from "@/lib/services/onsite-meeting-service";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const date = url.searchParams.get("date");
  const meetings = date ? await listMeetingsByDate(date) : await listMeetings();
  return NextResponse.json({ ok: true, meetings });
}

interface Body {
  action: "add" | "delete" | "update-status" | "optimize";
  id?: string;
  status?: OnsiteMeetingStatus;
  date?: string;
  startLat?: number;
  startLng?: number;
  data?: {
    caseId?: string;
    clientName: string;
    address: string;
    latitude: number;
    longitude: number;
    scheduledAt: string;
    durationMin: number;
    notes?: string;
  };
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as Body | null;
  if (!body) return NextResponse.json({ ok: false }, { status: 400 });
  if (body.action === "add" && body.data) {
    const m = await addMeeting(body.data);
    return NextResponse.json({ ok: true, meeting: m });
  }
  if (body.action === "delete" && body.id) {
    return NextResponse.json({ ok: await deleteMeeting(body.id) });
  }
  if (body.action === "update-status" && body.id && body.status) {
    const m = await updateMeetingStatus(body.id, body.status);
    return NextResponse.json({ ok: !!m, meeting: m });
  }
  if (body.action === "optimize" && body.date && typeof body.startLat === "number" && typeof body.startLng === "number") {
    const meetings = await listMeetingsByDate(body.date);
    const result = optimizeDailyRoute(meetings, { latitude: body.startLat, longitude: body.startLng });
    return NextResponse.json({ ok: true, ...result });
  }
  return NextResponse.json({ ok: false, error: "UNKNOWN_ACTION" }, { status: 400 });
}
