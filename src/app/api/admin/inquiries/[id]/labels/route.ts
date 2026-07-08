/**
 * AAA1 (WW2): 문의 자동 라벨링.
 *
 * POST /api/admin/inquiries/{id}/labels
 * Response: { labels: string[], primary: string, model: string }
 *
 * Claude Haiku가 4개 라벨 중 매치되는 것 반환.
 * 라벨: 요구(demand) / 공포(fear) / 불만(complaint) / 문의(inquiry)
 *
 * Feature flag: `inquiry_auto_labeling`
 */

import { prisma } from "@/lib/prisma/client";
import { createAdminRequestContext } from "@/lib/http/admin-api";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { smartInvoke } from "@/lib/services/smart-ai-client";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const LABELS = ["요구", "공포", "불만", "문의"] as const;
type Label = (typeof LABELS)[number];

const SYSTEM = `당신은 행정사 사무소 문의 분류기입니다. 문의를 다음 4개 라벨로 분류합니다:

- 요구: 특정 결과·서비스 요청 (예: "허가 취소 도와주세요", "심판 청구")
- 공포: 처벌·손실 우려 (예: "벌금 나올까요?", "취업 못할까요?")
- 불만: 기존 행정 결과·기관 불만 (예: "부당한 처분", "인정 안 됨")
- 문의: 정보 확인·상담 요청 (예: "가능한가요?", "얼마인가요?")

응답 형식 (JSON만, 다른 텍스트 금지):
{"labels":["<라벨1>","<라벨2>?"],"primary":"<가장 강한 라벨>"}

- labels: 매치 라벨 배열 (1~2개). 강도 높은 순.
- primary: 가장 강한 라벨 1개.
- 반드시 위 4개 라벨 문자열 정확히 사용.`;

function parseResponse(text: string): { labels: Label[]; primary: Label } | null {
  try {
    const cleaned = text.replace(/```json\s*|\s*```/g, "").trim();
    const parsed = JSON.parse(cleaned) as { labels?: string[]; primary?: string };
    const labels = (parsed.labels ?? []).filter((l): l is Label =>
      (LABELS as readonly string[]).includes(l),
    );
    const primary = (LABELS as readonly string[]).includes(parsed.primary ?? "")
      ? (parsed.primary as Label)
      : labels[0];
    if (!primary) return null;
    return { labels: labels.length > 0 ? labels : [primary], primary };
  } catch {
    return null;
  }
}

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const api = createAdminRequestContext("admin.inquiry.labels");
  if (!(await isFeatureEnabled("inquiry_auto_labeling"))) {
    return api.error(403, "자동 라벨링 비활성", { code: "FEATURE_DISABLED" });
  }
  try {
    const { id } = await ctx.params;
    const inquiry = await prisma.inquiry.findUnique({
      where: { id },
      select: { title: true, description: true, urgencyLevel: true },
    });
    if (!inquiry) return api.error(404, "문의 없음", { code: "NOT_FOUND" });

    const prompt = `[제목] ${inquiry.title}
[내용]
${inquiry.description}

위 문의를 분류하세요.`;

    const res = await smartInvoke("simple_classify", prompt, {
      system: SYSTEM,
      maxTokens: 150,
    });
    const parsed = parseResponse(res.text ?? "");
    if (!parsed) return api.error(500, "분류 파싱 실패", { code: "PARSE_FAILED" });

    return api.ok({ labels: parsed.labels, primary: parsed.primary, model: res.model });
  } catch (err) {
    api.logError(err);
    return api.error(500, "라벨링 실패", { code: "LABEL_FAILED" });
  }
}
