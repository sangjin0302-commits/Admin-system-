import { NextResponse } from "next/server";
import {
  createPartnerApplication,
  type PartnerCategory,
} from "@/lib/services/partner-referral-service";

const VALID_CATEGORIES: PartnerCategory[] = ["lawyer", "tax", "accountant", "other"];

interface Body {
  name?: string;
  category?: string;
  email?: string;
  phone?: string;
  expectedMonthlyReferrals?: number;
  notes?: string;
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as Body | null;
  if (!body) return NextResponse.json({ ok: false, error: "INVALID_BODY" }, { status: 400 });

  const name = body.name?.trim();
  const email = body.email?.trim();
  const category = body.category as PartnerCategory | undefined;
  if (!name || !email || !category || !VALID_CATEGORIES.includes(category)) {
    return NextResponse.json({ ok: false, error: "MISSING_FIELDS" }, { status: 400 });
  }

  const partner = await createPartnerApplication({
    name,
    email,
    category,
    phone: body.phone,
    expectedMonthlyReferrals:
      typeof body.expectedMonthlyReferrals === "number"
        ? body.expectedMonthlyReferrals
        : undefined,
    notes: body.notes,
  });

  return NextResponse.json({
    ok: true,
    id: partner.id,
    referralCode: partner.referralCode,
    status: partner.status,
  });
}
