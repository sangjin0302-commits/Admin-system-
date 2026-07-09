import { prisma } from "@/lib/prisma/client";
import { createAdminRequestContext } from "@/lib/http/admin-api";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type ToneSelection = {
  inquiryId: string;
  tone: "friendly" | "formal" | "practical";
  at: string;
};

const SETTING_KEY = "reply_tone_selections";
const MAX_ENTRIES = 500;
const VALID_TONES = new Set(["friendly", "formal", "practical"]);

export async function POST(req: Request) {
  const { ok, error, logError } = createAdminRequestContext("reply-tone-track:POST");
  try {
    const enabled = await isFeatureEnabled("reply_tone_ab_tracking");
    if (!enabled) return error(403, "reply_tone_ab_tracking disabled");

    const body = await req.json().catch(() => null);
    if (!body?.inquiryId || !body?.tone || !VALID_TONES.has(body.tone)) {
      return error(400, "inquiryId and tone (friendly|formal|practical) required");
    }

    const existing = await prisma.siteSetting.findUnique({ where: { key: SETTING_KEY } });
    const entries: ToneSelection[] = existing ? JSON.parse(existing.value) : [];

    entries.push({ inquiryId: body.inquiryId, tone: body.tone, at: new Date().toISOString() });
    const trimmed = entries.slice(-MAX_ENTRIES);

    await prisma.siteSetting.upsert({
      where: { key: SETTING_KEY },
      create: { key: SETTING_KEY, value: JSON.stringify(trimmed) },
      update: { value: JSON.stringify(trimmed) },
    });

    return ok({ ok: true, count: trimmed.length });
  } catch (e) {
    logError(e);
    return error(500, "Internal error");
  }
}

export async function GET() {
  const { ok, error, logError } = createAdminRequestContext("reply-tone-track:GET");
  try {
    const enabled = await isFeatureEnabled("reply_tone_ab_tracking");
    if (!enabled) return error(403, "reply_tone_ab_tracking disabled");

    const existing = await prisma.siteSetting.findUnique({ where: { key: SETTING_KEY } });
    const entries: ToneSelection[] = existing ? JSON.parse(existing.value) : [];

    const byTone: Record<string, { total: number; ids: Set<string> }> = {
      friendly: { total: 0, ids: new Set() },
      formal: { total: 0, ids: new Set() },
      practical: { total: 0, ids: new Set() },
    };

    for (const e of entries) {
      const bucket = byTone[e.tone];
      if (bucket) {
        bucket.total++;
        bucket.ids.add(e.inquiryId);
      }
    }

    const allIds = [...new Set(entries.map((e) => e.inquiryId))];
    const wonInquiries = allIds.length > 0
      ? await prisma.inquiry.findMany({
          where: { id: { in: allIds }, status: "WON" },
          select: { id: true },
        })
      : [];
    const wonSet = new Set(wonInquiries.map((i) => i.id));

    const stats = (["friendly", "formal", "practical"] as const).map((tone) => {
      const bucket = byTone[tone];
      const wonCount = [...bucket.ids].filter((id) => wonSet.has(id)).length;
      return {
        tone,
        total: bucket.total,
        uniqueInquiries: bucket.ids.size,
        won: wonCount,
        wonRate: bucket.ids.size > 0 ? Math.round((wonCount / bucket.ids.size) * 100) : 0,
      };
    });

    return ok({ ok: true, stats });
  } catch (e) {
    logError(e);
    return error(500, "Internal error");
  }
}
