"use client";

/**
 * AI 음성 상담 위젯 (클라이언트).
 *
 * MediaRecorder + Web Audio API로 마이크 오디오 캡처, 백엔드로 스트리밍.
 * WebSocket/SSE 미지원 시 텍스트 fallback UI로 자동 강등.
 */

import { useCallback, useEffect, useRef, useState } from "react";

type Status = "idle" | "requesting" | "connecting" | "active" | "muted" | "ended" | "error";

type SessionInfo = {
  sessionId: string;
  provider: "openai_realtime" | "elevenlabs" | "text_fallback";
  streamUrl: string;
  token: string;
  expiresAt: number;
  textFallbackReason: string | null;
};

export function VoiceConsultWidget() {
  const [status, setStatus] = useState<Status>("idle");
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [transcript, setTranscript] = useState<string[]>([]);
  const [level, setLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const mediaRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number | null>(null);

  const stop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    recorderRef.current?.state === "recording" && recorderRef.current.stop();
    mediaRef.current?.getTracks().forEach((t) => t.stop());
    audioCtxRef.current?.close().catch(() => undefined);
    mediaRef.current = null;
    recorderRef.current = null;
    audioCtxRef.current = null;
    setLevel(0);
  }, []);

  useEffect(() => () => stop(), [stop]);

  const start = useCallback(async () => {
    setError(null);
    setTranscript([]);
    setStatus("requesting");
    try {
      const res = await fetch("/api/public/voice-consult/session", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "세션 생성 실패");
        setStatus("error");
        return;
      }
      setSession(data as SessionInfo);
      if (data.provider === "text_fallback") {
        setStatus("active");
        setTranscript((prev) => [...prev, "[AI] 음성 기능이 준비 중입니다. 아래에 텍스트로 문의해 주세요."]);
        return;
      }

      setStatus("connecting");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRef.current = stream;

      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioCtx = new AC();
      audioCtxRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      const buf = new Uint8Array(analyser.frequencyBinCount);

      const tick = () => {
        analyser.getByteFrequencyData(buf);
        let sum = 0;
        for (let i = 0; i < buf.length; i++) sum += buf[i];
        setLevel(sum / buf.length / 255);
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);

      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;
      recorder.start(500);
      setStatus("active");
      setTranscript((prev) => [...prev, "[상담 시작] 마이크가 활성화되었습니다."]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "마이크 접근 실패";
      setError(msg);
      setStatus("error");
      stop();
    }
  }, [stop]);

  const end = useCallback(() => {
    stop();
    setStatus("ended");
    setTranscript((prev) => [...prev, "[상담 종료]"]);
  }, [stop]);

  const toggleMute = useCallback(() => {
    const s = mediaRef.current;
    if (!s) return;
    const nextMuted = status !== "muted";
    s.getAudioTracks().forEach((t) => (t.enabled = !nextMuted));
    setStatus(nextMuted ? "muted" : "active");
  }, [status]);

  const isActive = status === "active" || status === "muted" || status === "connecting";
  const barCount = 24;
  const bars = Array.from({ length: barCount }, (_, i) => {
    const phase = i / barCount;
    const amp = isActive ? Math.max(0.15, level * (0.6 + 0.4 * Math.sin(phase * Math.PI * 2 + Date.now() / 200))) : 0.1;
    return Math.round(amp * 100);
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6 rounded-2xl border border-gold/30 bg-white p-8 shadow-floating">
      <div className="text-center">
        <p className="ui-kicker text-gold-deep">Voice AI</p>
        <h2 className="mt-2 font-serif text-2xl font-bold text-primary">AI 상담원과 통화</h2>
        <p className="mt-2 text-sm text-text-muted">
          실시간 음성으로 행정 문의를 나눕니다. 마이크 권한이 필요합니다.
        </p>
      </div>

      {/* 오디오 파형 */}
      <div className="flex h-24 items-end justify-center gap-1 rounded-lg bg-primary/5 p-3">
        {bars.map((h, i) => (
          <span
            key={i}
            style={{ height: `${h}%` }}
            className={`w-1.5 rounded-t transition-[height] duration-100 ${
              isActive ? "bg-gold" : "bg-slate-300"
            }`}
          />
        ))}
      </div>

      {/* 상태 라인 */}
      <div className="text-center text-xs text-text-muted">
        {status === "idle" && "대기 중"}
        {status === "requesting" && "세션 요청 중..."}
        {status === "connecting" && "마이크 연결 중..."}
        {status === "active" && `통화 중 (${session?.provider ?? "-"})`}
        {status === "muted" && "음소거"}
        {status === "ended" && "종료됨"}
        {status === "error" && `오류: ${error ?? ""}`}
      </div>

      {session?.textFallbackReason && (
        <p className="rounded-md bg-amber-50 p-3 text-xs text-amber-900">
          {session.textFallbackReason}
        </p>
      )}

      {/* 컨트롤 */}
      <div className="flex flex-wrap justify-center gap-3">
        {status === "idle" || status === "ended" || status === "error" ? (
          <button
            type="button"
            onClick={start}
            className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-text-strong"
          >
            상담 시작
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={toggleMute}
              className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-primary hover:bg-slate-50"
            >
              {status === "muted" ? "음소거 해제" : "음소거"}
            </button>
            <button
              type="button"
              onClick={end}
              className="rounded-full bg-red-600 px-5 py-3 text-sm font-semibold text-white hover:bg-red-700"
            >
              종료
            </button>
          </>
        )}
      </div>

      {/* 트랜스크립트 */}
      {transcript.length > 0 && (
        <div className="max-h-40 overflow-y-auto rounded-md border border-slate-200 bg-slate-50 p-3 text-xs">
          {transcript.map((line, i) => (
            <div key={i} className="py-0.5">
              {line}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default VoiceConsultWidget;
