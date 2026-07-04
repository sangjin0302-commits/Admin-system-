import { NextResponse } from "next/server";

import {
  addCompetitor,
  listCompetitors,
  type CompetitorInput,
} from "@/lib/services/competitor-tracker-service";

export const dynamic = "force-dynamic";

export async function GET() {
  const items = await listCompetitors();
  return NextResponse.json({ ok: true, items });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Partial<CompetitorInput>;
  if (!body?.name) {
    return NextResponse.json({ ok: false, error: "NAME_REQUIRED" }, { status: 400 });
  }
  try {
    const entry = await addCompetitor({
      name: body.name,
      url: body.url ?? "",
      notes: body.notes ?? "",
      services: Array.isArray(body.services) ? body.services : [],
    });
    return NextResponse.json({ ok: true, entry });
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 400 });
  }
}
