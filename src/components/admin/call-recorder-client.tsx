"use client";

import { useEffect, useRef, useState } from "react";

import { Card } from "@/components/ui/card";

type LiveCallLanguage = "ko" | "en";

interface LiveCallSummary {
  summary: string;
  actionItems: string[];
  suggestedCategory: string;
  estimatedQuoteRangeKrw: { min: number; max: number };
  provider: "claude-haiku" | "fallback";
}

interface LiveCallSession {
  id: string;
  language: LiveCallLanguage;
  startedAt: string;
  endedAt: string | null;
  transcript: string;
  summary?: LiveCallSummary;
}

// Web Speech API 최소 타입 정의 (브라우저 전역 미표준)
type SpeechRecognitionResultLike = {
  isFinal: boolean;
  0: { transcript: string };
};
type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: {
    length: number;
    [i: number]: SpeechRecognitionResultLike;
  };
};
interface RecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onerror: ((e: unknown) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

function pickRecognitionCtor(): (new () => RecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => RecognitionLike;
    webkitSpeechRecognition?: new () => RecognitionLike;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function CallRecorderClient() {
  const [language, setLanguage] = useState<LiveCallLanguage>("ko");
  const [session, setSession] = useState<LiveCallSession | null>(null);
  const [interim, setInterim] = useState("");
  const [recording, setRecording] = useState(false);
  // onend 콜백은 start() 실행 시점의 recording 값을 붙잡는다. 그 시점엔 아직
  // false 라(setRecording(true) 는 뒤에 실행) 재시작 분기가 영영 죽어 있었고,
  // Web Speech 가 몇 초 침묵 후 자동 종료하면 통화 나머지가 통째로 유실됐다.
  // 최신 값을 읽기 위해 ref 를 함께 둔다.
  const recordingRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [savedInquiryId, setSavedInquiryId] = useState<string | null>(null);

  const recognitionRef = useRef<RecognitionLike | null>(null);
  const flushTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pendingRef = useRef<string[]>([]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
      if (flushTimerRef.current) clearInterval(flushTimerRef.current);
    };
  }, []);

  const flushPending = async (sessionId: string) => {
    if (pendingRef.current.length === 0) return;
    const text = pendingRef.current.join(" ");
    pendingRef.current = [];
    try {
      await fetch("/api/admin/live-transcription/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "chunk", sessionId, text })
      });
    } catch {
      // silently swallow; will retry on next flush
    }
  };

  const start = async () => {
    setError(null);
    setSavedInquiryId(null);
    setBusy(true);
    try {
      const res = await fetch("/api/admin/live-transcription/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start", language })
      });
      const data = (await res.json()) as { ok?: boolean; session?: LiveCallSession; error?: string; message?: string };
      if (!data.ok || !data.session) throw new Error(data.error ?? data.message ?? "세션 시작 실패");
      setSession(data.session);

      const Ctor = pickRecognitionCtor();
      if (!Ctor) {
        setError("이 브라우저는 Web Speech API를 지원하지 않습니다. Chrome 등에서 시도해 주세요.");
        recordingRef.current = false;
        setRecording(false);
        setBusy(false);
        return;
      }
      const rec = new Ctor();
      rec.lang = language === "ko" ? "ko-KR" : "en-US";
      rec.continuous = true;
      rec.interimResults = true;
      rec.onresult = (event) => {
        let finalText = "";
        let interimText = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const r = event.results[i];
          if (r.isFinal) finalText += r[0].transcript;
          else interimText += r[0].transcript;
        }
        if (finalText.trim()) {
          pendingRef.current.push(finalText.trim());
          setSession((prev) =>
            prev ? { ...prev, transcript: prev.transcript ? `${prev.transcript}\n${finalText.trim()}` : finalText.trim() } : prev
          );
        }
        setInterim(interimText);
      };
      rec.onerror = (e) => {
        // eslint-disable-next-line no-console
        console.warn("[speech]", e);
      };
      rec.onend = () => {
        // if still recording, restart (Web Speech tends to stop after silence)
        if (recognitionRef.current === rec && recordingRef.current) {
          try {
            rec.start();
          } catch {
            // ignore restart failures
          }
        }
      };
      recognitionRef.current = rec;
      rec.start();
      recordingRef.current = true;
      setRecording(true);

      // Periodic server flush
      const sessionId = data.session.id;
      flushTimerRef.current = setInterval(() => {
        void flushPending(sessionId);
      }, 4000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "세션 시작 실패");
    } finally {
      setBusy(false);
    }
  };

  const stop = async () => {
    if (!session) return;
    setBusy(true);
    recordingRef.current = false;
    setRecording(false);
    try {
      recognitionRef.current?.stop();
      recognitionRef.current = null;
      if (flushTimerRef.current) {
        clearInterval(flushTimerRef.current);
        flushTimerRef.current = null;
      }
      await flushPending(session.id);
      const res = await fetch("/api/admin/live-transcription/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "end", sessionId: session.id })
      });
      const data = (await res.json()) as { ok?: boolean; session?: LiveCallSession; error?: string; message?: string };
      if (!data.ok || !data.session) throw new Error(data.error ?? data.message ?? "세션 종료 실패");
      setSession(data.session);
      setInterim("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "세션 종료 실패");
    } finally {
      setBusy(false);
    }
  };

  const saveAsInquiry = async () => {
    if (!session) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/live-transcription/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "toInquiry",
          sessionId: session.id,
          contactName,
          email,
          phone: phone || undefined
        })
      });
      const data = (await res.json()) as { ok?: boolean; inquiryId?: string; error?: string; message?: string };
      if (!data.ok || !data.inquiryId) throw new Error(data.error ?? data.message ?? "의뢰 저장 실패");
      setSavedInquiryId(data.inquiryId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "의뢰 저장 실패");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-xs font-medium">
            언어:{" "}
            <select
              className="ml-1 rounded-md border border-border/60 p-1 text-xs"
              value={language}
              onChange={(e) => setLanguage(e.target.value as LiveCallLanguage)}
              disabled={recording}
            >
              <option value="ko">한국어 (KO)</option>
              <option value="en">English (EN)</option>
            </select>
          </label>

          {!recording ? (
            <button
              type="button"
              onClick={start}
              disabled={busy}
              className="rounded-full bg-red-600 px-5 py-2 text-sm font-bold text-white shadow disabled:opacity-60"
            >
              ● REC (녹음 시작)
            </button>
          ) : (
            <button
              type="button"
              onClick={stop}
              disabled={busy}
              className="rounded-full bg-black px-5 py-2 text-sm font-bold text-white disabled:opacity-60"
            >
              ■ 정지 및 요약
            </button>
          )}

          {session && (
            <span className="text-xs text-text-muted">
              세션 ID: {session.id} · {recording ? "녹음 중" : session.endedAt ? "종료됨" : "대기"}
            </span>
          )}
        </div>

        {error && <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}
      </Card>

      <Card className="p-5">
        <p className="ui-kicker">실시간 전사</p>
        <div className="mt-2 h-56 overflow-y-auto rounded-md border border-border/60 bg-white/40 p-3 text-sm">
          <pre className="whitespace-pre-wrap font-sans">{session?.transcript ?? ""}</pre>
          {interim && <p className="mt-2 italic text-text-muted">{interim}</p>}
        </div>
      </Card>

      {session?.summary && (
        <Card className="p-5">
          <p className="ui-kicker">AI 요약 결과 ({session.summary.provider === "claude-haiku" ? "Claude Haiku" : "폴백"})</p>
          <p className="mt-2 whitespace-pre-wrap text-sm">{session.summary.summary}</p>

          {session.summary.actionItems.length > 0 && (
            <div className="mt-3">
              <p className="text-xs font-semibold">액션 아이템</p>
              <ul className="mt-1 list-disc pl-5 text-sm">
                {session.summary.actionItems.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </div>
          )}

          <p className="mt-3 text-xs text-text-muted">
            추정 카테고리: <span className="font-medium">{session.summary.suggestedCategory}</span> · 견적 범위:{" "}
            <span className="font-medium">
              {session.summary.estimatedQuoteRangeKrw.min.toLocaleString()} ~ {session.summary.estimatedQuoteRangeKrw.max.toLocaleString()} 원
            </span>
          </p>

          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            <input
              className="rounded-md border border-border/60 p-2 text-sm"
              placeholder="고객명"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
            />
            <input
              className="rounded-md border border-border/60 p-2 text-sm"
              placeholder="이메일"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              className="rounded-md border border-border/60 p-2 text-sm"
              placeholder="전화 (선택)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <button
            type="button"
            className="mt-3 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
            onClick={saveAsInquiry}
            disabled={busy || !contactName || !email}
          >
            {busy ? "저장 중…" : "새 의뢰로 저장"}
          </button>
          {savedInquiryId && (
            <p className="mt-2 text-xs text-emerald-700">
              저장됨 —{" "}
              <a className="underline" href={`/admin/inquiries/${savedInquiryId}`}>
                의뢰 상세 열기
              </a>
            </p>
          )}
        </Card>
      )}
    </div>
  );
}
