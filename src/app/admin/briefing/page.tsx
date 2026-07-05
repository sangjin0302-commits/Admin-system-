"use client";

import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type BriefingRecord = {
  date: string;
  text: string;
  audioUrl: string | null;
  tts: "openai" | "none";
  generatedAt: string;
  stats: {
    dueToday: number;
    unresponded24h: number;
    newInquiries: number;
    acceptanceRate: number;
  };
};

export default function AdminBriefingPage() {
  const [today, setToday] = useState<BriefingRecord | null>(null);
  const [archive, setArchive] = useState<BriefingRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<boolean>(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [todayRes, listRes] = await Promise.all([
        fetch("/api/admin/briefing/audio", { cache: "no-store" }),
        fetch("/api/admin/briefing/audio?list=1", { cache: "no-store" }),
      ]);
      const todayData = await todayRes.json();
      const listData = await listRes.json();
      if (!todayRes.ok || !todayData.ok) {
        setError(todayData.error ?? "브리핑 조회 실패");
      } else {
        setToday(todayData.record ?? null);
      }
      if (listRes.ok && listData.ok) {
        setArchive(listData.items ?? []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const regenerate = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/briefing/audio", { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error ?? "재생성 실패");
        return;
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <p className="ui-kicker">Audio Briefing</p>
        <h1 className="mt-2 ui-page-title">아침 오디오 브리핑</h1>
        <p className="mt-2 text-sm text-text-muted">
          매일 아침 자동 생성되는 오디오 브리핑. OpenAI TTS 가 설정된 경우 mp3 로 재생 가능하며,
          아니면 텍스트로만 제공됩니다.
        </p>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text-strong">
            오늘의 브리핑 {today ? `(${today.date})` : ""}
          </h2>
          <Button size="sm" onClick={() => void regenerate()} disabled={busy || loading}>
            {busy ? "재생성 중…" : "재생성"}
          </Button>
        </div>
        {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}
        {loading && !today && <p className="mt-3 text-sm text-text-muted">불러오는 중…</p>}
        {today && (
          <div className="mt-4 space-y-3">
            {today.audioUrl ? (
              <audio controls src={today.audioUrl} className="w-full" />
            ) : (
              <p className="text-xs text-amber-700">
                TTS 미설정 — 텍스트만 제공됩니다 (환경변수 OPENAI_API_KEY 설정 시 mp3 생성).
              </p>
            )}
            <p className="text-sm text-text-strong">{today.text}</p>
            <ul className="mt-3 grid grid-cols-2 gap-2 text-xs md:grid-cols-4">
              <li className="rounded-lg border border-line p-3">
                <div className="text-text-muted">오늘 마감</div>
                <div className="mt-1 text-lg font-semibold text-text-strong">{today.stats.dueToday}</div>
              </li>
              <li className="rounded-lg border border-line p-3">
                <div className="text-text-muted">24H 미응답</div>
                <div className="mt-1 text-lg font-semibold text-text-strong">{today.stats.unresponded24h}</div>
              </li>
              <li className="rounded-lg border border-line p-3">
                <div className="text-text-muted">신규 의뢰</div>
                <div className="mt-1 text-lg font-semibold text-text-strong">{today.stats.newInquiries}</div>
              </li>
              <li className="rounded-lg border border-line p-3">
                <div className="text-text-muted">수임률</div>
                <div className="mt-1 text-lg font-semibold text-text-strong">{today.stats.acceptanceRate}%</div>
              </li>
            </ul>
            <p className="text-xs text-text-muted">생성: {new Date(today.generatedAt).toLocaleString("ko-KR")}</p>
          </div>
        )}
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold text-text-strong">최근 7일 아카이브</h2>
        {archive.length === 0 && (
          <p className="mt-3 text-sm text-text-muted">아카이브가 없습니다.</p>
        )}
        <ul className="mt-4 space-y-3">
          {archive.map((r) => (
            <li key={r.date} className="rounded-lg border border-line p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-text-strong">{r.date}</span>
                <span className="text-xs text-text-muted">{r.tts === "openai" ? "mp3" : "텍스트만"}</span>
              </div>
              {r.audioUrl && <audio controls src={r.audioUrl} className="mt-2 w-full" />}
              <p className="mt-2 text-xs text-text-muted">{r.text}</p>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
