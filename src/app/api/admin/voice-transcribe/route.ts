import { createAdminRequestContext } from "@/lib/http/admin-api";
import { transcribeAudio, isWhisperConfigured } from "@/lib/services/voice-transcription-service";
import { prisma } from "@/lib/prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const api = createAdminRequestContext("admin.voice-transcribe");

  try {
    const form = await request.formData();
    const file = form.get("audio");
    const language = String(form.get("language") ?? "ko");
    const attachToCaseId = form.get("caseId") ? String(form.get("caseId")) : null;
    const attachToInquiryId = form.get("inquiryId") ? String(form.get("inquiryId")) : null;

    if (!file || typeof file === "string") {
      return api.error(400, "audio 파일이 필요합니다.", { code: "MISSING_AUDIO" });
    }
    const blob = file as Blob;
    if (blob.size === 0) {
      return api.error(400, "빈 오디오 파일입니다.", { code: "EMPTY_AUDIO" });
    }
    if (blob.size > 25 * 1024 * 1024) {
      return api.error(413, "오디오 파일은 25MB 이하만 지원됩니다.", { code: "AUDIO_TOO_LARGE" });
    }

    const result = await transcribeAudio(blob, language);

    // Optional: 사건 이벤트 또는 문의 메모로 저장
    let attached: { kind: "case_event" | "inquiry_memo"; id: string } | null = null;
    if (result.text && attachToCaseId) {
      const event = await prisma.caseEvent
        .create({
          data: {
            caseId: attachToCaseId,
            eventType: "voice_memo",
            actorName: "관리자 (음성 메모)",
            message: result.text.slice(0, 5000),
            payloadJson: JSON.stringify({
              provider: result.provider,
              durationSec: result.durationSec,
              language,
            }),
          },
          select: { id: true },
        })
        .catch(() => null);
      if (event) attached = { kind: "case_event", id: event.id };
    } else if (result.text && attachToInquiryId) {
      const inquiry = await prisma.inquiry
        .findUnique({ where: { id: attachToInquiryId }, select: { internalMemo: true } })
        .catch(() => null);
      if (inquiry) {
        const timestamp = new Date().toISOString();
        const memoLine = `[음성 메모 ${timestamp} · ${result.provider}] ${result.text}`;
        const updated = await prisma.inquiry
          .update({
            where: { id: attachToInquiryId },
            data: {
              internalMemo: inquiry.internalMemo
                ? `${inquiry.internalMemo}\n\n${memoLine}`
                : memoLine,
            },
            select: { id: true },
          })
          .catch(() => null);
        if (updated) attached = { kind: "inquiry_memo", id: updated.id };
      }
    }

    return api.ok({
      ok: true,
      provider: result.provider,
      configured: isWhisperConfigured(),
      text: result.text,
      durationSec: result.durationSec,
      fallbackInstructions: result.fallbackInstructions,
      attached,
    });
  } catch (error) {
    api.logError(error);
    return api.error(500, "음성 전사 실패", { code: "VOICE_TRANSCRIBE_FAILED" });
  }
}
