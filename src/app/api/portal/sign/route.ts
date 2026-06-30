import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma/client";
import { logger } from "@/lib/utils/logger";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { documentId, signatureDataUrl, signerName, clientId } = body;

    if (!documentId || !signatureDataUrl || !signerName) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Find the e-sign request
    const signRequest = await prisma.eSignRequest.findFirst({
      where: { id: documentId },
    });

    if (!signRequest) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // Update status (uses ESignStatus enum: SIGNED)
    await prisma.eSignRequest.update({
      where: { id: documentId },
      data: {
        status: "SIGNED",
        signedAt: new Date(),
      },
    });

    logger.info("[sign] document signed", { documentId, signerName });

    return NextResponse.json({ success: true, signedAt: new Date().toISOString() });
  } catch (err) {
    logger.warn("[sign] error", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
