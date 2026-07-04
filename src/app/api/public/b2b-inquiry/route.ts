import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";

interface Body {
  company?: string;
  contactName?: string;
  email?: string;
  phone?: string;
  expectedMonthly?: number;
  nationalities?: string;
  timeline?: string;
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as Body | null;
  if (!body || !body.company || !body.contactName || !body.email || !body.expectedMonthly) {
    return NextResponse.json({ ok: false, error: "MISSING_FIELDS" }, { status: 400 });
  }

  const meta = {
    kind: "b2b" as const,
    expectedMonthly: body.expectedMonthly,
    nationalities: body.nationalities ?? "",
    timeline: body.timeline ?? "",
  };

  const description = [
    `[B2B] ${body.company}`,
    `월 예상 처리 건수: ${body.expectedMonthly}`,
    body.nationalities ? `주요 국적: ${body.nationalities}` : "",
    body.timeline ? `목표 기간: ${body.timeline}` : "",
    "",
    `metaJson: ${JSON.stringify(meta)}`,
  ]
    .filter(Boolean)
    .join("\n");

  const inquiry = await prisma.inquiry.create({
    data: {
      contactName: body.contactName,
      organizationName: body.company,
      email: body.email,
      phone: body.phone,
      title: `[B2B 문의] ${body.company}`,
      description,
      clientType: "COMPANY",
      isCorporateRequest: true,
      intakeSource: "b2b",
      intakeChannel: "b2b-form",
      generatedSummary: "",
      generatedGuidance: "",
      generatedReceiptMessage: "",
      classificationReason: "",
      recommendedNextStep: "",
    },
  });

  return NextResponse.json({ ok: true, id: inquiry.id });
}
