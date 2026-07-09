import { NextResponse } from "next/server";
import { requireRole } from "@/lib/services/admin-rbac-service";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { prisma } from "@/lib/prisma/client";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const SITE_SETTING_KEY = "inquiry_label_feedback";
const MAX_ENTRIES = 5000;

type FeedbackEntry = {
  inquiryId: string;
  labelKey: string;
  correct: boolean;
  createdAt: string;
};

async function readFeedback(): Promise<FeedbackEntry[]> {
  const row = await prisma.siteSetting.findUnique({ where: { key: SITE_SETTING_KEY } });
  if (!row?.value) return [];
  try {
    const parsed = JSON.parse(row.value);
    return Array.isArray(parsed) ? (parsed as FeedbackEntry[]) : [];
  } catch {
    return [];
  }
}

async function writeFeedback(entries: FeedbackEntry[]): Promise<void> {
  const trimmed = entries.slice(-MAX_ENTRIES);
  await prisma.siteSetting.upsert({
    where: { key: SITE_SETTING_KEY },
    create: { key: SITE_SETTING_KEY, value: JSON.stringify(trimmed) },
    update: { value: JSON.stringify(trimmed) },
  });
}

export async function GET(req: Request) {
  const guard = await requireRole(req, ["SUPER", "MANAGER"]);
  if (!guard.ok) return guard.response;

  const inquiries = await prisma.inquiry.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      title: true,
      inquiryType: true,
      urgencyLevel: true,
      classificationConfidence: true,
      createdAt: true,
    },
  });

  const feedback = await readFeedback();
  const feedbackByInquiry = new Map<string, FeedbackEntry[]>();
  for (const f of feedback) {
    const list = feedbackByInquiry.get(f.inquiryId) ?? [];
    list.push(f);
    feedbackByInquiry.set(f.inquiryId, list);
  }

  const total = feedback.length;
  const correct = feedback.filter((f) => f.correct).length;

  return NextResponse.json({
    inquiries: inquiries.map((i) => ({
      ...i,
      createdAt: i.createdAt.toISOString(),
      feedback: feedbackByInquiry.get(i.id) ?? [],
    })),
    stats: { total, correct, accuracy: total > 0 ? correct / total : 0 },
  });
}

export async function POST(req: Request) {
  const guard = await requireRole(req, ["SUPER", "MANAGER"]);
  if (!guard.ok) return guard.response;

  if (!(await isFeatureEnabled("inquiry_label_retrain"))) {
    return NextResponse.json({ error: "feature disabled" }, { status: 403 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    inquiryId?: string;
    labelKey?: string;
    correct?: boolean;
  };

  if (!body.inquiryId || !body.labelKey || typeof body.correct !== "boolean") {
    return NextResponse.json({ error: "inquiryId, labelKey, correct required" }, { status: 400 });
  }

  const entries = await readFeedback();
  entries.push({
    inquiryId: body.inquiryId,
    labelKey: body.labelKey,
    correct: body.correct,
    createdAt: new Date().toISOString(),
  });
  await writeFeedback(entries);

  return NextResponse.json({ ok: true });
}
