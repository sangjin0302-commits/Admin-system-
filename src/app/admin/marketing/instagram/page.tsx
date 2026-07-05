"use client";

import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Bundle = {
  id: string;
  sourceType: "precedent" | "blog" | "news" | "custom";
  sourceId: string | null;
  title: string;
  caption: string;
  hashtags: string[];
  slides: { heading: string; body: string }[];
  slideUrls: string[];
  generatedAt: string;
};

export default function InstagramAdminPage() {
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [sourceType, setSourceType] = useState<"precedent" | "blog" | "news" | "custom">("blog");
  const [sourceId, setSourceId] = useState("");
  const [customText, setCustomText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [current, setCurrent] = useState<Bundle | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/marketing/instagram/generate", { cache: "no-store" });
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
      const res = await fetch("/api/admin/marketing/instagram/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          sourceType,
          sourceId: sourceType === "custom" ? undefined : sourceId,
          customText: sourceType === "custom" ? customText : undefined,
        }),
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

  const copyCaption = async (b: Bundle) => {
    const text = `${b.caption}\n\n${b.hashtags.join(" ")}`;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <p className="ui-kicker">Marketing · Instagram</p>
        <h1 className="mt-2 ui-page-title">인스타그램 카드뉴스</h1>
        <p className="mt-2 text-sm text-text-muted">
          판례·블로그·뉴스에서 카드뉴스 5-8장을 자동 생성합니다. 슬라이드 SVG 를 다운로드해 업로드하세요.
        </p>
        <p className="mt-1 text-xs text-amber-700">인스타그램 자동 게시는 비즈니스 계정 + Graph API 필요.</p>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold text-text-strong">생성기</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div>
            <label className="text-xs font-medium text-text-muted">소스 타입</label>
            <select
              value={sourceType}
              onChange={(e) => setSourceType(e.target.value as typeof sourceType)}
              className="mt-1 w-full rounded-md border border-line p-2 text-sm"
            >
              <option value="blog">블로그</option>
              <option value="precedent">판례</option>
              <option value="news">뉴스</option>
              <option value="custom">직접 입력</option>
            </select>
          </div>
          {sourceType !== "custom" ? (
            <div className="md:col-span-2">
              <label className="text-xs font-medium text-text-muted">소스 ID</label>
              <input
                value={sourceId}
                onChange={(e) => setSourceId(e.target.value)}
                className="mt-1 w-full rounded-md border border-line p-2 text-sm font-mono"
                placeholder="예: blogPost id 또는 precedent id"
              />
            </div>
          ) : (
            <div className="md:col-span-2">
              <label className="text-xs font-medium text-text-muted">주제 텍스트</label>
              <textarea
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                className="mt-1 min-h-[80px] w-full rounded-md border border-line p-2 text-sm"
                placeholder="카드뉴스 주제를 자유롭게 입력하세요."
              />
            </div>
          )}
        </div>
        <div className="mt-4">
          <Button size="sm" onClick={() => void generate()} disabled={busy}>
            {busy ? "생성 중…" : "카드뉴스 생성"}
          </Button>
          {error && <span className="ml-3 text-sm text-rose-600">{error}</span>}
        </div>
      </Card>

      {current && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-text-strong">방금 생성한 번들</h2>
          <p className="mt-2 text-sm text-text-strong">{current.title}</p>
          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
            {current.slideUrls.map((url, i) => (
              <a key={url} href={url} download={`slide-${i + 1}.svg`}>
                <img
                  src={url}
                  alt={`슬라이드 ${i + 1}`}
                  className="w-full rounded border border-line"
                />
              </a>
            ))}
          </div>
          <div className="mt-4 rounded-md border border-line p-3 text-sm">
            <div className="font-medium">캡션</div>
            <p className="mt-1 whitespace-pre-wrap text-text-muted">{current.caption}</p>
            <p className="mt-2 text-xs text-text-muted">{current.hashtags.join(" ")}</p>
            <Button size="sm" variant="secondary" className="mt-3" onClick={() => void copyCaption(current)}>
              캡션 복사
            </Button>
          </div>
        </Card>
      )}

      <Card className="p-6">
        <h2 className="text-lg font-semibold text-text-strong">최근 번들</h2>
        <ul className="mt-4 space-y-3">
          {bundles.map((b) => (
            <li key={b.id} className="rounded-lg border border-line p-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-medium text-text-strong">{b.title}</span>
                <span className="text-xs text-text-muted">
                  {b.sourceType} · {new Date(b.generatedAt).toLocaleString("ko-KR")}
                </span>
              </div>
              <div className="mt-2 flex gap-2 overflow-x-auto">
                {b.slideUrls.slice(0, 5).map((url, i) => (
                  <img
                    key={url}
                    src={url}
                    alt={`s${i}`}
                    className="h-20 w-20 flex-none rounded border border-line"
                  />
                ))}
              </div>
            </li>
          ))}
          {bundles.length === 0 && <p className="text-sm text-text-muted">아직 번들이 없습니다.</p>}
        </ul>
      </Card>
    </div>
  );
}
