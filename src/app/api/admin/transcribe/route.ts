import { transcribeAudio, summarizeTranscription } from "@/lib/services/stt-service";
import { withJsonHandler } from "@/lib/utils/api-handler";

type TranscribeBody = {
  audioBase64?: string;
  mimeType?: string;
  language?: string;
};

export const POST = withJsonHandler<TranscribeBody>(
  async (body) => {
    const transcription = await transcribeAudio(
      body.audioBase64!,
      body.mimeType ?? "audio/webm",
      body.language
    );
    const summary = transcription.text
      ? await summarizeTranscription(transcription.text)
      : { summary: "", actionItems: [], sentiment: "neutral" };
    return {
      ...transcription,
      summary: summary.summary,
      actionItems: summary.actionItems,
      sentiment: summary.sentiment
    };
  },
  {
    logScope: "admin/transcribe",
    errorMessage: "전사 실패",
    validate: (body) => (body && body.audioBase64 ? null : "오디오 데이터 필요")
  }
);
