import { NextResponse } from "next/server";
import {
  addPeer,
  handoffCase,
  listHandoffs,
  listPeers,
  listShares,
  removePeer,
  shareCaseWithPeer,
  updateHandoffStatus,
  verifyPeer,
} from "@/lib/services/admin-network-service";

export async function GET() {
  const [peers, shares, handoffs] = await Promise.all([
    listPeers(), listShares(), listHandoffs(),
  ]);
  return NextResponse.json({ ok: true, peers, shares, handoffs });
}

interface Body {
  action: "add-peer" | "verify-peer" | "remove-peer" | "share" | "handoff" | "update-handoff";
  peerId?: string;
  caseId?: string;
  handoffId?: string;
  message?: string;
  splitPct?: number;
  status?: "proposed" | "accepted" | "completed" | "cancelled";
  data?: {
    name: string; firm: string; specialties: string[]; contactEmail: string;
    phone?: string; notes?: string; verified?: boolean;
  };
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as Body | null;
  if (!body) return NextResponse.json({ ok: false }, { status: 400 });
  if (body.action === "add-peer" && body.data) {
    const p = await addPeer(body.data);
    return NextResponse.json({ ok: true, peer: p });
  }
  if (body.action === "verify-peer" && body.peerId) {
    const p = await verifyPeer(body.peerId);
    return NextResponse.json({ ok: !!p, peer: p });
  }
  if (body.action === "remove-peer" && body.peerId) {
    const ok = await removePeer(body.peerId);
    return NextResponse.json({ ok });
  }
  if (body.action === "share" && body.caseId && body.peerId) {
    const s = await shareCaseWithPeer(body.caseId, body.peerId, body.message ?? "");
    return NextResponse.json({ ok: true, share: s });
  }
  if (body.action === "handoff" && body.caseId && body.peerId && typeof body.splitPct === "number") {
    const h = await handoffCase(body.caseId, body.peerId, body.splitPct, body.message);
    return NextResponse.json({ ok: true, handoff: h });
  }
  if (body.action === "update-handoff" && body.handoffId && body.status) {
    const h = await updateHandoffStatus(body.handoffId, body.status);
    return NextResponse.json({ ok: !!h, handoff: h });
  }
  return NextResponse.json({ ok: false, error: "UNKNOWN_ACTION" }, { status: 400 });
}
