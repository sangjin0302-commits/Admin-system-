/**
 * NN7: 매일 법률정보 전달 cron.
 *
 * 매일 아침 관심 카테고리 신법령·판례 요약을 텔레그램으로 전송.
 * 초기 구현: SiteSetting key "legal.info.interests" (JSON string[]) 기반 stub 메시지.
 * 추후 확장: 국가법령정보센터 API + AI 요약.
 *
 * Feature flag: `legal_info_delivery_daily` (default: false)
 * Vercel cron 등록 필요: /api/cron/legal-info-daily @ "0 22 * * *" (KST 07:00)
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { sendTelegramAlert } from "@/lib/services/telegram-notify";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { smartInvoke } from "@/lib/services/smart-ai-client";
import { logger } from "@/lib/utils/logger";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const SETTING_KEY = "legal.info.interests";
const DEFAULT_INTERESTS = ["행정심판", "인허가", "행정소송"];

async function getInterests(): Promise<string[]> {
  try {
    const setting = await prisma.siteSetting.findUnique({ where: { key: SETTING_KEY } });
    if (!setting?.value) return DEFAULT_INTERESTS;
    const parsed = JSON.parse(setting.value);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_INTERESTS;
  } catch {
    return DEFAULT_INTERESTS;
  }
}

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!(await isFeatureEnabled("legal_info_delivery_daily"))) {
    return NextResponse.json({ ok: true, skipped: "feature_disabled" });
  }

  try {
    const interests = await getInterests();
    const today = new Date().toLocaleDateString("ko-KR");
    const aiEnabled = await isFeatureEnabled("legal_info_ai_summary").catch(() => false);

    let aiSummary: string | null = null;
    if (aiEnabled) {
      try {
        const res = await smartInvoke(
          "summarize",
          `당신은 한국 행정사 실무자입니다. 다음 관심 분야에 대해 오늘(${today}) 실무자가 체크할 만한 최근 트렌드/이슈 3가지를 각 1줄로 요약해주세요.\n\n관심 분야: ${interests.join(", ")}\n\n형식:\n1. [분야] 이슈 요약\n2. [분야] 이슈 요약\n3. [분야] 이슈 요약`,
          { system: "간결하게. 실무 관점. 마크다운 없이 평문.", maxTokens: 400 },
        );
        aiSummary = res.text?.trim() ?? null;
      } catch (err) {
        logger.warn("[legal-info-daily] AI summary failed, fallback to stub", err);
      }
    }

    const lines = aiSummary
      ? ["", `📚 관심 분야: ${interests.join(", ")}`, "", "🤖 AI 요약:", aiSummary, "", "🔗 https://www.law.go.kr"]
      : [
          "",
          `📚 관심 분야: ${interests.join(", ")}`,
          "",
          "🔎 오늘 확인할 자료:",
          `  • 국가법령정보센터 최근 개정 법령 (${interests[0]} 관련)`,
          `  • 행정심판재결례 최신 공개분`,
          `  • 대법원 종합법률정보 신 판례`,
          "",
          "🔗 https://www.law.go.kr",
          "🔗 https://www.simpan.go.kr",
        ];

    await sendTelegramAlert({
      kind: "system",
      title: `📖 ETHOS 오늘의 법률정보 (${today})`,
      lines,
    });

    return NextResponse.json({ ok: true, sent: true, interests, aiUsed: Boolean(aiSummary) });
  } catch (err) {
    logger.error("[legal-info-daily] error", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
