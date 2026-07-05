"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type RecogState = "idle" | "listening" | "parsing" | "error";

type ParsedResult = {
  ok: boolean;
  action?:
    | { kind: "navigate"; path: string; label: string }
    | { kind: "search"; query: string; scope: "case" | "inquiry"; label: string }
    | { kind: "unknown"; reason: string };
  confidence?: number;
  source?: string;
};

type BrowserRecognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((ev: unknown) => void) | null;
  onerror: ((ev: unknown) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

type SpeechRecognitionCtor = new () => BrowserRecognition;

function getRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function VoiceCommandMic() {
  const router = useRouter();
  const [state, setState] = useState<RecogState>("idle");
  const [transcript, setTranscript] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const recogRef = useRef<BrowserRecognition | null>(null);
  const [supported, setSupported] = useState<boolean>(true);

  useEffect(() => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      setSupported(false);
      return;
    }
  }, []);

  const startListening = () => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      setSupported(false);
      setMessage("이 브라우저는 음성 인식을 지원하지 않습니다.");
      return;
    }
    setTranscript("");
    setMessage("");
    setState("listening");

    const recog = new Ctor();
    recog.lang = "ko-KR";
    recog.continuous = false;
    recog.interimResults = false;
    recog.onresult = (ev: unknown) => {
      const results = (ev as { results?: ArrayLike<ArrayLike<{ transcript?: string }>> }).results;
      if (!results || results.length === 0) return;
      const first = results[0];
      const text = first?.[0]?.transcript ?? "";
      setTranscript(text);
      if (text) void submit(text);
    };
    recog.onerror = (ev: unknown) => {
      const errMsg = (ev as { error?: string }).error ?? "recognition_error";
      setMessage(`인식 오류: ${errMsg}`);
      setState("error");
    };
    recog.onend = () => {
      setState((s) => (s === "listening" ? "idle" : s));
    };
    recogRef.current = recog;
    try {
      recog.start();
    } catch (err) {
      setMessage(`시작 실패: ${err instanceof Error ? err.message : String(err)}`);
      setState("error");
    }
  };

  const stopListening = () => {
    try {
      recogRef.current?.stop();
    } catch {
      /* ignore */
    }
    setState("idle");
  };

  const submit = async (text: string) => {
    setState("parsing");
    try {
      const res = await fetch("/api/admin/voice-command/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: text }),
      });
      const data = (await res.json()) as ParsedResult;
      if (!res.ok || !data.ok || !data.action) {
        setMessage("명령을 이해하지 못했습니다.");
        setState("error");
        return;
      }
      const a = data.action;
      if (a.kind === "navigate") {
        setMessage(`이동: ${a.label}`);
        router.push(a.path);
        setState("idle");
      } else if (a.kind === "search") {
        setMessage(`검색: ${a.label}`);
        const base = a.scope === "case" ? "/admin/cases" : "/admin/inquiries";
        router.push(`${base}?q=${encodeURIComponent(a.query)}`);
        setState("idle");
      } else {
        setMessage(a.reason ?? "인식된 명령이 없습니다.");
        setState("error");
      }
    } catch (err) {
      setMessage(`요청 실패: ${err instanceof Error ? err.message : String(err)}`);
      setState("error");
    }
  };

  if (!supported) {
    return null;
  }

  const listening = state === "listening";
  const busy = state === "parsing";

  return (
    <div className="fixed bottom-24 right-6 z-40 flex flex-col items-end gap-2 lg:bottom-6">
      {(transcript || message) && (
        <div className="max-w-xs rounded-lg border border-line bg-surface p-3 text-xs shadow-panel">
          {transcript && (
            <p className="text-text-strong">
              <span className="font-semibold">듣기: </span>“{transcript}”
            </p>
          )}
          {message && <p className="mt-1 text-text-muted">{message}</p>}
        </div>
      )}
      <button
        type="button"
        aria-label={listening ? "음성 인식 중지" : "음성 명령 시작"}
        onClick={listening ? stopListening : startListening}
        disabled={busy}
        className={
          "flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg transition disabled:opacity-60 " +
          (listening
            ? "animate-pulse bg-rose-600"
            : busy
              ? "bg-slate-500"
              : "bg-indigo-600 hover:bg-indigo-700")
        }
      >
        {listening ? (
          <span className="text-xs font-semibold">듣는 중...</span>
        ) : busy ? (
          <span className="text-xs font-semibold">분석</span>
        ) : (
          <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" aria-hidden>
            <path d="M12 15a3 3 0 003-3V6a3 3 0 10-6 0v6a3 3 0 003 3zm5-3a5 5 0 01-10 0H5a7 7 0 006 6.92V22h2v-3.08A7 7 0 0019 12h-2z" />
          </svg>
        )}
      </button>
    </div>
  );
}
