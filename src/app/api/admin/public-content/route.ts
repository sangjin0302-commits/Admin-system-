import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdminApiSession } from "@/lib/auth/session";
import { getPublicIntakeContent, savePublicIntakeContent } from "@/lib/public-content/service";

const localeContentSchema = z.object({
  heroTitle: z.string().trim().min(1),
  heroDescription: z.string().trim().min(1),
  primaryAreas: z.array(z.string().trim().min(1)).min(1),
  additionalGuidance: z.array(z.string().trim().min(1)).min(1),
  intakePageTitle: z.string().trim().min(1),
  intakePageDescription: z.string().trim().min(1),
  intakeInfoTitle: z.string().trim().min(1),
  intakeInfoItems: z.array(z.string().trim().min(1)).min(1)
});

const publicIntakeContentSchema = z.object({
  ko: localeContentSchema,
  en: localeContentSchema
});

export async function GET() {
  await requireAdminApiSession("ADMIN");
  const content = await getPublicIntakeContent();
  return NextResponse.json({ content });
}

export async function PUT(request: Request) {
  try {
    await requireAdminApiSession("ADMIN");
    const payload = publicIntakeContentSchema.parse(await request.json());
    await savePublicIntakeContent(payload);
    return NextResponse.json({ content: payload });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "입력값을 다시 확인해 주세요." },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: "공개 접수 문구를 저장하지 못했습니다." }, { status: 500 });
  }
}
