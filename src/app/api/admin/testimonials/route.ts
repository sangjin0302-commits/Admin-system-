import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma/client";
import { listAdminTestimonials } from "@/lib/services/testimonials";
import { PRACTICE_AREA_KEYS } from "@/lib/practice-areas";

const VALID_CATEGORIES = PRACTICE_AREA_KEYS;

export async function GET() {
  const items = await listAdminTestimonials();
  return NextResponse.json({ ok: true, items });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ ok: false, error: "INVALID_BODY" }, { status: 400 });

  const category =
    typeof body.category === "string" && VALID_CATEGORIES.includes(body.category) ? body.category : null;
  const quote = typeof body.quote === "string" ? body.quote.trim() : "";
  const author = typeof body.author === "string" ? body.author.trim() : "";
  const context = typeof body.context === "string" ? body.context.trim() : "";

  if (!category || !quote || !author) {
    return NextResponse.json({ ok: false, error: "분야/후기/작성자는 필수입니다." }, { status: 400 });
  }

  try {
    const created = await prisma.testimonial.create({
      data: {
        category,
        quote,
        author,
        context: context || "",
        published: body.published !== false,
        sortOrder: typeof body.sortOrder === "number" ? body.sortOrder : 0
      }
    });

    return NextResponse.json({ ok: true, item: created });
  } catch (error) {
    console.error("admin/testimonials POST failed", error);
    return NextResponse.json({ ok: false, error: "SERVER_ERROR" }, { status: 500 });
  }
}
