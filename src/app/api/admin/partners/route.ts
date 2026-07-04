import { NextResponse } from "next/server";
import {
  approvePartner,
  getPartnerStats,
  listCommissions,
  markCommissionPaid,
  updatePartner,
} from "@/lib/services/partner-referral-service";

export async function GET() {
  const [stats, commissions] = await Promise.all([getPartnerStats(), listCommissions()]);
  return NextResponse.json({ ok: true, stats, commissions });
}

interface PatchBody {
  action:
    | "approve"
    | "update"
    | "mark-commission-paid";
  partnerId?: string;
  commissionId?: string;
  patch?: {
    status?: "pending" | "approved" | "rejected" | "suspended";
    commissionRate?: number;
    notes?: string;
  };
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as PatchBody | null;
  if (!body) return NextResponse.json({ ok: false, error: "INVALID_BODY" }, { status: 400 });

  if (body.action === "approve") {
    if (!body.partnerId) return NextResponse.json({ ok: false }, { status: 400 });
    const p = await approvePartner(body.partnerId);
    return NextResponse.json({ ok: !!p, partner: p });
  }
  if (body.action === "update") {
    if (!body.partnerId || !body.patch) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }
    const p = await updatePartner(body.partnerId, body.patch);
    return NextResponse.json({ ok: !!p, partner: p });
  }
  if (body.action === "mark-commission-paid") {
    if (!body.commissionId) return NextResponse.json({ ok: false }, { status: 400 });
    const c = await markCommissionPaid(body.commissionId);
    return NextResponse.json({ ok: !!c, commission: c });
  }
  return NextResponse.json({ ok: false, error: "UNKNOWN_ACTION" }, { status: 400 });
}
