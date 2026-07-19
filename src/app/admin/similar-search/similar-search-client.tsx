"use client";

import { useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";

type Result = {
  id: string;
  title: string;
  contactName: string | null;
  status: string;
  inquiryType: string;
  createdAt: string;
  score: number;
  snippet: string;
};

export function SimilarSearchClient() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);

  const search = async () => {
    if (q.trim().length < 2) return toast.error("2자 이상 입력");
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/inquiries/similar-search?q=${encodeURIComponent(q.trim())}`);
      // api.ok() 는 payload 를 그대로 내보낸다 — data 래퍼가 없다.
      // 예전에는 data.data 를 읽어 10건이 나와도 화면엔 늘 "0건 발견"이었다.
      const data = (await res.json()) as { results?: Result[]; error?: string };
      if (!res.ok) return toast.error(data.error ?? "실패");
      const found = data.results ?? [];
      setResults(found);
      toast.success(`${found.length}건 발견`);
    } catch (err) {
      toast.error(`오류: ${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") search(); }}
          placeholder="자연어로 검색 (예: 자격증 취소, 벌금, 심판...)"
          className="flex-1 rounded-lg border border-line bg-surface px-4 py-2 text-sm"
        />
        <button
          onClick={search}
          disabled={loading}
          className="rounded-lg bg-primary text-white px-4 py-2 text-sm font-medium disabled:opacity-50"
        >
          {loading ? "검색 중…" : "🔍 검색"}
        </button>
      </div>

      {results.length > 0 ? (
        <ul className="space-y-2">
          {results.map((r) => (
            <li key={r.id} className="rounded-lg border border-line bg-surface p-3 hover:bg-surface-muted">
              <div className="flex items-center gap-2">
                <Link href={`/admin/inquiries/${r.id}`} className="text-sm font-bold text-text hover:text-primary line-clamp-1 flex-1">
                  {r.title}
                </Link>
                <span className="rounded-full bg-primary-soft/30 px-2 py-0.5 text-[10px] font-medium text-primary">
                  score {r.score}
                </span>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-text-muted">
                <span>{r.contactName ?? "미상"}</span>
                <span>·</span>
                <span>{r.status}</span>
                <span>·</span>
                <span>{r.inquiryType}</span>
                <span>·</span>
                <span>{new Date(r.createdAt).toLocaleDateString("ko-KR")}</span>
              </div>
              <p className="mt-1 text-xs text-text line-clamp-2">{r.snippet}</p>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
