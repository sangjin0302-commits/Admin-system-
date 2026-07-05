import { NextResponse } from "next/server";
import { anonymizeText, toJsonl } from "@/lib/services/dataset-marketplace-service";
import { prisma } from "@/lib/prisma/client";

/**
 * 카테고리별 익명화 샘플 JSONL 생성. CaseMatter / Inquiry 등에서 수집 후 PII 제거.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const category = url.searchParams.get("category") ?? "mixed";

  const inquiries: Array<{ id: string; description: string; createdAt: Date }> = await prisma.inquiry
    .findMany({ take: 20, orderBy: { createdAt: "desc" }, select: { id: true, description: true, createdAt: true } })
    .catch(() => []);

  const records = inquiries
    .filter((i) => Boolean(i.description))
    .map((i) => ({
      id: i.id,
      category,
      text: anonymizeText(i.description),
      created_at: i.createdAt.toISOString().slice(0, 10),
    }));

  return NextResponse.json({ ok: true, size: records.length, jsonl: toJsonl(records) });
}
