import { NextResponse } from "next/server";

import { formalizeDictation, type DocumentType } from "@/lib/services/document-dictation-service";
import { logger } from "@/lib/utils/logger";

const VALID_TYPES: DocumentType[] = ["의견서", "청구서", "이의신청서"];

export async function POST(req: Request) {
  let body: { transcript?: string; documentType?: string } = {};
  try {
    body = (await req.json()) as { transcript?: string; documentType?: string };
  } catch {
    // ignore
  }
  const transcript = (body.transcript ?? "").trim();
  const documentType = (body.documentType ?? "의견서") as DocumentType;
  if (!transcript) return NextResponse.json({ error: "transcript 필요" }, { status: 400 });
  if (!VALID_TYPES.includes(documentType)) return NextResponse.json({ error: "잘못된 documentType" }, { status: 400 });

  try {
    const result = await formalizeDictation(transcript, documentType);
    return NextResponse.json(result);
  } catch (err) {
    logger.error("[dictation] POST failed", err);
    return NextResponse.json({ error: "정형화 실패" }, { status: 500 });
  }
}
