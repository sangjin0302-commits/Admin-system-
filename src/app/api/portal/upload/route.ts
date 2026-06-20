import crypto from "node:crypto";
import path from "node:path";

import { NextResponse } from "next/server";

import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma/client";
import { logAudit } from "@/lib/services/audit-log";
import { putFile } from "@/lib/storage/file-storage";
import { logger } from "@/lib/utils/logger";

const ALLOWED_MIME = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
]);

function getMaxBytes(): number {
  const env = Number(process.env.PORTAL_UPLOAD_MAX_BYTES ?? "10485760");
  return Number.isFinite(env) && env > 0 ? env : 10 * 1024 * 1024;
}

export async function POST(request: Request) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) {
    return NextResponse.json({ ok: false, error: "로그인이 필요합니다." }, { status: 401 });
  }

  const formData = await request.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ ok: false, error: "잘못된 요청입니다." }, { status: 400 });
  }

  const file = formData.get("file");
  const inquiryId = formData.get("inquiryId");
  const caseId = formData.get("caseId");
  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: "파일이 누락되었습니다." }, { status: 400 });
  }

  const max = getMaxBytes();
  if (file.size > max) {
    return NextResponse.json(
      { ok: false, error: `파일 크기는 ${Math.floor(max / 1024 / 1024)}MB 이하여야 합니다.` },
      { status: 413 }
    );
  }
  if (!ALLOWED_MIME.has(file.type)) {
    return NextResponse.json(
      { ok: false, error: "지원하지 않는 파일 형식입니다 (PDF / 이미지 / Word / Excel)." },
      { status: 415 }
    );
  }

  const safeBaseName = path.basename(file.name).replace(/[^\w.\-가-힣]/g, "_").slice(0, 80);
  const uniq = crypto.randomBytes(8).toString("hex");
  const storedName = `${userId}-${uniq}-${safeBaseName}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  let storedKey: string;
  try {
    const put = await putFile(storedName, buffer, file.type);
    storedKey = put.key;
  } catch (error) {
    logger.error("[portal/upload] storage put failed", error);
    return NextResponse.json(
      { ok: false, error: "파일 저장에 실패했습니다." },
      { status: 500 }
    );
  }

  const record = await prisma.portalUploadedFile.create({
    data: {
      clientId: userId,
      inquiryId: typeof inquiryId === "string" && inquiryId ? inquiryId : null,
      caseId: typeof caseId === "string" && caseId ? caseId : null,
      fileName: safeBaseName,
      storedPath: storedKey,
      mimeType: file.type,
      sizeBytes: file.size
    }
  });

  await logAudit({
    event: "portal.upload",
    caseId: record.caseId,
    actorId: userId,
    actorName: null,
    message: `의뢰인이 자료를 업로드했습니다: ${record.fileName}`,
    payload: { fileId: record.id, mimeType: record.mimeType, sizeBytes: record.sizeBytes }
  });

  return NextResponse.json({
    ok: true,
    file: {
      id: record.id,
      fileName: record.fileName,
      sizeBytes: record.sizeBytes,
      uploadedAt: record.uploadedAt
    }
  });
}
