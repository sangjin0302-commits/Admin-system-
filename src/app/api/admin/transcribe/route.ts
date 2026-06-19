import { NextResponse } from "next/server";
import { transcribeAudio, summarizeTranscription } from "@/lib/services/stt-service";

export async function POST(request: Request) {
  try {
    const { audioBase64, mimeType, language } = await request.json();
    if (!audioBase64) {
      return NextResponse.json({ error: "오디오 데이터 필요" }, { status: 400 });
    }

    const transcription = await transcribeAudio(audioBase64, mimeType ?? "audio/webm", language);
    const summary = transcription.text
      ? await summarizeTranscription(transcription.text)
      : { summary: "", actionItems: [], sentiment: "neutral" };

    return NextResponse.json({
      ...transcription,
      summary: summary.summary,
      actionItems: summary.actionItems,
      sentiment: summary.sentiment,
    });
  } catch (err) {
    console.error("Transcribe error:", err);
    return NextResponse.json({ error: "전사 실패" }, { status: 500 });
  }
}
