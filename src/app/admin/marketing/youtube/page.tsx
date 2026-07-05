"use client";

import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type PostRow = { id: string; title: string; publishedAt: string | null; hasBundle: boolean };
type Section = { heading: string; bullets: string[]; narration: string };
type Bundle = {
  blogPostId: string;
  title: string;
  script: string;
  sections: Section[];
  audioUrl: string | null;
  slideUrls: string[];
  generatedAt: string;
  tts: "openai" | "none";
};

export default function YoutubeAdminPage() {
  const [posts, setPosts] = useState<PostRow[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [bundle, setBundle] = useState<Bundle | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPosts = useCallback(async () => {
    const res = await fetch("/api/admin/marketing/youtube/generate", { cache: "no-store" });
    const data = await res.json();
    if (res.ok && data.ok) setPosts(data.posts ?? []);
  }, []);

  const loadBundle = useCallback(async (id: string) => {
    const res = await fetch(`/api/admin/marketing/youtube/generate?blogPostId=${encodeURIComponent(id)}`, {
      cache: "no-store",
    });
    const data = await res.json();
    if (res.ok && data.ok) setBundle(data.bundle ?? null);
  }, []);

  useEffect(() => {
    void loadPosts();
  }, [loadPosts]);

  useEffect(() => {
    if (selected) void loadBundle(selected);
    else setBundle(null);
  }, [selected, loadBundle]);

  const generate = async (force = false) => {
    if (!selected) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/marketing/youtube/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ blogPostId: selected, force }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error ?? "생성 실패");
      } else {
        setBundle(data.bundle);
        await loadPosts();
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <p className="ui-kicker">Marketing · YouTube</p>
        <h1 className="mt-2 ui-page-title">유튜브 컨텐츠 자동 생성</h1>
        <p className="mt-2 text-sm text-text-muted">
          발행된 블로그를 5-8분 스크립트 + TTS + 슬라이드로 변환합니다. TTS 는 OPENAI_API_KEY 필요.
        </p>
        <p className="mt-1 text-xs text-amber-700">유튜브 자동 업로드는 OAuth2 필요 (수동 업로드).</p>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-text-strong">발행된 블로그</h2>
          <ul className="mt-4 space-y-2">
            {posts.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => setSelected(p.id)}
                  className={`w-full rounded-md border p-3 text-left text-sm ${
                    selected === p.id
                      ? "border-navy-500 bg-navy-50"
                      : "border-line hover:bg-neutral-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-text-strong">{p.title}</span>
                    {p.hasBundle && (
                      <span className="ml-2 rounded bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">
                        생성됨
                      </span>
                    )}
                  </div>
                  {p.publishedAt && (
                    <div className="mt-1 text-xs text-text-muted">
                      {new Date(p.publishedAt).toLocaleDateString("ko-KR")}
                    </div>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-text-strong">번들 미리보기</h2>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => void generate(false)} disabled={!selected || busy}>
                {busy ? "생성 중…" : "영상 생성"}
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => void generate(true)}
                disabled={!selected || busy}
              >
                재생성
              </Button>
            </div>
          </div>
          {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}
          {!selected && <p className="mt-4 text-sm text-text-muted">왼쪽에서 블로그를 선택하세요.</p>}
          {selected && !bundle && (
            <p className="mt-4 text-sm text-text-muted">아직 생성된 번들이 없습니다.</p>
          )}
          {bundle && (
            <div className="mt-4 space-y-4">
              {bundle.audioUrl ? (
                <audio controls src={bundle.audioUrl} className="w-full" />
              ) : (
                <p className="text-xs text-amber-700">TTS 미설정 — 스크립트만 사용 가능.</p>
              )}
              <div className="grid grid-cols-2 gap-3">
                {bundle.slideUrls.map((url, i) => (
                  <img
                    key={url}
                    src={url}
                    alt={`슬라이드 ${i + 1}`}
                    className="w-full rounded border border-line"
                  />
                ))}
              </div>
              <details className="rounded-md border border-line p-3 text-sm">
                <summary className="cursor-pointer font-medium">스크립트 전체</summary>
                <pre className="mt-2 whitespace-pre-wrap text-xs text-text-muted">{bundle.script}</pre>
              </details>
              <p className="text-xs text-text-muted">
                유튜브 업로드는 수동입니다. 슬라이드 이미지·mp3 를 다운로드해 편집기에서 결합하세요.
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
