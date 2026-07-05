import { NextResponse } from "next/server";
import { addPeer } from "@/lib/services/admin-network-service";

interface Body {
  name: string;
  firm: string;
  specialties: string;
  contactEmail: string;
  phone?: string;
  notes?: string;
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as Body | null;
  if (!body || !body.name || !body.firm || !body.contactEmail) {
    return NextResponse.json({ ok: false, error: "REQUIRED_FIELDS" }, { status: 400 });
  }
  const peer = await addPeer({
    name: body.name,
    firm: body.firm,
    specialties: body.specialties.split(",").map((s) => s.trim()).filter(Boolean),
    contactEmail: body.contactEmail,
    phone: body.phone,
    notes: body.notes,
    verified: false,
  });
  return NextResponse.json({ ok: true, peerId: peer.id });
}
