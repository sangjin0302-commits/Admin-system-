import { NextResponse } from "next/server";
import { extractText, extractIdCard, extractInvoice } from "@/lib/services/ocr-service";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      imageBase64?: string;
      mimeType?: string;
      extractionType?: "text" | "id" | "invoice";
    };
    if (!body.imageBase64) {
      return NextResponse.json({ error: "imageBase64 required" }, { status: 400 });
    }
    const mimeType = body.mimeType ?? "image/jpeg";
    const type = body.extractionType ?? "text";

    if (type === "id") {
      const result = await extractIdCard(body.imageBase64);
      return NextResponse.json({ type, result });
    }
    if (type === "invoice") {
      const result = await extractInvoice(body.imageBase64);
      return NextResponse.json({ type, result });
    }
    const result = await extractText(body.imageBase64, mimeType);
    return NextResponse.json({ type, result });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "failed" },
      { status: 500 }
    );
  }
}
