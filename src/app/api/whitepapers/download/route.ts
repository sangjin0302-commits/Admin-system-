import { NextResponse } from "next/server";
import { consumeDownloadLink } from "@/lib/services/whitepaper-service";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  if (!token) return NextResponse.json({ ok: false, error: "NO_TOKEN" }, { status: 400 });
  const result = await consumeDownloadLink(token);
  if (!result) return NextResponse.json({ ok: false, error: "EXPIRED_OR_INVALID" }, { status: 404 });
  // Redirect to the actual PDF URL (assumes hosted URL)
  if (/^https?:\/\//i.test(result.whitepaper.pdfUrl)) {
    return NextResponse.redirect(result.whitepaper.pdfUrl, 302);
  }
  return NextResponse.json({
    ok: true,
    whitepaper: {
      id: result.whitepaper.id,
      title: result.whitepaper.title,
      pdfUrl: result.whitepaper.pdfUrl,
    },
    buyerEmail: result.buyerEmail,
  });
}
