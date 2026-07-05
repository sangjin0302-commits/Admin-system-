import { NextResponse } from "next/server";
import {
  addTaxPartner,
  completeReferral,
  createReferral,
  deleteTaxPartner,
  getTaxPartnerStats,
  listReferrals,
  markReferralPaid,
  matchTaxPartner,
  updateTaxPartner,
  type TaxSpecialty,
} from "@/lib/services/tax-partner-referral-service";

export async function GET() {
  const [stats, referrals] = await Promise.all([getTaxPartnerStats(), listReferrals()]);
  return NextResponse.json({ ok: true, stats, referrals });
}

interface Body {
  action: "add" | "update" | "delete" | "match" | "refer" | "complete" | "mark-paid";
  id?: string;
  partnerId?: string;
  referralId?: string;
  actualFee?: number;
  taxIssue?: string;
  urgency?: "low" | "normal" | "high";
  location?: string;
  data?: Record<string, unknown>;
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as Body | null;
  if (!body) return NextResponse.json({ ok: false }, { status: 400 });
  if (body.action === "add" && body.data) {
    const d = body.data as {
      name: string; firm: string; specialties: TaxSpecialty[]; location: string;
      contactEmail: string; contactPhone?: string; commissionRate?: number; notes?: string;
    };
    const p = await addTaxPartner(d);
    return NextResponse.json({ ok: true, partner: p });
  }
  if (body.action === "update" && body.id && body.data) {
    const p = await updateTaxPartner(body.id, body.data as never);
    return NextResponse.json({ ok: !!p, partner: p });
  }
  if (body.action === "delete" && body.id) {
    return NextResponse.json({ ok: await deleteTaxPartner(body.id) });
  }
  if (body.action === "match" && body.taxIssue && body.urgency) {
    const matches = await matchTaxPartner(body.taxIssue, body.urgency, body.location);
    return NextResponse.json({ ok: true, matches });
  }
  if (body.action === "refer" && body.data) {
    const d = body.data as {
      partnerId: string; caseId?: string; clientName: string;
      taxIssue: string; urgency: "low" | "normal" | "high"; estimatedFee?: number;
    };
    const r = await createReferral(d);
    return NextResponse.json({ ok: true, referral: r });
  }
  if (body.action === "complete" && body.referralId && typeof body.actualFee === "number") {
    const r = await completeReferral(body.referralId, body.actualFee);
    return NextResponse.json({ ok: !!r, referral: r });
  }
  if (body.action === "mark-paid" && body.referralId) {
    const r = await markReferralPaid(body.referralId);
    return NextResponse.json({ ok: !!r, referral: r });
  }
  return NextResponse.json({ ok: false, error: "UNKNOWN_ACTION" }, { status: 400 });
}
