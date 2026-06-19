export type TranscriptionSegment = { start: number; end: number; text: string };

export type TranscriptionResult = {
  text: string;
  language: string;
  durationSeconds: number;
  segments?: TranscriptionSegment[];
};

function base64ToBuffer(b64: string): Buffer {
  return Buffer.from(b64, "base64");
}

export async function transcribeAudio(
  audioBase64: string,
  mimeType: string,
  language?: string
): Promise<TranscriptionResult> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    return {
      text: "[mock transcription] Configure OPENAI_API_KEY for real Whisper transcription.",
      language: language ?? "und",
      durationSeconds: 0,
      segments: [],
    };
  }
  try {
    const buf = base64ToBuffer(audioBase64);
    const ext = mimeType.includes("webm")
      ? "webm"
      : mimeType.includes("mp3") || mimeType.includes("mpeg")
        ? "mp3"
        : mimeType.includes("wav")
          ? "wav"
          : mimeType.includes("m4a")
            ? "m4a"
            : "ogg";
    const blob = new Blob([new Uint8Array(buf)], { type: mimeType });
    const form = new FormData();
    form.append("file", blob, `audio.${ext}`);
    form.append("model", "whisper-1");
    form.append("response_format", "verbose_json");
    if (language) form.append("language", language);

    const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}` },
      body: form,
    });
    if (!res.ok) {
      return {
        text: `[Whisper error ${res.status}]`,
        language: language ?? "und",
        durationSeconds: 0,
      };
    }
    const json = (await res.json()) as {
      text?: string;
      language?: string;
      duration?: number;
      segments?: { start: number; end: number; text: string }[];
    };
    return {
      text: json.text ?? "",
      language: json.language ?? language ?? "und",
      durationSeconds: json.duration ?? 0,
      segments: json.segments?.map((s) => ({
        start: s.start,
        end: s.end,
        text: s.text,
      })),
    };
  } catch (err) {
    return {
      text: `[transcription failed: ${err instanceof Error ? err.message : "unknown"}]`,
      language: language ?? "und",
      durationSeconds: 0,
    };
  }
}

export async function summarizeTranscription(text: string): Promise<{
  summary: string;
  actionItems: string[];
  sentiment: string;
}> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (key && text.trim().length > 0) {
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": key,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-3-5-haiku-latest",
          max_tokens: 1024,
          messages: [
            {
              role: "user",
              content:
                'Summarize the following transcription. Reply ONLY with JSON in the form {"summary": string, "actionItems": string[], "sentiment": "positive"|"neutral"|"negative"}.\n\n' +
                text,
            },
          ],
        }),
      });
      if (res.ok) {
        const json = (await res.json()) as {
          content?: { type: string; text?: string }[];
        };
        const raw = json.content?.find((c) => c.type === "text")?.text ?? "";
        const match = raw.match(/\{[\s\S]*\}/);
        if (match) {
          const parsed = JSON.parse(match[0]) as {
            summary?: string;
            actionItems?: string[];
            sentiment?: string;
          };
          return {
            summary: parsed.summary ?? "",
            actionItems: parsed.actionItems ?? [],
            sentiment: parsed.sentiment ?? "neutral",
          };
        }
      }
    } catch {
      // fall through to heuristic
    }
  }

  // Heuristic fallback: first 2 sentences as summary
  const sentences = text
    .split(/(?<=[.!?。！？])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const summary = sentences.slice(0, 2).join(" ");
  const actionItems = sentences
    .filter((s) => /\b(must|should|need to|will|todo|action|해야|하겠)\b/i.test(s))
    .slice(0, 5);
  const lower = text.toLowerCase();
  let sentiment = "neutral";
  if (/(great|excellent|happy|good|좋|성공)/.test(lower)) sentiment = "positive";
  else if (/(bad|error|problem|fail|문제|실패)/.test(lower)) sentiment = "negative";
  return { summary, actionItems, sentiment };
}
