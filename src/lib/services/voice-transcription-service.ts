/**
 * Voice → Text (Whisper) transcription service.
 *
 * 서버측 OpenAI Whisper API 사용. OPENAI_API_KEY 미설정 시 graceful 처리:
 *   - `available()` returns false
 *   - `transcribeAudio()` returns instructions to use browser Web Speech API
 *
 * Whisper docs: https://platform.openai.com/docs/api-reference/audio/createTranscription
 */

import { logger } from "@/lib/utils/logger";

export interface TranscriptionResult {
  text: string;
  durationSec: number;
  provider: "whisper" | "fallback";
  fallbackInstructions?: string;
}

const WHISPER_URL = "https://api.openai.com/v1/audio/transcriptions";
const DEFAULT_MODEL = "whisper-1";

export function isWhisperConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

function fallbackResult(): TranscriptionResult {
  return {
    text: "",
    durationSec: 0,
    provider: "fallback",
    fallbackInstructions:
      "서버측 Whisper 미설정(OPENAI_API_KEY). 브라우저 Web Speech API(SpeechRecognition)를 사용해 클라이언트에서 전사한 후 텍스트를 저장하세요.",
  };
}

export async function transcribeAudio(
  audio: Blob | Buffer,
  language: string = "ko"
): Promise<TranscriptionResult> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    logger.info("[voice-transcription] Whisper not configured; returning fallback instructions");
    return fallbackResult();
  }

  const form = new FormData();
  let blob: Blob;
  if (audio instanceof Blob) {
    blob = audio;
  } else {
    // Buffer → Blob (Node 18+)
    blob = new Blob([new Uint8Array(audio)], { type: "audio/webm" });
  }
  form.append("file", blob, "audio.webm");
  form.append("model", DEFAULT_MODEL);
  form.append("language", language);
  form.append("response_format", "verbose_json");

  const startedAt = Date.now();
  try {
    const res = await fetch(WHISPER_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      logger.warn("[voice-transcription] whisper failed", res.status, body.slice(0, 200));
      return {
        text: "",
        durationSec: (Date.now() - startedAt) / 1000,
        provider: "whisper",
      };
    }
    const data = (await res.json()) as { text?: string; duration?: number };
    return {
      text: (data.text ?? "").trim(),
      durationSec: typeof data.duration === "number" ? data.duration : (Date.now() - startedAt) / 1000,
      provider: "whisper",
    };
  } catch (err) {
    logger.warn("[voice-transcription] exception", err);
    return {
      text: "",
      durationSec: (Date.now() - startedAt) / 1000,
      provider: "whisper",
    };
  }
}
