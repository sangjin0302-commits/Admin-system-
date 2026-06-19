import { NextResponse } from "next/server";

import { createSignatureRequest } from "@/lib/services/e-signature-service";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { documentTitle, signerName, signerEmail } = body;

    if (!documentTitle || !signerName || !signerEmail) {
      return NextResponse.json({ error: "필수 항목 누락" }, { status: 400 });
    }

    const result = await createSignatureRequest({
      documentTitle,
      signerName,
      signerEmail,
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("[signatures] error", err);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
