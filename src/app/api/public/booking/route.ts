import { NextResponse } from "next/server";

import {
  bookSlot,
  getAvailableSlots,
  getSlotsForNext14Days,
} from "@/lib/services/consultation-slots-service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const date = url.searchParams.get("date");
  if (date) {
    const slots = await getAvailableSlots(date);
    return NextResponse.json({ ok: true, date, slots });
  }
  const days = await getSlotsForNext14Days();
  return NextResponse.json({ ok: true, days });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    date?: unknown;
    time?: unknown;
    name?: unknown;
    phone?: unknown;
    email?: unknown;
    category?: unknown;
    message?: unknown;
  } | null;
  if (!body || typeof body !== "object") {
    return NextResponse.json({ ok: false, error: "INVALID_BODY" }, { status: 400 });
  }

  const date = typeof body.date === "string" ? body.date : "";
  const time = typeof body.time === "string" ? body.time : "";
  const name = typeof body.name === "string" ? body.name : "";
  const phone = typeof body.phone === "string" ? body.phone : "";
  const email = typeof body.email === "string" ? body.email : undefined;
  const category = typeof body.category === "string" ? body.category : undefined;
  const message = typeof body.message === "string" ? body.message : undefined;

  const result = await bookSlot({ date, time, name, phone, email, category, message });
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true, inquiryId: result.inquiryId });
}
