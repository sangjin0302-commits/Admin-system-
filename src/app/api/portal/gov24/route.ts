import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma/client";
import { requestDocument, GOV24_DOC_TYPES } from "@/lib/services/gov24-service";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const DOC_CODES = GOV24_DOC_TYPES.map((d) => d.code) as [string, ...string[]];

const Schema = z.object({
  type: z.enum(DOC_CODES),
  ownerConsent: z.boolean(),
  caseId: z.string().optional(),
  note: z.string().optional(),
});

export async function POST(req: Request) {
  if (!(await isFeatureEnabled("gov24_integration"))) {
    return NextResponse.json({ ok: false, error: "정부24 연동이 비활성 상태입니다" }, { status: 403 });
  }
  const session = await auth();
  if (!session?.user) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const userId = (session.user as { id?: string }).id;
  const client = userId ? await prisma.portalClient.findUnique({ where: { id: userId } }) : null;
  if (!client) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: "invalid json" }, { status: 400 }); }
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message ?? "invalid" }, { status: 400 });

  try {
    const res = await requestDocument(parsed.data.type as (typeof GOV24_DOC_TYPES)[number]["code"], parsed.data.ownerConsent, {
      caseId: parsed.data.caseId,
      requesterName: client.name,
      requesterEmail: client.email,
      note: parsed.data.note,
    });
    return NextResponse.json({ ok: true, ...res });
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 400 });
  }
}
