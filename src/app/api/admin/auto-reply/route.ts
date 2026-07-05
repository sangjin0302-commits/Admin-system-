import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import {
  evaluateAndReply,
  generateAutoReplyDraft,
  getAutoReplyConfig,
  listPendingAutoReplies,
  removePendingAutoReply,
  saveAutoReplyConfig,
  type AutoReplyConfig
} from "@/lib/services/ai-auto-reply-service";
import { logger } from "@/lib/utils/logger";

export async function GET() {
  try {
    const [queue, config] = await Promise.all([listPendingAutoReplies(), getAutoReplyConfig()]);
    return NextResponse.json({ queue, config });
  } catch (err) {
    logger.error("[admin/auto-reply] GET failed", err);
    return NextResponse.json({ error: "조회 실패" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    // ignore
  }
  const action = typeof body.action === "string" ? body.action : "draft";

  try {
    if (action === "draft") {
      // Legacy path: generate a draft for an inquiryId.
      const inquiryId = typeof body.inquiryId === "string" ? body.inquiryId : "";
      if (!inquiryId) return NextResponse.json({ error: "inquiryId 필요" }, { status: 400 });
      const inquiry = await prisma.inquiry.findUnique({
        where: { id: inquiryId },
        select: { contactName: true, inquiryType: true, description: true, title: true }
      });
      if (!inquiry) return NextResponse.json({ error: "문의를 찾을 수 없습니다" }, { status: 404 });
      const draft = await generateAutoReplyDraft({
        name: inquiry.contactName,
        inquiryType: inquiry.inquiryType,
        message: inquiry.description,
        title: inquiry.title
      });
      return NextResponse.json({ draft });
    }

    if (action === "evaluate") {
      const inquiryId = typeof body.inquiryId === "string" ? body.inquiryId : "";
      if (!inquiryId) return NextResponse.json({ error: "inquiryId 필요" }, { status: 400 });
      const result = await evaluateAndReply(inquiryId);
      return NextResponse.json(result);
    }

    if (action === "approve" || action === "reject") {
      const inquiryId = typeof body.inquiryId === "string" ? body.inquiryId : "";
      if (!inquiryId) return NextResponse.json({ error: "inquiryId 필요" }, { status: 400 });
      await removePendingAutoReply(inquiryId);
      return NextResponse.json({ ok: true, action, inquiryId });
    }

    if (action === "config") {
      const c = (body.config ?? {}) as Partial<AutoReplyConfig>;
      const cfg: AutoReplyConfig = {
        minConfidence: typeof c.minConfidence === "number" ? c.minConfidence : 0.6,
        autoSendThreshold: typeof c.autoSendThreshold === "number" ? c.autoSendThreshold : 0.9,
        categories: Array.isArray(c.categories) ? c.categories.filter((v) => typeof v === "string") : []
      };
      await saveAutoReplyConfig(cfg);
      return NextResponse.json({ ok: true, config: cfg });
    }

    return NextResponse.json({ error: "알 수 없는 action" }, { status: 400 });
  } catch (err) {
    logger.error("[admin/auto-reply] POST failed", err);
    return NextResponse.json({ error: "처리 실패" }, { status: 500 });
  }
}
