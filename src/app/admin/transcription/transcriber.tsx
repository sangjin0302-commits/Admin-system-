"use client";

import { useState, useRef } from "react";
import toast from "react-hot-toast";

type Result = {
  text: string;
  language: string;
  durationSeconds: number;
  summary?: string;
  actionItems?: string[];
  sentiment?: string;
};

export function Transcriber() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [recording, setRecording] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const handleFile = async (file: File) => {
    setLoading(true);
    setResult(null);
    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((res, rej) => {
        reader.onload = () => res((reader.result as string).split(",")[1]);
        reader.onerror = rej;
        reader.readAsDataURL(file);
      });

      const r = await fetch("/api/admin/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audioBase64: base64, mimeType: file.type }),
      });
      const data = await r.json();
      if (!r.ok) {
        toast.error(data.error ?? "전사 실패");
        return;
      }
      setResult(data);
      toast.success("전사 완료");
    } catch {
      toast.error("처리 오류");
    } finally {
      setLoading(false);
    }
  };

  const startRec = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => chunksRef.current.push(e.data);
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        handleFile(new File([blob], "recording.webm", { type: "audio/webm" }));
        stream.getTracks().forEach((t) => t.stop());
      };
      mr.start();
      mediaRef.current = mr;
      setRecording(true);
    } catch {
      toast.error("마이크 접근 불가");
    }
  };

  const stopRec = () => {
    mediaRef.current?.stop();
    setRecording(false);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-line bg-surface p-5 shadow-panel">
        <div className="flex flex-wrap gap-3">
          <label className="cursor-pointer rounded-lg border border-dashed border-line-strong px-4 py-2.5 text-sm hover:border-primary">
            오디오 파일 선택
            <input
              ref={fileRef}
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              disabled={loading}
            />
          </label>
          {!recording ? (
            <button
              onClick={startRec}
              disabled={loading}
              className="rounded-lg bg-danger px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              ● 녹음 시작
            </button>
          ) : (
            <button
              onClick={stopRec}
              className="rounded-lg bg-text-strong px-5 py-2.5 text-sm font-semibold text-white"
            >
              ■ 녹음 중지
            </button>
          )}
          {loading && <span className="self-center text-sm text-text-muted">처리 중...</span>}
        </div>
      </div>

      {result && (
        <div className="rounded-xl border border-line bg-surface p-5 shadow-panel">
          <div className="mb-3 flex items-center gap-3 text-xs text-text-muted">
            <span>언어: {result.language}</span>
            <span>길이: {result.durationSeconds}초</span>
            {result.sentiment && <span>감정: {result.sentiment}</span>}
          </div>
          <h3 className="text-sm font-semibold text-text-strong">전사 결과</h3>
          <p className="mt-2 whitespace-pre-wrap text-sm text-text-strong">{result.text}</p>

          {result.summary && (
            <>
              <h3 className="mt-4 text-sm font-semibold text-text-strong">요약</h3>
              <p className="mt-1 text-sm text-text-muted">{result.summary}</p>
            </>
          )}
          {result.actionItems && result.actionItems.length > 0 && (
            <>
              <h3 className="mt-4 text-sm font-semibold text-text-strong">액션 아이템</h3>
              <ul className="mt-1 list-disc pl-5 text-sm text-text-muted">
                {result.actionItems.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  );
}
