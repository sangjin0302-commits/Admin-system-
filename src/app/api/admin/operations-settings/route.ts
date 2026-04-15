import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdminApiSession } from "@/lib/auth/session";
import { getOperationsSettings, saveOperationsSettings } from "@/lib/operations-content/service";

const operationsSettingsSchema = z.object({
  consultationIntro: z.string().trim().min(1),
  priorityConsultationGuide: z.string().trim().min(1),
  paidDiagnosisGuide: z.string().trim().min(1),
  docsReviewGuide: z.string().trim().min(1),
  declineGuide: z.string().trim().min(1),
  consultationLinkLabel: z.string().trim().min(1),
  consultationLinkUrl: z.string().trim().optional().default(""),
  contractGuide: z.string().trim().min(1),
  paymentGuide: z.string().trim().min(1),
  paymentMethodLabel: z.string().trim().min(1),
  paymentLinkUrl: z.string().trim().optional().default(""),
  bankTransferGuide: z.string().trim().min(1),
  internalRoutingNote: z.string().trim().min(1)
});

export async function GET() {
  await requireAdminApiSession("ADMIN");
  const settings = await getOperationsSettings();
  return NextResponse.json({ settings });
}

export async function PUT(request: Request) {
  try {
    await requireAdminApiSession("ADMIN");
    const payload = operationsSettingsSchema.parse(await request.json());
    await saveOperationsSettings(payload);
    return NextResponse.json({ settings: payload });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "입력값을 다시 확인해 주세요." },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: "운영 설정을 저장하지 못했습니다." }, { status: 500 });
  }
}
