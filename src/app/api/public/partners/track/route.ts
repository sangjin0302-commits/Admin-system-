import { NextResponse } from "next/server";
import { findPartnerByCode } from "@/lib/services/partner-referral-service";

/**
 * Landing-page referral tracker.
 *
 * Public pages that receive `?ref=CODE` can POST here to validate the code
 * and stash it in a cookie. Downstream intake code can then read the cookie
 * and copy the referral code into `Inquiry.intakeRef` on submission.
 *
 * We keep this as a separate endpoint so we don't touch the existing
 * intake capture pipeline directly.
 */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { ref?: string } | null;
  const ref = body?.ref?.trim();
  if (!ref) return NextResponse.json({ ok: false, error: "MISSING_REF" }, { status: 400 });
  const partner = await findPartnerByCode(ref);
  if (!partner || partner.status !== "approved") {
    return NextResponse.json({ ok: false, error: "INVALID_REF" }, { status: 404 });
  }
  const res = NextResponse.json({
    ok: true,
    partnerName: partner.name,
    referralCode: partner.referralCode,
  });
  // 60-day tracking cookie
  res.cookies.set("ref", partner.referralCode, {
    path: "/",
    maxAge: 60 * 60 * 24 * 60,
    sameSite: "lax",
  });
  return res;
}
