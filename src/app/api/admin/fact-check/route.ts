import { NextResponse } from "next/server";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import {
  runFactCheckGate,
  getRecentFactChecks,
  setFactCheckPolicy,
  type FactCheckPolicy,
  type ClientDataRecord,
} from "@/lib/services/fact-check-gate-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const recent = await getRecentFactChecks();
  return NextResponse.json({ ok: true, recent });
}

export async function POST(req: Request) {
  const enabled = await isFeatureEnabled("fact_check_gate");
  if (!enabled) {
    return NextResponse.json({ ok: false, error: "fact_check_gate 비활성화" }, { status: 403 });
  }
  const body = (await req.json().catch(() => null)) as
    | {
        text?: string;
        clientData?: ClientDataRecord;
        policy?: Partial<FactCheckPolicy>;
      }
    | null;
  const text = body?.text;
  if (typeof text !== "string" || !text.trim()) {
    return NextResponse.json({ ok: false, error: "text 필수" }, { status: 400 });
  }
  const result = await runFactCheckGate(text, {
    clientData: body?.clientData,
    policy: body?.policy,
  });
  return NextResponse.json({ ok: true, ...result });
}

export async function PATCH(req: Request) {
  const body = (await req.json().catch(() => null)) as Partial<FactCheckPolicy> | null;
  if (!body) return NextResponse.json({ ok: false, error: "body 필수" }, { status: 400 });
  const next = await setFactCheckPolicy(body);
  return NextResponse.json({ ok: true, policy: next });
}
