import { NextResponse } from "next/server";

import { generateBrochurePdf } from "@/lib/services/brochure-pdf-service";

/**
 * GET /api/admin/brochure/download — 인쇄용 브로슈어 PDF (4-page A4).
 * 관리자 인증은 middleware(Basic Auth)에서 처리.
 */
export async function GET(request: Request) {
  try {
    const buffer = await generateBrochurePdf();
    const url = new URL(request.url);
    const disposition = url.searchParams.get("download") === "1" ? "attachment" : "inline";

    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `${disposition}; filename="ethos-brochure.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
