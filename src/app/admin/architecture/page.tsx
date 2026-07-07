"use client";

import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type LayerCount = {
  service: number;
  route: number;
  page: number;
  other: number;
};

type ArchState = {
  mermaid: string;
  summary: {
    totalNodes: number;
    totalEdges: number;
    byLayer: LayerCount;
  };
  generatedAt: string;
  path?: string;
};

export default function AdminArchitecturePage() {
  const [data, setData] = useState<ArchState | null>(null);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filter.trim()) params.set("module", filter.trim());
      const res = await fetch(`/api/admin/architecture?${params.toString()}`, {
        cache: "no-store",
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json.error ?? "조회 실패");
      } else {
        setData({
          mermaid: json.mermaid,
          summary: json.summary,
          generatedAt: json.generatedAt,
          path: json.path,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  const regenerate = useCallback(async () => {
    setBusy(true);
    setFlash(null);
    setError(null);
    try {
      const res = await fetch("/api/admin/architecture", { method: "POST" });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json.error ?? "재생성 실패");
      } else {
        setFlash(
          `아키텍처 다이어그램 재생성 완료 (nodes=${json.summary.totalNodes}, edges=${json.summary.totalEdges})`
        );
        await load();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }, [load]);

  const copyMarkup = useCallback(async () => {
    if (!data?.mermaid) return;
    try {
      await navigator.clipboard.writeText(data.mermaid);
      setFlash("Mermaid 마크업을 클립보드에 복사했습니다");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, [data]);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-semibold">자동 아키텍처 다이어그램</h1>
          <p className="text-sm text-gray-500">
            src/ 스캔 기반 서비스 → 라우트 → 페이지 의존성 그래프 (Mermaid)
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={copyMarkup} disabled={!data} className="bg-gray-200 text-gray-800">
            마크업 복사
          </Button>
          <Button onClick={regenerate} disabled={busy}>
            {busy ? "재생성 중..." : "재생성"}
          </Button>
        </div>
      </div>

      {error && <div className="text-red-600 text-sm">{error}</div>}
      {flash && <div className="text-green-600 text-sm">{flash}</div>}

      <Card className="p-4 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-sm font-medium">모듈 필터:</label>
          <input
            type="text"
            className="border rounded px-2 py-1 text-sm"
            placeholder="예: services, api, admin"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
          <Button onClick={load} className="bg-gray-100 text-gray-800 text-sm">
            적용
          </Button>
        </div>
        {data && (
          <div className="text-xs text-gray-500 flex flex-wrap gap-3">
            <span>노드: {data.summary.totalNodes}</span>
            <span>엣지: {data.summary.totalEdges}</span>
            <span>service: {data.summary.byLayer.service}</span>
            <span>route: {data.summary.byLayer.route}</span>
            <span>page: {data.summary.byLayer.page}</span>
            <span>생성: {new Date(data.generatedAt).toLocaleString("ko-KR")}</span>
          </div>
        )}
      </Card>

      <Card className="p-4">
        {loading ? (
          <div className="text-sm text-gray-500">불러오는 중...</div>
        ) : (
          <>
            <p className="text-xs text-gray-500 mb-2">
              아래 Mermaid 마크업을{" "}
              <a
                href="https://mermaid.live"
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 underline"
              >
                mermaid.live
              </a>{" "}
              또는 GitHub Markdown에 붙여넣어 시각화할 수 있습니다.
            </p>
            <pre className="whitespace-pre-wrap text-xs font-mono overflow-auto max-h-[600px] bg-gray-50 p-3 rounded">
              {data?.mermaid ?? "다이어그램 없음. 재생성을 눌러 초기화하세요."}
            </pre>
          </>
        )}
      </Card>
    </div>
  );
}
