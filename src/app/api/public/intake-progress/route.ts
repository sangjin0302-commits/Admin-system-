import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";

export async function POST(req: Request) {
  try {
    const { email, phone, name, category, step } = await req.json();
    if (!email) return NextResponse.json({ ok: false }, { status: 400 });

    const existing = await prisma.intakeAbandonment.findFirst({
      where: { email, convertedAt: null },
      orderBy: { createdAt: "desc" },
    });

    if (existing) {
      await prisma.intakeAbandonment.update({
        where: { id: existing.id },
        data: { phone, name, category, step },
      });
    } else {
      await prisma.intakeAbandonment.create({
        data: { email, phone, name, category, step },
      });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
