"use client";

import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Bundle = {
  id: string;
  topic: string;
  script: string;
  captions: string[];
  audioUrl: string | null;
  slideUrls: string[];
  generatedAt: string;
  tts: "openai" | "none";
};

export default function ShortsAdminPage() {
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [topic, setTopic] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [current, setCurrent] = useState<Bundle | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/marketing/shorts/generate", { cache: "no-store" });
    const data = await res.json();
    if (res.ok && data.ok) setBundles(data.bundles ?? []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const generate = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/marketing/shorts/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ topic: topic.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error ?? "생성 실패");
      } else {
        setCurrent(data.bundle);
        await load();
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <p className="ui-kicker">Marketing · Shorts</p>
        <h1 className="mt-2 ui-page-title">쇼츠 / 틱톡 30초 자동 생성</h1>
        <p className="mt-2 text-sm text-text-muted">
          9:16 세로 슬라이드 + 30초 TTS. 주제 미입력 시 최근 문의에서 자동 선택.
        </p>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold text-text-strong">생성기</h2>
        <div className="mt-3">
          <label className="text-xs font-medium text-text-muted">주제 (선택)</label>
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="mt-1 w-full rounded-md border border-line p-2 text-sm"
            placeholder="예: 외국인 D-8 비자 갱신 시 실수하기 쉬운 서류"
          />
        </div>
        <div className="mt-4">
          <Button size="sm" onClick={() => void generate()} disabled={busy}>
            {busy ? "생성 중…" : "쇼츠 생성"}
          </Button>
          {error && <span className="ml-3 text-sm text-rose-600">{error}</span>}
        </div>
      </Card>

      {current && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-text-strong">방금 생성한 번들</h2>
          <p className="mt-1 text-xs text-text-muted">주제: {current.topic}</p>
          {current.audioUrl ? (
            <audio controls src={current.audioUrl} className="mt-3 w-full" />
          ) : (
            <p className="mt-3 text-xs text-amber-700">TTS 미설정.</p>
          )}
          <p className="mt-3 rounded-md border border-line p-3 text-sm text-text-strong">{current.script}</p>
          <div className="mt-3 flex gap-3 overflow-x-auto">
            {current.slideUrls.map((url, i) => (
              <a key={url} href={url} download={`short-${i + 1}.svg`}>
                <img
                  src={url}
                  alt={`슬라이드 ${i + 1}`}
                  className="h-64 w-36 flex-none rounded border border-line"
                />
              </a>
            ))}
          </div>
        </Card>
      )}

      <Card className="p-6">
        <h2 className="text-lg font-semibold text-text-strong">최근 번들</h2>
        <ul className="mt-4 space-y-3">
          {bundles.map((b) => (
            <li key={b.id} className="rounded-lg border border-line p-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-medium text-text-strong">{b.topic}</span>
                <span className="text-xs text-text-muted">
                  {new Date(b.generatedAt).toLocaleString("ko-KR")} · {b.tts === "openai" ? "mp3" : "텍스트만"}
                </span>
              </div>
              <p className="mt-1 text-xs text-text-muted">{b.script}</p>
            </li>
          ))}
          {bundles.length === 0 && <p className="text-sm text-text-muted">아직 번들이 없습니다.</p>}
        </ul>
      </Card>
    </div>
  );
}
