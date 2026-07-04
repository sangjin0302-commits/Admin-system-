import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createPurchase, getCourse } from "@/lib/services/course-service";

interface Body {
  buyerEmail?: string;
  buyerName?: string;
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const course = await getCourse(id);
  if (!course || !course.published) {
    return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
  }
  const body = (await req.json().catch(() => null)) as Body | null;
  if (!body?.buyerEmail) {
    return NextResponse.json({ ok: false, error: "MISSING_EMAIL" }, { status: 400 });
  }

  const orderId = `COURSE-${id}-${Date.now().toString(36)}-${randomUUID().slice(0, 6)}`;
  const purchase = await createPurchase({
    courseId: id,
    buyerEmail: body.buyerEmail,
    buyerName: body.buyerName,
    orderId,
    amount: course.price,
  });

  return NextResponse.json({
    ok: true,
    orderId: purchase.orderId,
    amount: purchase.amount,
    orderName: course.title,
  });
}
