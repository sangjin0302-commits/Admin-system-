import { NextResponse } from "next/server";

import { rateLimit } from "@/lib/services/rate-limiter";
import {
  createApplication,
  isValidTrack,
  CAREER_TRACK_LABEL,
} from "@/lib/services/career-application-service";
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
  const rl = rateLimit(`careers:apply:${ip}`, 5, 60_000);
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
  const name = typeof b.name === "string" ? b.name.trim() : "";
  const email = typeof b.email === "string" ? b.email.trim() : "";
  const phone = typeof b.phone === "string" ? b.phone.trim() : "";
  const track = b.track;
  const resumeUrl = typeof b.resumeUrl === "string" ? b.resumeUrl.trim() : "";
  const cover = typeof b.cover === "string" ? b.cover.trim() : "";

  if (!name || !email || !phone || !cover) {
    return NextResponse.json({ ok: false, error: "필수 항목이 누락되었습니다." }, { status: 400 });
  }
  if (!isValidTrack(track)) {
    return NextResponse.json({ ok: false, error: "지원 트랙을 선택해주세요." }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ ok: false, error: "이메일 형식이 올바르지 않습니다." }, { status: 400 });
  }

  try {
    const app = await createApplication({
      name,
      email,
      phone,
      track,
      resumeUrl: resumeUrl || undefined,
      cover,
    });

    await sendTelegramAlert({
      kind: "system",
      title: `채용 지원 접수 (${CAREER_TRACK_LABEL[app.track]})`,
      lines: [
        `이름: ${app.name}`,
        `이메일: ${app.email}`,
        `연락처: ${app.phone}`,
        resumeUrl ? `이력서: ${resumeUrl}` : "이력서 URL 미첨부",
      ],
      url: `/admin/careers`,
    }).catch((err) => logger.warn("[careers/apply] telegram failed", err));

    return NextResponse.json({ ok: true, id: app.id });
  } catch (err) {
    logger.error("[careers/apply] failed", err);
    return NextResponse.json({ ok: false, error: "지원서 저장에 실패했습니다." }, { status: 500 });
  }
}
