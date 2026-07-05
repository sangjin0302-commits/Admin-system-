import { NextResponse } from "next/server";

import { rateLimit } from "@/lib/services/rate-limiter";
import { askQuestion } from "@/lib/services/community-service";
import { sendTelegramAlert } from "@/lib/services/telegram-notify";
import { logger } from "@/lib/utils/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

export async function POST(request: Request) {
  const ip = getIp(request);
  const rl = rateLimit(`community:ask:${ip}`, 5, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { ok: false, error: "요청이 너무 잦습니다. 잠시 후 다시 시도해주세요." },
      { status: 429 },
    );
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ ok: false, error: "잘못된 요청 본문" }, { status: 400 });
  }
  const b = body as Record<string, unknown>;
  const title = typeof b.title === "string" ? b.title.trim() : "";
  const bodyText = typeof b.body === "string" ? b.body.trim() : "";
  const category = typeof b.category === "string" ? b.category.trim() : "";
  const askerName = typeof b.askerName === "string" ? b.askerName.trim() : undefined;

  if (title.length < 5 || bodyText.length < 10) {
    return NextResponse.json(
      { ok: false, error: "제목(5자 이상)과 내용(10자 이상)을 입력해주세요." },
      { status: 400 },
    );
  }

  try {
    const q = await askQuestion({ title, body: bodyText, category, askerName });
    await sendTelegramAlert({
      kind: "system",
      title: `커뮤니티 신규 질문 (${q.category})`,
      lines: [q.title.slice(0, 100)],
      url: `/admin/community`,
    }).catch((err) => logger.warn("[community/ask] telegram failed", err));
    return NextResponse.json({ ok: true, id: q.id });
  } catch (err) {
    logger.error("[community/ask] failed", err);
    return NextResponse.json({ ok: false, error: "질문 저장에 실패했습니다." }, { status: 500 });
  }
}
