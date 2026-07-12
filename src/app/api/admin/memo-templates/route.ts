import { NextRequest, NextResponse } from "next/server";
import { getMemoTemplates, saveMemoTemplates } from "@/lib/services/memo-template-service";

export async function GET() {
  const templates = await getMemoTemplates();
  return NextResponse.json({ templates });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  await saveMemoTemplates(body.templates || []);
  return NextResponse.json({ ok: true });
}
