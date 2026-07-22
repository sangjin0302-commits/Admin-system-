import { prisma } from "@/lib/prisma/client";
import { generateQuotePdf, type QuotePdfLine } from "@/lib/pdf/generate";
import { FEE_CATEGORY_LABELS } from "@/lib/services/fee-items";

/** 견적 생성 시 사건 타임라인에 기록 (선택). best-effort. */
async function recordQuoteEvent(caseId: string, lines: QuotePdfLine[], totalText?: string) {
  try {
    const exists = await prisma.caseMatter.findUnique({ where: { id: caseId }, select: { id: true } });
    if (!exists) return;
    const summary = lines.map((l) => `${l.service} ${l.amount}`).join(", ").slice(0, 400);
    await prisma.caseEvent.create({
      data: {
        caseId,
        eventType: "quote_generated",
        actorName: "관리자 (견적)",
        message: `견적서 생성: ${summary}${totalText ? ` / 합계 ${totalText}` : ""}`.slice(0, 500),
        payloadJson: JSON.stringify({ lines, totalText }).slice(0, 8000)
      }
    });
  } catch {
    /* 기록 실패해도 PDF 생성은 진행 */
  }
}

/**
 * 선택한 비용 항목으로 견적서 PDF 생성.
 * body: { clientName, feeItemIds: string[], totalText?, signature?, caseId? }
 * /api/admin/* — Basic Auth 보호.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body) return new Response("INVALID_BODY", { status: 400 });

  const clientName = typeof body.clientName === "string" && body.clientName.trim() ? body.clientName.trim() : "(의뢰인)";
  const ids: string[] = Array.isArray(body.feeItemIds) ? body.feeItemIds.filter((x: unknown) => typeof x === "string") : [];
  if (ids.length === 0) return new Response("항목을 1개 이상 선택하세요.", { status: 400 });

  try {
    const items = await prisma.feeItem.findMany({ where: { id: { in: ids } } });
    if (items.length === 0) return new Response("항목을 찾을 수 없습니다.", { status: 404 });

    const lines: QuotePdfLine[] = items.map((i) => ({
      category: FEE_CATEGORY_LABELS[i.category] ?? i.category,
      service: i.service,
      amount: i.amount,
      note: i.note || undefined
    }));

    // 사건에 견적 이력 기록 (caseId가 있으면)
    if (typeof body.caseId === "string" && body.caseId) {
      await recordQuoteEvent(body.caseId, lines, typeof body.totalText === "string" ? body.totalText.trim() : undefined);
    }

    const date = new Date().toISOString().slice(0, 10);
    const pdf = await generateQuotePdf({
      clientName,
      date,
      lines,
      totalText: typeof body.totalText === "string" ? body.totalText.trim() || undefined : undefined,
      signature: typeof body.signature === "string" ? body.signature.trim() || undefined : undefined
    });

    return new Response(Buffer.from(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="quote-${date}.pdf"`
      }
    });
  } catch (error) {
    console.error("admin/fees/quote POST failed", error);
    return new Response("SERVER_ERROR", { status: 500 });
  }
}
