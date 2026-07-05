import { NextResponse } from "next/server";
import {
  addPrecedent,
  deletePrecedent,
  listPrecedents,
  searchPrecedents,
  syncFromLawbot,
  updatePrecedent,
  type PrecedentFilters,
} from "@/lib/services/precedent-database-service";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q") ?? "";
  const category = url.searchParams.get("category") ?? undefined;
  const court = url.searchParams.get("court") ?? undefined;
  const yearFrom = url.searchParams.get("yearFrom");
  const yearTo = url.searchParams.get("yearTo");
  const filters: PrecedentFilters = {
    category,
    court,
    yearFrom: yearFrom ? Number(yearFrom) : undefined,
    yearTo: yearTo ? Number(yearTo) : undefined,
  };
  const precedents = q || category || court || yearFrom || yearTo
    ? await searchPrecedents(q, filters)
    : await listPrecedents();
  return NextResponse.json({ ok: true, precedents });
}

interface Body {
  action: "add" | "update" | "delete" | "sync";
  id?: string;
  data?: Record<string, unknown>;
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as Body | null;
  if (!body) return NextResponse.json({ ok: false }, { status: 400 });
  if (body.action === "sync") {
    const res = await syncFromLawbot();
    return NextResponse.json({ ok: true, ...res });
  }
  if (body.action === "add" && body.data) {
    const d = body.data as {
      caseNo: string; court: string; decisionDate: string; category: string;
      keywords?: string[]; summary: string; fullText?: string; url?: string; tags?: string[];
    };
    const p = await addPrecedent({
      caseNo: d.caseNo,
      court: d.court,
      decisionDate: d.decisionDate,
      category: d.category,
      keywords: d.keywords ?? [],
      summary: d.summary,
      fullText: d.fullText,
      url: d.url,
      tags: d.tags ?? [],
    });
    return NextResponse.json({ ok: true, precedent: p });
  }
  if (body.action === "update" && body.id && body.data) {
    const p = await updatePrecedent(body.id, body.data as never);
    return NextResponse.json({ ok: !!p, precedent: p });
  }
  if (body.action === "delete" && body.id) {
    const ok = await deletePrecedent(body.id);
    return NextResponse.json({ ok });
  }
  return NextResponse.json({ ok: false, error: "UNKNOWN_ACTION" }, { status: 400 });
}
