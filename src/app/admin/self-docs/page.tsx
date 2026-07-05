"use client";

import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type DocCategory = "feature" | "config" | "env";

export default function AdminSelfDocsPage() {
  const [tab, setTab] = useState<DocCategory>("feature");
  const [previews, setPreviews] = useState<Record<DocCategory, string> | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/self-docs", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok || !data.ok) setError(data.error ?? "조회 실패");
      else setPreviews(data.previews);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const regenerate = useCallback(async () => {
    setBusy(true);
    setFlash(null);
    try {
      const res = await fetch("/api/admin/self-docs", { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.ok) setError(data.error ?? "재생성 실패");
      else {
        setFlash(`문서 ${data.docs.length}개 재생성 완료`);
        await load();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }, [load]);

  const tabs: Array<{ key: DocCategory; label: string }> = [
    { key: "feature", label: "기능 플래그" },
    { key: "config", label: "사이트 설정" },
    { key: "env", label: "환경 변수" },
  ];

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">자기 문서화 시스템</h1>
        <Button onClick={regenerate} disabled={busy}>
          {busy ? "재생성 중..." : "재생성"}
        </Button>
      </div>
      {error && <div className="text-red-600 text-sm">{error}</div>}
      {flash && <div className="text-green-600 text-sm">{flash}</div>}
      <div className="flex gap-2 border-b">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-3 py-2 text-sm ${
              tab === t.key ? "border-b-2 border-blue-500 font-medium" : "text-gray-500"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <Card className="p-4">
        {loading ? (
          <div className="text-sm text-gray-500">불러오는 중...</div>
        ) : (
          <pre className="whitespace-pre-wrap text-xs font-mono overflow-auto max-h-[600px]">
            {previews?.[tab] ?? "문서 없음"}
          </pre>
        )}
      </Card>
    </div>
  );
}
