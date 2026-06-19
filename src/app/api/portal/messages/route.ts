import { NextResponse } from "next/server";

import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma/client";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as { id?: string }).id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { caseId?: string; message?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const message = (body.message ?? "").trim();
  if (!message) {
    return NextResponse.json({ error: "메시지를 입력해 주세요." }, { status: 400 });
  }

  const notification = await prisma.portalNotification.create({
    data: {
      clientId: userId,
      caseId: body.caseId ?? null,
      event: "message",
      title: "의뢰인 메시지",
      body: message,
      link: body.caseId ? `/portal/cases/${body.caseId}` : "/portal/messages",
    },
  });

  return NextResponse.json({ notification }, { status: 201 });
}
