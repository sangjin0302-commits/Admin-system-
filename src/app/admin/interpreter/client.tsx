"use client";

import { useEffect, useRef, useState } from "react";
import type { InterpreterTurn, Lang } from "@/lib/services/realtime-interpreter-service";

const LANG_OPTS: Array<{ code: Lang; label: string; sttLocale: string }> = [
  { code: "ko", label: "한국어", sttLocale: "ko-KR" },
  { code: "en", label: "English", sttLocale: "en-US" },
  { code: "zh", label: "中文", sttLocale: "zh-CN" },
  { code: "vi", label: "Tiếng Việt", sttLocale: "vi-VN" },
];

type SpeechRecognition = {
  start: () => void;
  stop: () => void;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  lang: string;
  continuous: boolean;
  interimResults: boolean;
};

type WindowWithSpeech = Window & {
  SpeechRecognition?: new () => SpeechRecognition;
  webkitSpeechRecognition?: new () => SpeechRecognition;
};

export function InterpreterClient() {
  const [adminLang, setAdminLang] = useState<Lang>("ko");
  const [clientLang, setClientLang] = useState<Lang>("en");
  const [caseId, setCaseId] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [turns, setTurns] = useState<InterpreterTurn[]>([]);
  const [busy, setBusy] = useState(false);
  const [manualText, setManualText] = useState("");
  const [speaker, setSpeaker] = useState<"admin" | "client">("admin");
  const [recording, setRecording] = useState(false);
  const [supportsSTT, setSupportsSTT] = useState(false);
  const recogRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const w = window as WindowWithSpeech;
    setSupportsSTT(!!(w.SpeechRecognition || w.webkitSpeechRecognition));
  }, []);

  useEffect(() => {
    if (!sessionId) return;
    const es = new EventSource(`/api/admin/interpreter/session?sessionId=${sessionId}`);
    es.addEventListener("init", (e) => {
      const s = JSON.parse((e as MessageEvent).data);
      setTurns(s.turns ?? []);
    });
    es.addEventListener("turn", (e) => {
      const t = JSON.parse((e as MessageEvent).data) as InterpreterTurn;
      setTurns((prev) => [...prev, t]);
    });
    es.addEventListener("end", () => es.close());
    return () => es.close();
  }, [sessionId]);

  async function startSession() {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/interpreter/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create", adminLang, clientLang,
          caseId: caseId || undefined,
        }),
      });
      const j = await res.json();
      if (j.ok) {
        setSessionId(j.session.id);
        setTurns([]);
      }
    } finally {
      setBusy(false);
    }
  }

  async function endSess() {
    if (!sessionId) return;
    await fetch("/api/admin/interpreter/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "end", sessionId }),
    });
    setSessionId(null);
    setTurns([]);
  }

  async function sendTurn(text: string) {
    if (!sessionId || !text.trim()) return;
    setBusy(true);
    try {
      await fetch("/api/admin/interpreter/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "turn", sessionId, speaker, text }),
      });
      setManualText("");
    } finally {
      setBusy(false);
    }
  }

  function startRecording() {
    if (typeof window === "undefined" || !sessionId) return;
    const w = window as WindowWithSpeech;
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Ctor) return;
    const rec = new Ctor();
    const lang = speaker === "admin" ? adminLang : clientLang;
    rec.lang = LANG_OPTS.find((o) => o.code === lang)?.sttLocale ?? "en-US";
    rec.continuous = false;
    rec.interimResults = false;
    rec.onresult = (e) => {
      const transcript = e.results[0]?.[0]?.transcript ?? "";
      if (transcript) void sendTurn(transcript);
    };
    rec.onend = () => setRecording(false);
    recogRef.current = rec;
    rec.start();
    setRecording(true);
  }

  function stopRecording() {
    recogRef.current?.stop();
    setRecording(false);
  }

  return (
    <div className="space-y-6">
      {!sessionId && (
        <div className="grid grid-cols-1 gap-3 rounded-lg border border-line p-4 md:grid-cols-3">
          <label className="text-xs">
            관리자 언어
            <select value={adminLang} onChange={(e) => setAdminLang(e.target.value as Lang)}
              className="mt-1 h-10 w-full rounded border border-line px-3 text-sm">
              {LANG_OPTS.map((o) => <option key={o.code} value={o.code}>{o.label}</option>)}
            </select>
          </label>
          <label className="text-xs">
            고객 언어
            <select value={clientLang} onChange={(e) => setClientLang(e.target.value as Lang)}
              className="mt-1 h-10 w-full rounded border border-line px-3 text-sm">
              {LANG_OPTS.map((o) => <option key={o.code} value={o.code}>{o.label}</option>)}
            </select>
          </label>
          <label className="text-xs">
            사건 ID (선택)
            <input value={caseId} onChange={(e) => setCaseId(e.target.value)}
              className="mt-1 h-10 w-full rounded border border-line px-3 text-sm" />
          </label>
          <button type="button" onClick={startSession} disabled={busy || adminLang === clientLang}
            className="rounded bg-primary px-4 py-2 text-sm font-bold text-white md:col-span-3">
            세션 시작
          </button>
        </div>
      )}

      {sessionId && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-primary p-3">
            <span className="text-xs">
              세션 <code className="font-mono">{sessionId}</code> · {LANG_OPTS.find((o) => o.code === adminLang)?.label} ↔ {LANG_OPTS.find((o) => o.code === clientLang)?.label}
            </span>
            <button type="button" onClick={endSess} className="rounded border border-line px-3 py-1 text-xs">
              세션 종료
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-line p-3">
            <div className="flex gap-2">
              <button type="button" onClick={() => setSpeaker("admin")}
                className={`rounded px-3 py-1.5 text-xs font-bold ${speaker === "admin" ? "bg-primary text-white" : "border border-line"}`}>
                관리자 발화
              </button>
              <button type="button" onClick={() => setSpeaker("client")}
                className={`rounded px-3 py-1.5 text-xs font-bold ${speaker === "client" ? "bg-primary text-white" : "border border-line"}`}>
                고객 발화
              </button>
            </div>
            {supportsSTT && (
              <button type="button"
                onClick={recording ? stopRecording : startRecording}
                className={`rounded-full px-4 py-2 text-sm font-bold ${recording ? "bg-red-600 text-white" : "bg-primary text-white"}`}>
                {recording ? "● 녹음 중지" : "🎤 녹음 시작"}
              </button>
            )}
            <input value={manualText} onChange={(e) => setManualText(e.target.value)}
              placeholder="또는 텍스트로 입력"
              className="h-10 flex-1 min-w-[200px] rounded border border-line px-3 text-sm"
              onKeyDown={(e) => { if (e.key === "Enter") void sendTurn(manualText); }} />
            <button type="button" onClick={() => sendTurn(manualText)} disabled={busy || !manualText.trim()}
              className="rounded bg-primary px-4 py-2 text-sm text-white disabled:opacity-50">
              전송
            </button>
          </div>

          <div className="space-y-2">
            {turns.map((t) => (
              <div key={t.id} className={`rounded-lg border p-3 ${t.speaker === "admin" ? "border-blue-300 bg-blue-50" : "border-green-300 bg-green-50"}`}>
                <p className="text-xs text-text-muted">
                  {t.speaker === "admin" ? "관리자" : "고객"} · {t.sourceLang} → {t.targetLang} · {new Date(t.createdAt).toLocaleTimeString()}
                </p>
                <div className="mt-1 grid grid-cols-1 gap-2 md:grid-cols-2">
                  <p className="text-sm">{t.sourceText}</p>
                  <p className="text-sm font-semibold">{t.translatedText}</p>
                </div>
              </div>
            ))}
            {turns.length === 0 && <p className="py-6 text-center text-sm text-text-muted">첫 발화를 시작하세요.</p>}
          </div>
        </>
      )}
    </div>
  );
}
