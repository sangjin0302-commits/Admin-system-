import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { renderQuotePdf } from "@/lib/services/quote-pdf";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const quote = await prisma.quote.findUnique({
    where: { id },
    include: {
      lineItems: { orderBy: { sortOrder: "asc" } },
      adjustments: { orderBy: { sortOrder: "asc" } },
      paymentPlans: { orderBy: { sortOrder: "asc" } },
      inquiry: true,
    },
  });

  if (!quote) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const pdfBuffer = await renderQuotePdf(quote);

  return new Response(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="quote-${quote.id.slice(0, 8)}.pdf"`,
    },
  });
}
