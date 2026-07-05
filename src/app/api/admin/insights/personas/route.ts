import { NextResponse } from "next/server";

import {
  getOrGeneratePersonas,
  regeneratePersonas,
} from "@/lib/services/persona-analysis-service";

export const dynamic = "force-dynamic";

export async function GET() {
  const envelope = await getOrGeneratePersonas();
  return NextResponse.json({ ok: true, ...envelope });
}

export async function POST() {
  const envelope = await regeneratePersonas();
  return NextResponse.json({ ok: true, ...envelope });
}
