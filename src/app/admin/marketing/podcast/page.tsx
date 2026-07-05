"use client";

import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Episode = {
  id: string;
  episodeNumber: number;
  title: string;
  script: string;
  audioUrl: string | null;
  durationSec: number | null;
  publishedAt: string;
  tts: "openai" | "none";
  sources: { blogPostIds: string[]; newsHeadlines: string[] };
};

export default function PodcastAdminPage() {
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rssUrl, setRssUrl] = useState<string>("");

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/marketing/podcast", { cache: "no-store" });
    const data = await res.json();
    if (res.ok && data.ok) setEpisodes(data.episodes ?? []);
    if (typeof window !== "undefined") {
      setRssUrl(`${window.location.origin}/api/podcast/feed.xml`);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const generate = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/marketing/podcast", { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.ok) setError(data.error ?? "생성 실패");
      await load();
    } finally {
      setBusy(false);
    }
  };

  const copyRss = async () => {
    try {
      await navigator.clipboard.writeText(rssUrl);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <p className="ui-kicker">Marketing · Podcast</p>
        <h1 className="mt-2 ui-page-title">팟캐스트 시리즈</h1>
        <p className="mt-2 text-sm text-text-muted">
          매주 수요일 자동 생성 (지난 7일 블로그 + 뉴스). Spotify/Apple 팟캐스트에 아래 RSS URL 을 등록하세요.
        </p>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold text-text-strong">배포 RSS</h2>
        <div className="mt-2 flex items-center gap-2">
          <input
            readOnly
            value={rssUrl}
            className="flex-1 rounded-md border border-line p-2 text-sm font-mono"
          />
          <Button size="sm" variant="secondary" onClick={() => void copyRss()}>
            복사
          </Button>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text-strong">에피소드</h2>
          <Button size="sm" onClick={() => void generate()} disabled={busy}>
            {busy ? "생성 중…" : "이번주 에피소드 생성"}
          </Button>
        </div>
        {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}
        <ul className="mt-4 space-y-4">
          {episodes.map((e) => (
            <li key={e.id} className="rounded-lg border border-line p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-text-strong">{e.title}</h3>
                <span className="text-xs text-text-muted">
                  {new Date(e.publishedAt).toLocaleDateString("ko-KR")} · {e.tts === "openai" ? "mp3" : "텍스트만"}
                </span>
              </div>
              {e.audioUrl ? (
                <audio controls src={e.audioUrl} className="mt-3 w-full" />
              ) : (
                <p className="mt-3 text-xs text-amber-700">TTS 미설정.</p>
              )}
              <details className="mt-3 text-sm">
                <summary className="cursor-pointer font-medium">스크립트</summary>
                <pre className="mt-2 whitespace-pre-wrap text-xs text-text-muted">{e.script}</pre>
              </details>
            </li>
          ))}
          {episodes.length === 0 && (
            <p className="text-sm text-text-muted">아직 에피소드가 없습니다.</p>
          )}
        </ul>
      </Card>
    </div>
  );
}
