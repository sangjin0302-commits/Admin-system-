import { NextResponse } from "next/server";
import {
  createReferral,
  deletePartner,
  listPartners,
  listReferrals,
  matchLawyerForCase,
  totalCommissions,
  updateReferral,
  upsertPartner,
  type PartnerLawyer,
  type ReferralStatus,
} from "@/lib/services/lawyer-referral-service";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const match = url.searchParams.get("match");
  if (match) {
    const category = url.searchParams.get("category") ?? "";
    const urgency = (url.searchParams.get("urgency") ?? "normal") as "low" | "normal" | "high" | "critical";
    const location = url.searchParams.get("location") ?? undefined;
    const lawyers = await matchLawyerForCase(category, urgency, location);
    return NextResponse.json({ ok: true, lawyers });
  }
  const [partners, referrals, commissions] = await Promise.all([
    listPartners(), listReferrals(), totalCommissions(),
  ]);
  return NextResponse.json({ ok: true, partners, referrals, commissions });
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as
    | {
        action?: "partner.upsert" | "partner.delete" | "referral.create" | "referral.update";
        partner?: Partial<PartnerLawyer>;
        partnerId?: string;
        referral?: {
          caseId: string;
          caseCategory: string;
          urgency: "low" | "normal" | "high" | "critical";
          location?: string;
          lawyerId: string;
          estimatedFeeKrw?: number;
          notes?: string;
        };
        referralId?: string;
        status?: ReferralStatus;
        estimatedFeeKrw?: number;
        notes?: string;
      }
    | null;
  if (!body?.action) return NextResponse.json({ ok: false, error: "NO_ACTION" }, { status: 400 });

  if (body.action === "partner.upsert" && body.partner) {
    await upsertPartner({
      id: body.partner.id,
      name: body.partner.name ?? "",
      firm: body.partner.firm ?? "",
      specialties: body.partner.specialties ?? [],
      location: body.partner.location ?? "",
      contact: body.partner.contact ?? {},
      commissionRate: body.partner.commissionRate ?? 0.15,
      active: body.partner.active ?? true,
      notes: body.partner.notes,
    });
  } else if (body.action === "partner.delete" && body.partnerId) {
    await deletePartner(body.partnerId);
  } else if (body.action === "referral.create" && body.referral) {
    await createReferral(body.referral);
  } else if (body.action === "referral.update" && body.referralId && body.status) {
    await updateReferral(body.referralId, { status: body.status, estimatedFeeKrw: body.estimatedFeeKrw, notes: body.notes });
  } else {
    return NextResponse.json({ ok: false, error: "INVALID" }, { status: 400 });
  }

  const [partners, referrals, commissions] = await Promise.all([listPartners(), listReferrals(), totalCommissions()]);
  return NextResponse.json({ ok: true, partners, referrals, commissions });
}
