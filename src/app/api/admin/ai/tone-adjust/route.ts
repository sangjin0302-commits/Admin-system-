/**
 * AAA4 (WW1): 메시지 톤 조정.
 *
 * POST /api/admin/ai/tone-adjust
 * Body: { text: string, tone: "friendly"|"formal"|"apology"|"reassuring" }
 * Response: { adjusted: string, model: string }
 *
 * 카톡·이메일 답변 초안 → 지정 톤으로 재작성.
 *
 * Feature flag: `message_tone_adjust`
 */

import { createAdminRequestContext } from "@/lib/http/admin-api";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { smartInvoke } from "@/lib/services/smart-ai-client";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const TONES = {
  friendly: "친근하고 따뜻하게. 존댓말 유지. 이모지 1개 정도 허용. 딱딱함 제거.",
  formal: "공식적·정중. 사무적 표현. 이모지 금지. 문어체.",
  apology: "사과 톤. 상대의 불편함 인정 우선. 재발 방지 약속 포함. 이모지 금지.",
  reassuring: "안심시키는 톤. '걱정 마시라'류 표현. 다음 단계 명확히. 이모지 금지.",
} as const;

type Tone = keyof typeof TONES;

export async function POST(req: Request) {
  const api = createAdminRequestContext("admin.ai.tone-adjust");
  if (!(await isFeatureEnabled("message_tone_adjust"))) {
    return api.error(403, "톤 조정 비활성", { code: "FEATURE_DISABLED" });
  }
  try {
    const body = (await req.json().catch(() => ({}))) as { text?: string; tone?: string };
    const text = body.text?.trim();
    const tone = body.tone as Tone | undefined;
    if (!text) return api.error(400, "text 필수", { code: "INVALID_INPUT" });
    if (!tone || !(tone in TONES)) return api.error(400, "tone 필수: friendly|formal|apology|reassuring", { code: "INVALID_TONE" });
    if (text.length > 2000) return api.error(400, "text 2000자 초과", { code: "TOO_LONG" });

    const system = `당신은 행정사 사무소의 답변 톤 조정 전문가입니다.
주어진 원문을 다음 톤으로 재작성:
${TONES[tone]}

원칙:
- 의미·정보 손실 금지.
- 길이는 원문 ±30% 이내.
- 마크다운 금지.
- 재작성 결과만 출력 (설명·라벨 금지).`;

    const res = await smartInvoke("drafting", text, { system, maxTokens: 600 });
    const adjusted = res.text?.trim() ?? "";
    if (!adjusted) return api.error(500, "빈 응답", { code: "EMPTY_RESPONSE" });

    return api.ok({ adjusted, model: res.model });
  } catch (err) {
    api.logError(err);
    return api.error(500, "톤 조정 실패", { code: "TONE_FAILED" });
  }
}
