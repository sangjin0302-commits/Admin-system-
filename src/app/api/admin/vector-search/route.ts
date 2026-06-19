import { NextResponse } from "next/server";
import { addDocument, searchSimilar } from "@/lib/services/vector-search-service";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      content?: string;
      metadata?: Record<string, string>;
      id?: string;
    };
    if (!body.content || typeof body.content !== "string") {
      return NextResponse.json({ error: "content required" }, { status: 400 });
    }
    const id = body.id ?? `doc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    await addDocument({
      id,
      content: body.content,
      metadata: body.metadata ?? {},
    });
    return NextResponse.json({ ok: true, id });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "failed" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q") ?? "";
  const limit = Number(url.searchParams.get("limit") ?? "5");
  if (!q) return NextResponse.json({ results: [] });
  const results = await searchSimilar(q, limit);
  return NextResponse.json({ results });
}
