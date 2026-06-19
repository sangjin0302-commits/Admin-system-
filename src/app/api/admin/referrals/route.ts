import { NextResponse } from "next/server";

import { generateReferralCode } from "@/lib/services/referral-service";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { referrerEmail, referrerName } = body ?? {};
    if (typeof referrerEmail !== "string" || typeof referrerName !== "string") {
      return NextResponse.json({ error: "invalid payload" }, { status: 400 });
    }
    const code = generateReferralCode(referrerEmail, referrerName);
    return NextResponse.json({ code });
  } catch (error) {
    return NextResponse.json({ error: "failed", detail: String(error) }, { status: 500 });
  }
}
