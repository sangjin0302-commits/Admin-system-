import { NextResponse } from "next/server";
import { ocrDocument, DOCUMENT_TYPES } from "@/lib/services/document-ocr-service";
import { prisma } from "@/lib/prisma/client";
import { logger } from "@/lib/utils/logger";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const MAX_BYTES = 8 * 1024 * 1024; // 8MB

export async function POST(req: Request) {
  const contentType = req.headers.get("content-type") || "";

  try {
    let base64: string | undefined;
    let mimeType: string | undefined;
    let attachTo: { kind: "inquiry" | "case"; id: string } | null = null;

    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const file = form.get("file");
      if (!(file instanceof File)) {
        return NextResponse.json({ error: "file required (multipart field 'file')" }, { status: 400 });
      }
      if (file.size > MAX_BYTES) {
        return NextResponse.json({ error: "file too large (max 8MB)" }, { status: 413 });
      }
      const buf = Buffer.from(await file.arrayBuffer());
      base64 = buf.toString("base64");
      mimeType = file.type || "image/jpeg";
      const inquiryId = form.get("inquiryId");
      const caseId = form.get("caseId");
      if (typeof inquiryId === "string" && inquiryId.trim()) attachTo = { kind: "inquiry", id: inquiryId.trim() };
      else if (typeof caseId === "string" && caseId.trim()) attachTo = { kind: "case", id: caseId.trim() };
    } else {
      const body = (await req.json().catch(() => ({}))) as {
        imageBase64?: string;
        mimeType?: string;
        attach?: { kind: "inquiry" | "case"; id: string };
      };
      base64 = body.imageBase64;
      mimeType = body.mimeType || "image/jpeg";
      if (body.attach?.kind && body.attach.id) {
        attachTo = { kind: body.attach.kind, id: body.attach.id };
      }
    }

    if (!base64) {
      return NextResponse.json({ error: "image required" }, { status: 400 });
    }

    const result = await ocrDocument({ imageBase64: base64, mimeType });

    // Attach classification note to inquiry/case if requested
    if (attachTo) {
      const noteLine = `\n[OCR ${new Date().toISOString().slice(0, 19)}] type=${result.type} confidence=${result.confidence.toFixed(2)}${result.reason ? ` (${result.reason})` : ""}`;
      try {
        if (attachTo.kind === "inquiry") {
          const cur = await prisma.inquiry.findUnique({
            where: { id: attachTo.id },
            select: { internalMemo: true },
          });
          if (cur) {
            await prisma.inquiry.update({
              where: { id: attachTo.id },
              data: { internalMemo: `${cur.internalMemo ?? ""}${noteLine}`.slice(0, 8000) },
            });
          }
        } else {
          // CaseMatter has internalMemo per schema (line 665)
          const cm = await prisma.caseMatter.findUnique({
            where: { id: attachTo.id },
            select: { internalMemo: true },
          }).catch(() => null);
          if (cm) {
            await prisma.caseMatter.update({
              where: { id: attachTo.id },
              data: { internalMemo: `${cm.internalMemo ?? ""}${noteLine}`.slice(0, 8000) },
            });
          }
        }
      } catch (err) {
        logger.warn("[document-ocr] attach failed", err);
      }
    }

    return NextResponse.json({
      ok: true,
      result: {
        text: result.text,
        type: result.type,
        confidence: result.confidence,
        reason: result.reason,
        fields: result.fields ?? {},
        usedVision: result.usedVision,
      },
      supportedTypes: DOCUMENT_TYPES,
      attached: attachTo,
    });
  } catch (err) {
    logger.error("[document-ocr] failed", err);
    return NextResponse.json(
      { error: "ocr_failed" },
      { status: 500 }
    );
  }
}
