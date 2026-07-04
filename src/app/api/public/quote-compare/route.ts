import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";

import { prisma } from "@/lib/prisma/client";
import { putFile } from "@/lib/storage/file-storage";
import { sendTelegramAlert } from "@/lib/services/telegram-notify";
import { consumeRateLimit, getClientIpFromHeaders } from "@/lib/security/rate-limit";
import { logger } from "@/lib/utils/logger";

/**
 * 비교 견적 요청서.
 * 업로드된 견적서 파일 + 최소 연락처를 받아 리드로 저장하고 관리자에게 알림.
 *
 * NOTE: Inquiry 스키마는 필수 필드가 많아 초기 리드 단계에서는 IntakeAbandonment 를
 *       재사용한다. category "quote_compare" + name/phone 만 저장되며, 파일은
 *       스토리지에 업로드된 뒤 텔레그램 알림에 storage key 로 첨부된다.
 */

export const maxDuration = 30;

const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/pdf"
]);

function extFor(type: string): string {
  if (type === "image/png") return "png";
  if (type === "image/jpeg") return "jpg";
  if (type === "image/webp") return "webp";
  if (type === "application/pdf") return "pdf";
  return "bin";
}

export async function POST(req: Request) {
  const ip = getClientIpFromHeaders(req.headers) ?? "unknown";
  const rl = consumeRateLimit({
    namespace: "public:quote-compare",
    key: ip,
    max: 5,
    windowMs: 60_000
  });
  if (!rl.allowed) {
    return NextResponse.json(
      { ok: false, error: "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } }
    );
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ ok: false, error: "잘못된 요청입니다." }, { status: 400 });
  }

  const file = form.get("file");
  const name = (form.get("name") ?? "").toString().trim();
  const phone = (form.get("phone") ?? "").toString().trim();
  const note = (form.get("note") ?? "").toString().trim();

  if (!name || !phone) {
    return NextResponse.json(
      { ok: false, error: "성함과 연락처를 입력해 주세요." },
      { status: 400 }
    );
  }
  if (!(file instanceof File)) {
    return NextResponse.json(
      { ok: false, error: "견적서 파일을 업로드해 주세요." },
      { status: 400 }
    );
  }
  if (file.size <= 0 || file.size > MAX_BYTES) {
    return NextResponse.json(
      { ok: false, error: "파일 크기가 유효하지 않습니다." },
      { status: 400 }
    );
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json(
      { ok: false, error: "지원하지 않는 파일 형식입니다." },
      { status: 400 }
    );
  }

  let storageKey: string | null = null;
  try {
    const buf = Buffer.from(await file.arrayBuffer());
    const storedName = `quote-compare/${Date.now()}-${randomUUID()}.${extFor(file.type)}`;
    const put = await putFile(storedName, buf, file.type);
    storageKey = put.key;
  } catch (err) {
    logger.error("[quote-compare] file upload failed", err);
    return NextResponse.json(
      { ok: false, error: "파일 업로드에 실패했습니다." },
      { status: 500 }
    );
  }

  try {
    await prisma.intakeAbandonment.create({
      data: {
        email: "",
        phone,
        name,
        category: "quote_compare",
        step: 0
      }
    });
  } catch (err) {
    logger.warn("[quote-compare] lead persistence failed", err);
    // Non-fatal — we still notify the admin below.
  }

  void sendTelegramAlert({
    kind: "inquiry",
    title: `새 비교 견적 요청: ${name}`,
    lines: [
      `이름: ${name}`,
      `연락처: ${phone}`,
      note ? `요청: ${note}` : "요청: (없음)",
      `첨부: ${storageKey} (${file.type}, ${file.size}B)`
    ]
  }).catch(() => {});

  return NextResponse.json({ ok: true, attachmentKey: storageKey });
}
