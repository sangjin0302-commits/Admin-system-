"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type DocumentType = "의견서" | "청구서" | "이의신청서";

type SRInstance = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((e: { resultIndex: number; results: ArrayLike<ArrayLike<{ transcript: string; isFinal: boolean }>> }) => void) | null;
  onerror: ((e: unknown) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type SRConstructor = new () => SRInstance;

export function DictationClient() {
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [documentType, setDocumentType] = useState<DocumentType>("의견서");
  const [formalized, setFormalized] = useState("");
  const [loading, setLoading] = useState(false);
  const recognitionRef = useRef<SRInstance | null>(null);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  function start() {
    const w = window as unknown as {
      SpeechRecognition?: SRConstructor;
      webkitSpeechRecognition?: SRConstructor;
    };
    const SR = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!SR) {
      alert("이 브라우저는 Web Speech API를 지원하지 않습니다.");
      return;
    }
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "ko-KR";
    rec.onresult = (e) => {
      let finalText = "";
      for (let i = e.resultIndex; i < e.results.length; i += 1) {
        const alt = e.results[i][0];
        if (alt && e.results[i] && (e.results[i] as unknown as { isFinal: boolean }).isFinal) {
          finalText += alt.transcript;
        }
      }
      if (finalText) setTranscript((prev) => prev + finalText);
    };
    rec.onerror = () => setRecording(false);
    rec.onend = () => setRecording(false);
    rec.start();
    recognitionRef.current = rec;
    setRecording(true);
  }

  function stop() {
    recognitionRef.current?.stop();
    setRecording(false);
  }

  async function formalize() {
    if (!transcript.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/document-dictation/formalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript, documentType })
      });
      const data = await res.json();
      setFormalized(data.text ?? "");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card className="p-6 space-y-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={recording ? stop : start}
            className={`h-16 w-16 rounded-full text-white ${recording ? "bg-red-600 animate-pulse" : "bg-primary"}`}
          >
            {recording ? "■" : "REC"}
          </button>
          <select
            value={documentType}
            onChange={(e) => setDocumentType(e.target.value as DocumentType)}
            className="rounded border border-line px-2 py-1 text-sm"
          >
            <option value="의견서">의견서</option>
            <option value="청구서">청구서</option>
            <option value="이의신청서">이의신청서</option>
          </select>
        </div>
        <textarea
          className="w-full min-h-[160px] rounded border border-line p-2 text-sm"
          placeholder="말한 내용이 여기에 표시됩니다..."
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
        />
        <Button onClick={formalize} disabled={loading || !transcript.trim()}>
          정형화
        </Button>
      </Card>

      {formalized && (
        <Card className="p-6">
          <h3 className="text-base font-semibold">정형화 결과</h3>
          <pre className="mt-2 whitespace-pre-wrap rounded bg-surface-muted p-3 text-sm">{formalized}</pre>
        </Card>
      )}
    </div>
  );
}
