import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma/client";
import { listFeeItems } from "@/lib/services/fee-items";

const VALID = ["VISA_STAY", "ADMIN_APPEAL", "CONTRACT_INVESTIGATION", "LICENSE_PERMIT", "CORP_FORMATION", "ETC"];

export async function GET() {
  const items = await listFeeItems();
  return NextResponse.json({ ok: true, items });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ ok: false, error: "INVALID_BODY" }, { status: 400 });

  const category = typeof body.category === "string" && VALID.includes(body.category) ? body.category : null;
  const service = typeof body.service === "string" ? body.service.trim() : "";
  const amount = typeof body.amount === "string" ? body.amount.trim() : "";
  const note = typeof body.note === "string" ? body.note.trim() : "";

  if (!category || !service || !amount) {
    return NextResponse.json({ ok: false, error: "분야/항목/금액은 필수입니다." }, { status: 400 });
  }

  const created = await prisma.feeItem.create({
    data: { category, service, amount, note, sortOrder: typeof body.sortOrder === "number" ? body.sortOrder : 0 }
  });
  return NextResponse.json({ ok: true, item: created });
}
