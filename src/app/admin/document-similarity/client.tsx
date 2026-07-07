"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type {
  SimilarDocumentRef,
  SimilarityLink,
  SimilarityResult,
} from "@/lib/services/document-similarity-service";

type RecentRow = {
  draft: SimilarDocumentRef;
  similarityScore: number;
  mostSimilarDocId?: string;
};

export default function DocumentSimilarityClient({
  recent: initialRecent,
  links: initialLinks,
  enabled,
}: {
  recent: RecentRow[];
  links: SimilarityLink[];
  enabled: boolean;
}) {
  const [recent, setRecent] = useState(initialRecent);
  const [links, setLinks] = useState(initialLinks);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<SimilarityResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [linkBusy, setLinkBusy] = useState<string | null>(null);

  async function reload() {
    const res = await fetch("/api/admin/document-similarity");
    const data = await res.json();
    if (data.ok) {
      setRecent(data.recent);
      setLinks(data.links);
    }
  }

  async function runCheck() {
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/admin/document-similarity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) setError(data.error ?? "실패");
      else setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "네트워크 오류");
    } finally {
      setBusy(false);
    }
  }

  async function doLink(newId: string, priorId: string) {
    setLinkBusy(newId);
    try {
      await fetch("/api/admin/document-similarity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "link", newDocId: newId, priorDocId: priorId, reason: "재사용" }),
      });
      await reload();
    } finally {
      setLinkBusy(null);
    }
  }

  async function doIgnore(id: string) {
    setLinkBusy(id);
    try {
      await fetch("/api/admin/document-similarity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "ignore", newDocId: id }),
      });
      await reload();
    } finally {
      setLinkBusy(null);
    }
  }

  function scoreClass(s: number): string {
    if (s > 0.7) return "bg-rose-100 text-rose-700";
    if (s > 0.4) return "bg-amber-100 text-amber-700";
    if (s > 0.15) return "bg-sky-100 text-sky-700";
    return "bg-emerald-100 text-emerald-700";
  }

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <p className="mb-2 text-sm font-medium text-text-strong">텍스트 유사도 검사</p>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={10}
          placeholder="신규 초안 텍스트를 붙여넣으세요"
          className="w-full rounded-md border border-line bg-white px-3 py-2 text-xs"
        />
        <div className="mt-2 flex items-center gap-2">
          <Button
            variant="primary"
            size="md"
            onClick={runCheck}
            disabled={busy || !enabled || !text.trim()}
          >
            {busy ? "검사 중..." : "유사도 검사"}
          </Button>
          {!enabled && <span className="text-xs text-rose-700">플래그 off</span>}
        </div>
        {error && (
          <div className="mt-3 rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
            {error}
          </div>
        )}
        {result && (
          <div className="mt-3 space-y-2 text-xs">
            <p
              className={
                "rounded p-2 font-semibold " + scoreClass(result.similarityScore)
              }
            >
              최고 유사도 {(result.similarityScore * 100).toFixed(1)}% · 비교 {result.comparedCount}건
              {result.similarityScore > result.threshold && " · 재사용 추적 권장"}
            </p>
            {result.mostSimilarDoc && (
              <div className="rounded border border-line p-2">
                <p className="font-semibold">
                  가장 유사한 문서: {result.mostSimilarDoc.title}
                </p>
                <p className="text-text-muted">
                  {new Date(result.mostSimilarDoc.createdAt).toLocaleString("ko-KR")} · 문의{" "}
                  {result.mostSimilarDoc.inquiryId}
                </p>
                <p className="mt-1 text-text-muted">{result.mostSimilarDoc.excerpt}</p>
              </div>
            )}
            {result.matchedSegments.length > 0 && (
              <details>
                <summary className="cursor-pointer text-text-muted">
                  매칭 세그먼트 {result.matchedSegments.length}건
                </summary>
                <ul className="mt-1 list-disc pl-5">
                  {result.matchedSegments.map((s, i) => (
                    <li key={i}>
                      <span className="font-mono">"{s.ngram}"</span>{" "}
                      <span className="text-text-muted">@{s.approxOffset}</span>
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        )}
      </Card>

      <Card className="p-4">
        <p className="mb-2 text-sm font-medium text-text-strong">최근 초안 유사도 스코어</p>
        {recent.length === 0 ? (
          <p className="text-xs text-text-muted">최근 문서가 없습니다.</p>
        ) : (
          <table className="w-full text-xs">
            <thead className="text-left text-text-muted">
              <tr>
                <th className="py-1">문서</th>
                <th>유사도</th>
                <th>가장 유사한 문서</th>
                <th>동작</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((r) => (
                <tr key={r.draft.id} className="border-t border-line">
                  <td className="py-1">
                    <p className="font-semibold">{r.draft.title}</p>
                    <p className="text-text-muted">
                      {new Date(r.draft.createdAt).toLocaleString("ko-KR")}
                    </p>
                  </td>
                  <td>
                    <span
                      className={
                        "rounded px-1.5 py-0.5 font-semibold " + scoreClass(r.similarityScore)
                      }
                    >
                      {(r.similarityScore * 100).toFixed(1)}%
                    </span>
                  </td>
                  <td className="font-mono text-text-muted">{r.mostSimilarDocId ?? "—"}</td>
                  <td>
                    <div className="flex gap-1">
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={!r.mostSimilarDocId || linkBusy === r.draft.id}
                        onClick={() => r.mostSimilarDocId && doLink(r.draft.id, r.mostSimilarDocId)}
                      >
                        재사용 표시
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={linkBusy === r.draft.id}
                        onClick={() => doIgnore(r.draft.id)}
                      >
                        완전 새로 작성
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Card className="p-4">
        <p className="mb-2 text-sm font-medium text-text-strong">재사용 링크 기록</p>
        {links.length === 0 ? (
          <p className="text-xs text-text-muted">기록 없음</p>
        ) : (
          <ul className="space-y-1 text-xs">
            {links.slice(0, 30).map((l, i) => (
              <li key={i} className="rounded border border-line p-2">
                <span className="font-mono">{l.newDocId}</span> ← reuses ←{" "}
                <span className="font-mono">{l.priorDocId}</span>
                <span className="ml-2 text-text-muted">
                  {new Date(l.createdAt).toLocaleString("ko-KR")}
                </span>
                {l.reason && <span className="ml-2 text-text-muted">({l.reason})</span>}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
