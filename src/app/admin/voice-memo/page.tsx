"use client";

import { useEffect, useRef, useState } from "react";

type Provider = "whisper" | "fallback";

interface TranscribeResponse {
  ok: boolean;
  provider?: Provider;
  configured?: boolean;
  text?: string;
  durationSec?: number;
  fallbackInstructions?: string;
  attached?: { kind: "case_event" | "inquiry_memo"; id: string } | null;
  error?: string;
}

type AttachTarget = "none" | "case" | "inquiry";

export default function VoiceMemoPage() {
  const [recording, setRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [transcript, setTranscript] = useState("");
  const [status, setStatus] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [target, setTarget] = useState<AttachTarget>("none");
  const [targetId, setTargetId] = useState("");
  const [language, setLanguage] = useState("ko");
  const [provider, setProvider] = useState<Provider | null>(null);
  const [browserFallback, setBrowserFallback] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const blobRef = useRef<Blob | null>(null);

  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  async function startRecording() {
    setStatus("");
    setTranscript("");
    setProvider(null);
    setBrowserFallback(null);
    chunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        blobRef.current = blob;
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        stream.getTracks().forEach((t) => t.stop());
      };
      mr.start();
      recorderRef.current = mr;
      setRecording(true);
    } catch (err) {
      setStatus(`마이크 접근 실패: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  function stopRecording() {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
    setRecording(false);
  }

  async function transcribe() {
    if (!blobRef.current) {
      setStatus("녹음된 오디오가 없습니다.");
      return;
    }
    setBusy(true);
    setStatus("전사 중...");
    try {
      const form = new FormData();
      form.append("audio", blobRef.current, "memo.webm");
      form.append("language", language);
      if (target !== "none" && targetId.trim()) {
        form.append(target === "case" ? "caseId" : "inquiryId", targetId.trim());
      }
      const res = await fetch("/api/admin/voice-transcribe", {
        method: "POST",
        body: form,
      });
      const data = (await res.json()) as TranscribeResponse;
      if (!res.ok || !data.ok) {
        setStatus(`전사 실패: ${data.error ?? res.status}`);
      } else {
        setTranscript(data.text ?? "");
        setProvider(data.provider ?? null);
        if (data.provider === "fallback" && data.fallbackInstructions) {
          setBrowserFallback(data.fallbackInstructions);
        }
        const attachMsg = data.attached
          ? ` · ${data.attached.kind === "case_event" ? "사건 로그" : "문의 메모"} 저장됨 (${data.attached.id})`
          : "";
        setStatus(`완료 (${data.durationSec?.toFixed(1) ?? "?"}s, ${data.provider})${attachMsg}`);
      }
    } catch (err) {
      setStatus(`오류: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setBusy(false);
    }
  }

  async function tryBrowserSpeech() {
    // Web Speech API 폴백 — 서버 전사 미설정 시 사용
    type SpeechRecognitionCtor = new () => {
      lang: string;
      continuous: boolean;
      interimResults: boolean;
      onresult: (e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void;
      onerror: (e: { error: string }) => void;
      onend: () => void;
      start: () => void;
      stop: () => void;
    };
    const w = window as unknown as {
      SpeechRecognition?: SpeechRecognitionCtor;
      webkitSpeechRecognition?: SpeechRecognitionCtor;
    };
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Ctor) {
      setStatus("이 브라우저는 Web Speech API를 지원하지 않습니다.");
      return;
    }
    const rec = new Ctor();
    rec.lang = language === "ko" ? "ko-KR" : language;
    rec.continuous = true;
    rec.interimResults = false;
    rec.onresult = (e) => {
      const parts: string[] = [];
      for (let i = 0; i < e.results.length; i++) {
        parts.push(e.results[i][0].transcript);
      }
      setTranscript((prev) => (prev ? `${prev} ${parts.join(" ")}` : parts.join(" ")));
    };
    rec.onerror = (e) => setStatus(`Web Speech 오류: ${e.error}`);
    rec.onend = () => setStatus("Web Speech 종료");
    rec.start();
    setStatus("Web Speech 인식 중... (다시 중지하려면 페이지 새로고침)");
  }

  return (
    <div style={{ maxWidth: 720, margin: "24px auto", padding: 16, fontFamily: "system-ui" }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>음성 메모 → 사건 로그</h1>
      <p style={{ color: "#555", marginBottom: 16 }}>
        마이크로 녹음 후 Whisper API로 전사합니다. 서버측 미설정 시 브라우저 Web Speech API 폴백을 제공합니다.
      </p>

      <section style={{ border: "1px solid #ddd", borderRadius: 8, padding: 16, marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 12, alignItems: "center" }}>
          <label>
            언어:{" "}
            <select value={language} onChange={(e) => setLanguage(e.target.value)}>
              <option value="ko">한국어</option>
              <option value="en">English</option>
              <option value="ja">日本語</option>
              <option value="zh">中文</option>
            </select>
          </label>
          {!recording ? (
            <button onClick={startRecording} disabled={busy} style={btn("#0a7")}>
              녹음 시작
            </button>
          ) : (
            <button onClick={stopRecording} style={btn("#c00")}>
              녹음 중지
            </button>
          )}
          <button onClick={transcribe} disabled={busy || !audioUrl} style={btn("#06c")}>
            서버 전사 (Whisper)
          </button>
          <button onClick={tryBrowserSpeech} disabled={busy} style={btn("#666")}>
            브라우저 폴백
          </button>
        </div>
        {audioUrl && <audio controls src={audioUrl} style={{ width: "100%" }} />}
      </section>

      <section style={{ border: "1px solid #ddd", borderRadius: 8, padding: 16, marginBottom: 16 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>첨부 대상</h2>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <label>
            <input
              type="radio"
              name="target"
              value="none"
              checked={target === "none"}
              onChange={() => setTarget("none")}
            />
            {" "}없음
          </label>
          <label>
            <input
              type="radio"
              name="target"
              value="case"
              checked={target === "case"}
              onChange={() => setTarget("case")}
            />
            {" "}사건 (CaseMatter ID)
          </label>
          <label>
            <input
              type="radio"
              name="target"
              value="inquiry"
              checked={target === "inquiry"}
              onChange={() => setTarget("inquiry")}
            />
            {" "}문의 (Inquiry ID)
          </label>
          {target !== "none" && (
            <input
              type="text"
              placeholder={target === "case" ? "case ID" : "inquiry ID"}
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              style={{ flex: 1, minWidth: 200, padding: 6, border: "1px solid #ccc", borderRadius: 4 }}
            />
          )}
        </div>
      </section>

      <section style={{ border: "1px solid #ddd", borderRadius: 8, padding: 16 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>전사 결과</h2>
        <textarea
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          rows={8}
          style={{ width: "100%", padding: 8, border: "1px solid #ccc", borderRadius: 4 }}
          placeholder="전사된 텍스트가 여기에 표시됩니다..."
        />
        {provider && <div style={{ marginTop: 4, fontSize: 12, color: "#555" }}>Provider: {provider}</div>}
        {browserFallback && (
          <div
            style={{
              marginTop: 8,
              padding: 8,
              background: "#fff8e0",
              border: "1px solid #eb0",
              borderRadius: 4,
              fontSize: 13,
            }}
          >
            {browserFallback}
          </div>
        )}
      </section>

      {status && (
        <div style={{ marginTop: 12, padding: 8, background: "#f0f0f0", borderRadius: 4, fontSize: 13 }}>
          {status}
        </div>
      )}
    </div>
  );
}

function btn(color: string): React.CSSProperties {
  return {
    padding: "8px 14px",
    background: color,
    color: "#fff",
    border: "none",
    borderRadius: 4,
    cursor: "pointer",
    fontWeight: 500,
  };
}
