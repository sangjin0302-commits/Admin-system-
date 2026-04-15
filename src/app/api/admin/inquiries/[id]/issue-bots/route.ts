import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdminApiSession } from "@/lib/auth/session";
import { listIssueBotLinks, saveIssueBotLink } from "@/lib/services/issue-bot-service";

const saveIssueBotLinkSchema = z.object({
  botKey: z.string().trim().min(1),
  connectionNotes: z.string().trim().max(2000).optional().or(z.literal("")),
  externalThreadId: z.string().trim().max(200).optional().or(z.literal(""))
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireAdminApiSession("STAFF");
  const { id } = await params;
  const links = await listIssueBotLinks(id);
  return NextResponse.json({ links });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminApiSession("STAFF");
    const { id } = await params;
    const payload = saveIssueBotLinkSchema.parse(await request.json());
    const link = await saveIssueBotLink({
      inquiryId: id,
      botKey: payload.botKey,
      connectionNotes: payload.connectionNotes,
      externalThreadId: payload.externalThreadId
    });

    return NextResponse.json({ link });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "입력값을 다시 확인해 주세요." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "쟁점 봇 연결 정보를 저장하지 못했습니다." },
      { status: 500 }
    );
  }
}
