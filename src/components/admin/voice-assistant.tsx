"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { matchCommand } from "@/lib/services/voice-command-service";

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((e: unknown) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

export function VoiceAssistant() {
  const router = useRouter();
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [supported, setSupported] = useState(true);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const W = window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionLike;
      webkitSpeechRecognition?: new () => SpeechRecognitionLike;
    };
    const Ctor = W.SpeechRecognition ?? W.webkitSpeechRecognition;
    if (!Ctor) {
      setSupported(false);
      return;
    }
    const rec = new Ctor();
    rec.lang = "ko-KR";
    rec.continuous = false;
    rec.interimResults = true;
    rec.onresult = (e) => {
      let txt = "";
      for (let i = 0; i < e.results.length; i++) {
        txt += e.results[i][0].transcript;
      }
      setTranscript(txt);
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    recognitionRef.current = rec;
  }, []);

  function speak(text: string) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "ko-KR";
    window.speechSynthesis.speak(u);
  }

  function handleStart() {
    if (!recognitionRef.current) return;
    setTranscript("");
    setFeedback(null);
    setListening(true);
    try {
      recognitionRef.current.start();
    } catch {
      setListening(false);
    }
  }

  function handleStop() {
    if (!recognitionRef.current) return;
    recognitionRef.current.stop();
    setListening(false);
    if (transcript) {
      executeCommand(transcript);
    }
  }

  function executeCommand(text: string) {
    const cmd = matchCommand(text);
    if (!cmd) {
      const msg = "명령을 이해하지 못했습니다.";
      setFeedback(msg);
      speak(msg);
      return;
    }
    if (cmd.action.type === "navigate") {
      const msg = `${cmd.description}으로 이동합니다.`;
      setFeedback(msg);
      speak(msg);
      router.push(cmd.action.href);
    } else if (cmd.action.type === "toast") {
      setFeedback(cmd.action.message);
      speak(cmd.action.message);
    } else if (cmd.action.type === "query") {
      const msg = `${cmd.description}을 확인 중입니다.`;
      setFeedback(msg);
      speak(msg);
    }
  }

  if (!supported) return null;

  return (
    <div className="fixed bottom-6 right-6 z-40 w-72 rounded-xl border border-line bg-surface p-4 shadow-floating">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-text-muted">
          음성 비서
        </span>
        <span
          className={
            listening ? "h-2 w-2 rounded-full bg-red-500 animate-pulse" : "h-2 w-2 rounded-full bg-text-muted"
          }
        />
      </div>
      <button
        type="button"
        onMouseDown={handleStart}
        onMouseUp={handleStop}
        onTouchStart={handleStart}
        onTouchEnd={handleStop}
        className="w-full rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white"
      >
        {listening ? "듣는 중... (놓으면 실행)" : "꾹 눌러서 말하기"}
      </button>
      {transcript && (
        <p className="mt-2 text-xs text-text-strong">
          <span className="text-text-muted">인식:</span> {transcript}
        </p>
      )}
      {feedback && (
        <p className="mt-1 text-xs text-primary">{feedback}</p>
      )}
    </div>
  );
}
