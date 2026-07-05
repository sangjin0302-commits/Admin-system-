import { NextResponse } from "next/server";
import {
  deleteWhitepaper,
  listPurchases,
  listWhitepapers,
  setPublished,
  upsertWhitepaper,
  type Whitepaper,
} from "@/lib/services/whitepaper-service";

export async function GET() {
  const [items, purchases] = await Promise.all([
    listWhitepapers(),
    listPurchases(),
  ]);
  return NextResponse.json({ ok: true, items, purchases });
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as
    | { action?: "upsert" | "delete" | "publish"; whitepaper?: Partial<Whitepaper>; id?: string; published?: boolean }
    | null;
  if (!body?.action) return NextResponse.json({ ok: false, error: "NO_ACTION" }, { status: 400 });

  if (body.action === "upsert" && body.whitepaper) {
    const w = body.whitepaper;
    await upsertWhitepaper({
      id: w.id,
      title: w.title ?? "",
      description: w.description ?? "",
      price: w.price ?? 0,
      tocPreview: w.tocPreview ?? [],
      pdfUrl: w.pdfUrl ?? "",
      coverImage: w.coverImage,
      category: (w.category ?? "practice_guide") as Whitepaper["category"],
      published: w.published ?? false,
      sampleUrl: w.sampleUrl,
    });
  } else if (body.action === "delete" && body.id) {
    await deleteWhitepaper(body.id);
  } else if (body.action === "publish" && body.id && typeof body.published === "boolean") {
    await setPublished(body.id, body.published);
  } else {
    return NextResponse.json({ ok: false, error: "INVALID" }, { status: 400 });
  }

  const [items, purchases] = await Promise.all([listWhitepapers(), listPurchases()]);
  return NextResponse.json({ ok: true, items, purchases });
}
