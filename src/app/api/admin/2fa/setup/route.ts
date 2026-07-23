import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma/client";
import { generateSecret, getOtpauthUrl, verifyTotp } from "@/lib/services/totp-service";

export const dynamic = "force-dynamic";

const ISSUER = "EthosAdmin";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const email: string = typeof body?.email === "string" ? body.email : "";
  if (!email) {
    return NextResponse.json({ error: "email is required" }, { status: 400 });
  }
  const secret = generateSecret();
  const otpauthUrl = getOtpauthUrl(secret, email, ISSUER);
  return NextResponse.json({ secret, otpauthUrl });
}

export async function PUT(req: Request) {
  const body = await req.json().catch(() => ({}));
  const email: string = typeof body?.email === "string" ? body.email : "";
  const secret: string = typeof body?.secret === "string" ? body.secret : "";
  const token: string = typeof body?.token === "string" ? body.token : "";
  if (!email || !secret || !token) {
    return NextResponse.json({ error: "email, secret, token required" }, { status: 400 });
  }
  if (!verifyTotp(secret, token)) {
    return NextResponse.json({ ok: false, error: "invalid token" }, { status: 400 });
  }
  const key = `admin.2fa.${email}`;
  try {
    await prisma.siteSetting.upsert({
      where: { key },
      create: { key, value: secret, updatedBy: email },
      update: { value: secret, updatedBy: email },
    });
  } catch (error) {
    console.error("[admin/2fa/setup] upsert failed", error);
    return NextResponse.json({ ok: false, error: "SERVER_ERROR" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
