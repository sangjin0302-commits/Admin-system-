import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma/client";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";

export const dynamic = "force-dynamic";

const SETTING_KEY = "admin.macro-hotkeys";
const MAX_SLOTS = 9;

type MacroSlot = { slot: number; label: string; text: string };

/** GET: 서버에 저장된 매크로 hotkey 목록 반환 */
export async function GET() {
  if (!(await isFeatureEnabled("macro_server_sync"))) {
    return NextResponse.json({ ok: false, error: "flag-off" }, { status: 404 });
  }

  const row = await prisma.siteSetting.findUnique({ where: { key: SETTING_KEY } });
  const macros: MacroSlot[] = row?.value ? JSON.parse(row.value) : [];
  return NextResponse.json({ ok: true, macros });
}

/** PUT: 매크로 hotkey 목록 저장 (upsert) */
export async function PUT(request: Request) {
  if (!(await isFeatureEnabled("macro_server_sync"))) {
    return NextResponse.json({ ok: false, error: "flag-off" }, { status: 404 });
  }

  const body = await request.json();
  const macros = body.macros as MacroSlot[];

  if (!Array.isArray(macros) || macros.length > MAX_SLOTS) {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
  }

  const clean: MacroSlot[] = macros
    .filter((m) => typeof m.slot === "number" && m.slot >= 1 && m.slot <= MAX_SLOTS)
    .map((m) => ({
      slot: m.slot,
      label: String(m.label ?? "").slice(0, 30),
      text: String(m.text ?? "").slice(0, 1500),
    }));

  await prisma.siteSetting.upsert({
    where: { key: SETTING_KEY },
    create: { key: SETTING_KEY, value: JSON.stringify(clean) },
    update: { value: JSON.stringify(clean) },
  });

  return NextResponse.json({ ok: true });
}
